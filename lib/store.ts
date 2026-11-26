import { Pool } from "pg";
import { config, databaseEnabled } from "./config";
import type {
  AnalysisResult,
  AnalyticsEvent,
  Payment,
  ScanSummary,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Persistence layer — the full PRD data model: Users, PalmScans, Reports,
// Payments, plus analytics events.
//
// - Postgres (tables: palm_users, palm_scans, palm_payments, palm_events)
//   when DATABASE_URL is configured (see db/schema.sql).
// - In-memory Map fallback otherwise, so the app runs with zero setup.
//
// The full reading (incl. premium "Reports") is stored on the scan row and
// only returned to clients after payment (gated in the API layer).
// ---------------------------------------------------------------------------

export interface ScanRecord {
  id: string;
  ownerKey: string; // userId or anonId that owns this scan
  result: AnalysisResult; // full result incl. premium report
  paid: boolean;
  image?: string; // optional stored palm image (data URL), opt-in only
  personName?: string; // whose palm this is (named by a signed-in user)
  createdAt: string;
}

interface Store {
  // scans
  saveScan(record: ScanRecord): Promise<void>;
  getScan(id: string): Promise<ScanRecord | null>;
  setPaid(id: string): Promise<void>;
  setScanOwner(id: string, ownerKey: string): Promise<void>;
  listScansByOwner(ownerKey: string): Promise<ScanSummary[]>;
  countScansByOwner(ownerKey: string): Promise<number>;
  /** Scans from today (UTC) by this owner that used the paid AI tier. */
  countPaidScansToday(ownerKey: string): Promise<number>;
  /** "Ask the Astrologer" replies sent today (UTC) to this owner. */
  countChatMessagesToday(ownerKey: string): Promise<number>;
  /** Paid palm-vision reads served today (UTC) to this client IP. */
  countPaidScansTodayByIp(ip: string): Promise<number>;
  reassignOwner(fromKey: string, toKey: string): Promise<void>;

  // users
  createUser(user: User): Promise<void>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByVerifyToken(token: string): Promise<User | null>;
  setVerified(userId: string): Promise<void>;
  countUsers(): Promise<number>;

  // payments
  recordPayment(payment: Payment): Promise<void>;

  // analytics
  recordEvent(event: AnalyticsEvent): Promise<void>;
  getEvents(): Promise<AnalyticsEvent[]>;
  getPayments(): Promise<Payment[]>;
  recentScans(limit: number): Promise<ScanSummary[]>;

  // daily email: registered users who own a paid scan (most recent paid scan).
  listDailyEmailRecipients(): Promise<{ email: string; scanId: string }[]>;
}

function toSummary(r: ScanRecord): ScanSummary {
  const top = r.result.lines[0];
  return {
    id: r.id,
    createdAt: r.createdAt,
    handedness: r.result.handedness,
    paid: r.paid,
    personName: r.personName,
    topLine: top ? { label: top.label, pattern: top.pattern, color: top.color } : undefined,
    hasImage: Boolean(r.image),
  };
}

// --- in-memory implementation ----------------------------------------------

class MemoryStore implements Store {
  private scans = new Map<string, ScanRecord>();
  private users = new Map<string, User>(); // id -> user
  private usersByEmail = new Map<string, string>(); // email -> id
  private payments: Payment[] = [];
  private events: AnalyticsEvent[] = [];

  async saveScan(record: ScanRecord) {
    this.scans.set(record.id, record);
  }
  async getScan(id: string) {
    return this.scans.get(id) ?? null;
  }
  async setPaid(id: string) {
    const r = this.scans.get(id);
    if (r) r.paid = true;
  }
  async setScanOwner(id: string, ownerKey: string) {
    const r = this.scans.get(id);
    if (r) r.ownerKey = ownerKey;
  }
  async listScansByOwner(ownerKey: string) {
    return [...this.scans.values()]
      .filter((r) => r.ownerKey === ownerKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toSummary);
  }
  async countScansByOwner(ownerKey: string) {
    let n = 0;
    for (const r of this.scans.values()) if (r.ownerKey === ownerKey) n++;
    return n;
  }
  async countPaidScansToday(ownerKey: string) {
    const today = new Date().toISOString().slice(0, 10);
    let n = 0;
    for (const r of this.scans.values()) {
      if (r.ownerKey === ownerKey && r.result.aiTier === "paid" && r.createdAt.slice(0, 10) === today) n++;
    }
    return n;
  }
  async countChatMessagesToday(ownerKey: string) {
    const today = new Date().toISOString().slice(0, 10);
    let n = 0;
    for (const e of this.events) {
      if (e.name === "astrologer_question" && e.ownerKey === ownerKey && e.createdAt.slice(0, 10) === today) n++;
    }
    return n;
  }
  async countPaidScansTodayByIp(ip: string) {
    const today = new Date().toISOString().slice(0, 10);
    let n = 0;
    for (const e of this.events) {
      if (e.name === "paid_scan_ip" && e.ownerKey === ip && e.createdAt.slice(0, 10) === today) n++;
    }
    return n;
  }
  async reassignOwner(fromKey: string, toKey: string) {
    for (const r of this.scans.values()) if (r.ownerKey === fromKey) r.ownerKey = toKey;
  }
  async createUser(user: User) {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
  }
  async getUserByEmail(email: string) {
    const id = this.usersByEmail.get(email.toLowerCase());
    return id ? this.users.get(id) ?? null : null;
  }
  async getUserById(id: string) {
    return this.users.get(id) ?? null;
  }
  async getUserByVerifyToken(token: string) {
    for (const u of this.users.values()) if (u.verifyToken && u.verifyToken === token) return u;
    return null;
  }
  async setVerified(userId: string) {
    const u = this.users.get(userId);
    if (u) {
      u.verified = true;
      u.verifyToken = null;
    }
  }
  async countUsers() {
    return this.users.size;
  }
  async recordPayment(payment: Payment) {
    this.payments.push(payment);
  }
  async recordEvent(event: AnalyticsEvent) {
    this.events.push(event);
  }
  async getEvents() {
    return this.events;
  }
  async getPayments() {
    return this.payments;
  }
  async recentScans(limit: number) {
    return [...this.scans.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(toSummary);
  }
  async listDailyEmailRecipients() {
    const out: { email: string; scanId: string }[] = [];
    for (const user of this.users.values()) {
      const paid = [...this.scans.values()]
        .filter((s) => s.ownerKey === user.id && s.paid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (paid) out.push({ email: user.email, scanId: paid.id });
    }
    return out;
  }
}

// --- postgres implementation -------------------------------------------------

class PostgresStore implements Store {
  private pool: Pool;
  constructor() {
    this.pool = new Pool({ connectionString: config.database.url });
  }
  async saveScan(r: ScanRecord) {
    await this.pool.query(
      `insert into palm_scans (id, owner_key, result, paid, image, person_name, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
         owner_key = excluded.owner_key, result = excluded.result, paid = excluded.paid,
         image = excluded.image, person_name = excluded.person_name`,
      [r.id, r.ownerKey, r.result, r.paid, r.image ?? null, r.personName ?? null, r.createdAt]
    );
  }
  async getScan(id: string) {
    const { rows } = await this.pool.query("select * from palm_scans where id = $1", [id]);
    return rows[0] ? this.row(rows[0]) : null;
  }
  async setPaid(id: string) {
    await this.pool.query("update palm_scans set paid = true where id = $1", [id]);
  }
  async setScanOwner(id: string, ownerKey: string) {
    await this.pool.query("update palm_scans set owner_key = $1 where id = $2", [ownerKey, id]);
  }
  async listScansByOwner(ownerKey: string) {
    const { rows } = await this.pool.query(
      "select * from palm_scans where owner_key = $1 order by created_at desc",
      [ownerKey]
    );
    return rows.map((d) => toSummary(this.row(d)));
  }
  async countScansByOwner(ownerKey: string) {
    const { rows } = await this.pool.query(
      "select count(*)::int as n from palm_scans where owner_key = $1",
      [ownerKey]
    );
    return rows[0]?.n ?? 0;
  }
  async countPaidScansToday(ownerKey: string) {
    const startOfDay = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const { rows } = await this.pool.query(
      "select count(*)::int as n from palm_scans where owner_key = $1 and created_at >= $2 and result->>'aiTier' = 'paid'",
      [ownerKey, startOfDay]
    );
    return rows[0]?.n ?? 0;
  }
  async countChatMessagesToday(ownerKey: string) {
    const startOfDay = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const { rows } = await this.pool.query(
      "select count(*)::int as n from palm_events where name = 'astrologer_question' and owner_key = $1 and created_at >= $2",
      [ownerKey, startOfDay]
    );
    return rows[0]?.n ?? 0;
  }
  async countPaidScansTodayByIp(ip: string) {
    const startOfDay = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const { rows } = await this.pool.query(
      "select count(*)::int as n from palm_events where name = 'paid_scan_ip' and owner_key = $1 and created_at >= $2",
      [ip, startOfDay]
    );
    return rows[0]?.n ?? 0;
  }
  async reassignOwner(fromKey: string, toKey: string) {
    await this.pool.query("update palm_scans set owner_key = $1 where owner_key = $2", [toKey, fromKey]);
  }
  async createUser(u: User) {
    await this.pool.query(
      `insert into palm_users (id, email, password_hash, verified, verify_token, created_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [u.id, u.email.toLowerCase(), u.passwordHash, u.verified ?? false, u.verifyToken ?? null, u.createdAt]
    );
  }
  async getUserByVerifyToken(token: string) {
    const { rows } = await this.pool.query("select * from palm_users where verify_token = $1", [token]);
    return rows[0] ? this.userRow(rows[0]) : null;
  }
  async setVerified(userId: string) {
    await this.pool.query(
      "update palm_users set verified = true, verify_token = null where id = $1",
      [userId]
    );
  }
  async getUserByEmail(email: string) {
    const { rows } = await this.pool.query("select * from palm_users where email = $1", [email.toLowerCase()]);
    return rows[0] ? this.userRow(rows[0]) : null;
  }
  async getUserById(id: string) {
    const { rows } = await this.pool.query("select * from palm_users where id = $1", [id]);
    return rows[0] ? this.userRow(rows[0]) : null;
  }
  async countUsers() {
    const { rows } = await this.pool.query("select count(*)::int as n from palm_users");
    return rows[0]?.n ?? 0;
  }
  async recordPayment(p: Payment) {
    await this.pool.query(
      `insert into palm_payments (id, scan_id, owner_key, amount_cents, currency, provider, status, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [p.id, p.scanId, p.ownerKey, p.amountCents, p.currency, p.provider, p.status, p.createdAt]
    );
  }
  async recordEvent(e: AnalyticsEvent) {
    await this.pool.query(
      "insert into palm_events (name, owner_key, scan_id, created_at) values ($1, $2, $3, $4)",
      [e.name, e.ownerKey ?? null, e.scanId ?? null, e.createdAt]
    );
  }
  async getEvents() {
    const { rows } = await this.pool.query("select * from palm_events");
    return rows.map((d) => ({
      name: d.name,
      ownerKey: d.owner_key ?? undefined,
      scanId: d.scan_id ?? undefined,
      createdAt: d.created_at,
    })) as AnalyticsEvent[];
  }
  async getPayments() {
    const { rows } = await this.pool.query("select * from palm_payments");
    return rows.map((d) => ({
      id: d.id,
      scanId: d.scan_id,
      ownerKey: d.owner_key,
      amountCents: d.amount_cents,
      currency: d.currency,
      provider: d.provider,
      status: d.status,
      createdAt: d.created_at,
    })) as Payment[];
  }
  async recentScans(limit: number) {
    const { rows } = await this.pool.query(
      "select * from palm_scans order by created_at desc limit $1",
      [limit]
    );
    return rows.map((d) => toSummary(this.row(d)));
  }
  async listDailyEmailRecipients() {
    const { rows } = await this.pool.query(
      `select s.owner_key, s.id as scan_id, u.email
       from palm_scans s
       join palm_users u on u.id::text = s.owner_key
       where s.paid = true
       order by s.created_at desc`
    );
    const seen = new Set<string>();
    const out: { email: string; scanId: string }[] = [];
    for (const r of rows) {
      if (seen.has(r.owner_key)) continue;
      seen.add(r.owner_key);
      out.push({ email: r.email, scanId: r.scan_id });
    }
    return out;
  }

  private row(d: any): ScanRecord {
    return {
      id: d.id,
      ownerKey: d.owner_key,
      result: d.result,
      paid: Boolean(d.paid),
      image: d.image ?? undefined,
      personName: d.person_name ?? undefined,
      createdAt: d.created_at instanceof Date ? d.created_at.toISOString() : d.created_at,
    };
  }
  private userRow(d: any): User {
    return {
      id: d.id,
      email: d.email,
      passwordHash: d.password_hash,
      verified: d.verified ?? undefined,
      verifyToken: d.verify_token ?? null,
      createdAt: d.created_at instanceof Date ? d.created_at.toISOString() : d.created_at,
    };
  }
}

// --- singleton --------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __palmStore: Store | undefined;
}

function createStore(): Store {
  if (databaseEnabled) {
    try {
      return new PostgresStore();
    } catch {
      return new MemoryStore();
    }
  }
  return new MemoryStore();
}

export const store: Store = global.__palmStore ?? createStore();
if (process.env.NODE_ENV !== "production") global.__palmStore = store;
