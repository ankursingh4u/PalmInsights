import { config, emailEnabled } from "./config";
import type { DailyGuidance } from "./types";

// Thin Resend wrapper + the daily-guidance email template. Resend is reached
// over plain HTTP so there's no SDK dependency.

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!emailEnabled) return { ok: false, error: "email not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.email.resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.email.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Branded HTML for a daily-guidance email. */
export function renderDailyEmail(g: DailyGuidance, dateStr: string, ctaUrl: string): string {
  const pretty = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const list = (items: string[], color: string, sign: string) =>
    items
      .map((i) => `<tr><td style="color:${color};padding:2px 8px 2px 0;vertical-align:top">${sign}</td><td style="color:#cbd5e1;padding:2px 0">${esc(i)}</td></tr>`)
      .join("");
  const tile = (icon: string, label: string, value: string) =>
    `<td align="center" style="background:#ffffff0d;border-radius:12px;padding:14px 8px;width:25%">
      <div style="font-size:20px">${icon}</div>
      <div style="font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;margin-top:4px">${esc(label)}</div>
      <div style="font-size:13px;font-weight:700;color:#fff;margin-top:2px">${esc(value)}</div>
    </td>`;

  return `<!doctype html><html><body style="margin:0;background:#0b0614;font-family:Georgia,'Times New Roman',serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0614;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(160deg,#150a2e,#0b0614);border:1px solid #ffffff14;border-radius:20px;overflow:hidden">
        <tr><td style="padding:28px 28px 8px">
          <div style="color:#c4b5fd;font-size:14px;letter-spacing:.12em">✋ PALMINSIGHT</div>
          <div style="color:#fff;font-size:24px;font-weight:700;margin-top:8px">Your Day, by Your Palm</div>
          <div style="color:#94a3b8;font-size:13px;margin-top:2px">${esc(pretty)} · Mood: ${esc(g.mood)}</div>
        </td></tr>
        <tr><td style="padding:12px 28px">
          <p style="color:#e9e2ff;font-size:16px;line-height:1.6;margin:0">${esc(g.horoscope)}</p>
        </td></tr>
        <tr><td style="padding:8px 24px">
          <table role="presentation" width="100%" cellspacing="8"><tr>
            ${tile("👕", "Wear", g.wearColor)}
            ${tile("⏰", "Lucky time", g.luckyTime)}
            ${tile("✨", "Mood", g.mood)}
            ${tile("🎯", "Best for", g.goodFor[0] || "—")}
          </tr></table>
        </td></tr>
        <tr><td style="padding:12px 28px">
          <div style="color:#86efac;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Good for you today</div>
          <table role="presentation" cellspacing="0">${list(g.goodFor, "#86efac", "+")}</table>
          <div style="color:#fcd34d;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin:14px 0 6px">Better to avoid</div>
          <table role="presentation" cellspacing="0">${list(g.avoid, "#fcd34d", "–")}</table>
        </td></tr>
        ${g.outfit ? `<tr><td style="padding:6px 28px 16px"><div style="background:#ffffff0d;border-radius:12px;padding:14px;color:#cbd5e1;font-size:14px"><span style="color:#c4b5fd">Style tip:</span> ${esc(g.outfit)}</div></td></tr>` : ""}
        <tr><td align="center" style="padding:8px 28px 32px">
          <a href="${esc(ctaUrl)}" style="display:inline-block;background:#8b5cf6;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px">Open today's full reading →</a>
          <div style="color:#64748b;font-size:11px;margin-top:18px">You're getting this as a PalmInsight premium member.</div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}
