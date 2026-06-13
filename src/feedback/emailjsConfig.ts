/**
 * ============================================================================
 * USER-CONFIGURED EMAILJS SETUP — paste your own values here (or via env).
 * ============================================================================
 *
 * Until real values are provided, isEmailjsConfigured() returns false and the
 * feedback form stays in a graceful "준비 중 / Coming soon" disabled state —
 * nothing crashes and the rest of the app is unaffected.
 *
 * Each field falls back to a clearly-marked "YOUR_..." placeholder and can be
 * overridden with an EXPO_PUBLIC_EMAILJS_* env var so real keys aren't committed.
 *
 * ── Where to get these (https://dashboard.emailjs.com) ──────────────────────
 *   SERVICE_ID  → Email Services → your service → "Service ID"
 *   TEMPLATE_ID → Email Templates → your template → "Template ID"
 *   PUBLIC_KEY  → Account → General → "Public Key"
 *
 * The template should reference the variables this app sends: {{message}} and
 * {{email}} (the optional reply-to address).
 * ────────────────────────────────────────────────────────────────────────────
 */

// EXPO_PUBLIC_EMAILJS_* env vars still take precedence; these are the committed
// fallback defaults. The template expects params named {{message}} and
// {{user_email}} (see FeedbackForm's send).
export const emailjsConfig = {
  serviceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID ?? 'service_vat07sk',
  templateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID ?? 'template_4z0etfa',
  publicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY ?? 'UyGerfX9AzlxEdnTI',
};

/**
 * True only when all three fields hold real (non-placeholder) values. Gates the
 * feedback send so a half-configured project degrades gracefully instead of
 * erroring (analogous to isFirebaseConfigured()).
 */
export function isEmailjsConfigured(): boolean {
  return Object.values(emailjsConfig).every(
    (v) => typeof v === 'string' && v.length > 0 && !v.startsWith('YOUR_'),
  );
}
