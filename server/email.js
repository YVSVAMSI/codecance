import { config } from './config.js';

/**
 * Send an OTP verification email through Resend.
 * - Requires RESEND_API_KEY (resend.com); in production a missing key is a hard error.
 * - In development without a key, the OTP is logged to the server console so the flow
 *   can be tested locally without an email provider.
 */
export async function sendOtpEmail({ email, code }) {
  if (!config.resendApiKey) {
    if (config.isProd) {
      throw new Error('RESEND_API_KEY is required to send verification emails in production.');
    }
    // Dev fallback: print the code so local testing works without a provider.
    // eslint-disable-next-line no-console
    console.log(`[dev-email] OTP for ${email}:\n\n        ${code}\n`);
    return { ok: true, dev: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: email,
      subject: `Your CodeCance verification code is ${code}`,
      html: `
        <div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e0d6;border-radius:12px;">
          <p style="margin:0 0 14px;color:#333;font-size:15px;">Welcome to <strong>CodeCance</strong> — your DSA pattern tracker.</p>
          <p style="margin:0 0 8px;color:#333;font-size:14px;">Your verification code is:</p>
          <p style="margin:0 0 18px;font-size:34px;font-weight:700;letter-spacing:8px;color:#1f6feb;">${code}</p>
          <p style="margin:0;color:#777;font-size:12px;">This code expires in 15 minutes. If you didn't request it, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => null);
    throw new Error(`Resend email send failed (${res.status}): ${body || res.statusText}`);
  }
  return { ok: true };
}