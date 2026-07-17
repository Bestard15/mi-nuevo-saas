import { Resend } from "resend";

/**
 * Shipped notifications: when a post reaches a "shipped" status, every voter
 * (and the author) with a known email gets a short announcement. This closes
 * the feedback loop — the single biggest retention lever for a feedback board.
 *
 * Without RESEND_API_KEY the send is skipped gracefully (dev environments).
 */

const BATCH_LIMIT = 100;

export type ShippedEmailInput = {
  projectName: string;
  projectSlug: string;
  postTitle: string;
  postId: string;
  recipients: string[];
};

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildShippedEmailHtml(input: ShippedEmailInput): string {
  const url = `${appBaseUrl()}/p/${input.projectSlug}/posts/${input.postId}`;
  const title = escapeHtml(input.postTitle);
  const project = escapeHtml(input.projectName);
  return `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 8px">🚀 ¡Ya está disponible!</h2>
  <p style="margin:0 0 16px;color:#374151">
    Votaste por <strong>${title}</strong> en el board de feedback de ${project},
    y el equipo acaba de lanzarlo.
  </p>
  <a href="${url}"
     style="display:inline-block;background:#111827;color:#ffffff;border-radius:8px;padding:10px 16px;text-decoration:none">
    Ver el anuncio
  </a>
  <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
    Recibes este email porque votaste esta petición en ${project} · Enviado con Echoboard
  </p>
</div>`;
}

/** Returns how many emails were sent (0 when skipped or on failure). */
export async function sendShippedEmails(input: ShippedEmailInput): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = [...new Set(input.recipients)].filter(Boolean);
  if (recipients.length === 0) return 0;
  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY no configurado — se omite el envío de ${recipients.length} notificaciones de "${input.postTitle}"`
    );
    return 0;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "Echoboard <onboarding@resend.dev>";
  const html = buildShippedEmailHtml(input);
  const subject = `🚀 "${input.postTitle}" ya está disponible`;

  let sent = 0;
  try {
    for (let i = 0; i < recipients.length; i += BATCH_LIMIT) {
      const chunk = recipients.slice(i, i + BATCH_LIMIT);
      const { error } = await resend.batch.send(
        chunk.map((to) => ({ from, to, subject, html }))
      );
      if (error) {
        console.error(`[email] Error de Resend: ${error.message}`);
      } else {
        sent += chunk.length;
      }
    }
  } catch (err) {
    // Never let a mail failure break the status transition.
    console.error("[email] Fallo enviando notificaciones de shipped:", err);
  }
  return sent;
}
