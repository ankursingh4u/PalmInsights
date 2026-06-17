import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config, supabaseEnabled } from "./config";
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
// - Supabase (tables: palm_users, palm_scans, palm_payments, palm_events)
//   when configured (see supabase/schema.sql).
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

// --- supabase implementation -----------------------------------------------

class SupabaseStore implements Store {
  private c: SupabaseClient;
  constructor() {
    this.c = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  async saveScan(r: ScanRecord) {
    await this.c.from("palm_scans").upsert({
      id: r.id,
      owner_key: r.ownerKey,
      result: r.result,
      paid: r.paid,
      image: r.image ?? null,
      person_name: r.personName ?? null,
      created_at: r.createdAt,
    });
  }
  async getScan(id: string) {
    const { data } = await this.c.from("palm_scans").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      ownerKey: data.owner_key,
      result: data.result as AnalysisResult,
      paid: Boolean(data.paid),
      image: data.image ?? undefined,
      personName: data.person_name ?? undefined,
      createdAt: data.created_at,
    };
  }
  async setPaid(id: string) {
    await this.c.from("palm_scans").update({ paid: true }).eq("id", id);
  }
  async setScanOwner(id: string, ownerKey: string) {
    await this.c.from("palm_scans").update({ owner_key: ownerKey }).eq("id", id);
  }
  async listScansByOwner(ownerKey: string) {
    const { data } = await this.c
      .from("palm_scans")
      .select("*")
      .eq("owner_key", ownerKey)
      .order("created_at", { ascending: false });
    return (data ?? []).map((d) => toSummary(this.row(d)));
  }
  async countScansByOwner(ownerKey: string) {
    const { count } = await this.c
      .from("palm_scans")
      .select("*", { count: "exact", head: true })
      .eq("owner_key", ownerKey);
    return count ?? 0;
  }
  async reassignOwner(fromKey: string, toKey: string) {
    await this.c.from("palm_scans").update({ owner_key: toKey }).eq("owner_key", fromKey);
  }
  async createUser(u: User) {
    await this.c.from("palm_users").insert({
      id: u.id,
      email: u.email.toLowerCase(),
      password_hash: u.passwordHash,
      verified: u.verified ?? false,
      verify_token: u.verifyToken ?? null,
      created_at: u.createdAt,
    });
  }
  async getUserByVerifyToken(token: string) {
    const { data } = await this.c
      .from("palm_users")
      .select("*")
      .eq("verify_token", token)
      .maybeSingle();
    return data ? this.userRow(data) : null;
  }
  async setVerified(userId: string) {
    await this.c
      .from("palm_users")
      .update({ verified: true, verify_token: null })
      .eq("id", userId);
  }
  async getUserByEmail(email: string) {
    const { data } = await this.c
      .from("palm_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return data ? this.userRow(data) : null;
  }
  async getUserById(id: string) {
    const { data } = await this.c.from("palm_users").select("*").eq("id", id).maybeSingle();
    return data ? this.userRow(data) : null;
  }
  async countUsers() {
    const { count } = await this.c
      .from("palm_users")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  }
  async recordPayment(p: Payment) {
    await this.c.from("palm_payments").insert({
      id: p.id,
      scan_id: p.scanId,
      owner_key: p.ownerKey,
      amount_cents: p.amountCents,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      created_at: p.createdAt,
    });
  }
  async recordEvent(e: AnalyticsEvent) {
    await this.c.from("palm_events").insert({
      name: e.name,
      owner_key: e.ownerKey ?? null,
      scan_id: e.scanId ?? null,
      created_at: e.createdAt,
    });
  }
  async getEvents() {
    const { data } = await this.c.from("palm_events").select("*");
    return (data ?? []).map((d) => ({
      name: d.name,
      ownerKey: d.owner_key ?? undefined,
      scanId: d.scan_id ?? undefined,
      createdAt: d.created_at,
    })) as AnalyticsEvent[];
  }
  async getPayments() {
    const { data } = await this.c.from("palm_payments").select("*");
    return (data ?? []).map((d) => ({
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
    const { data } = await this.c
      .from("palm_scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((d) => toSummary(this.row(d)));
  }
  async listDailyEmailRecipients() {
    const { data: scans } = await this.c
      .from("palm_scans")
      .select("id, owner_key, created_at")
      .eq("paid", true)
      .order("created_at", { ascending: false });
    const { data: users } = await this.c.from("palm_users").select("id, email");
    const emailById = new Map((users ?? []).map((u: any) => [u.id, u.email]));
    const seen = new Set<string>();
    const out: { email: string; scanId: string }[] = [];
    for (const s of scans ?? []) {
      const email = emailById.get(s.owner_key);
      if (email && !seen.has(s.owner_key)) {
        seen.add(s.owner_key);
        out.push({ email, scanId: s.id });
      }
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
      createdAt: d.created_at,
    };
  }
  private userRow(d: any): User {
    return {
      id: d.id,
      email: d.email,
      passwordHash: d.password_hash,
      verified: d.verified ?? undefined,
      verifyToken: d.verify_token ?? null,
      createdAt: d.created_at,
    };
  }
}

// --- singleton --------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __palmStore: Store | undefined;
}

function createStore(): Store {
  if (supabaseEnabled) {
    try {
      return new SupabaseStore();
    } catch {
      return new MemoryStore();
    }
  }
  return new MemoryStore();
}

export const store: Store = global.__palmStore ?? createStore();
if (process.env.NODE_ENV !== "production") global.__palmStore = store;
