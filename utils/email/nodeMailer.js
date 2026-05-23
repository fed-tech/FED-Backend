/**
 * RESEND EMAIL SERVICE
 * Production-ready email sending with 2-domain fallback support
 * 
 * Environment Variables Required:
 * - RESEND_API_KEY: API key for primary domain
 * - EMAIL_FROM: Primary sender (e.g., "FED KIIT <noreply@kforum.online>")
 * - RESEND_API_KEY_2: API key for fallback domain
 * - EMAIL_FROM_2: Fallback sender (e.g., "FED KIIT <noreply@fedkiit.com>")
 */

const { Resend } = require("resend");

// Initialize Resend clients for both domains
const resendPrimary = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const resendSecondary = process.env.RESEND_API_KEY_2
  ? new Resend(process.env.RESEND_API_KEY_2)
  : null;

/**
 * Send email using Resend API with automatic fallback
 * Tries primary domain first, falls back to secondary if primary fails
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @param {string} textContent - Plain text content (optional, auto-generated from HTML)
 * @param {Array} attachments - Array of attachments [{filename, content}]
 * @returns {Promise<object>} - Resend response data
 * @throws {Error} - If both primary and secondary fail
 */
async function sendMail(to, subject, htmlContent, textContent, attachments = []) {
  // Validate environment
  if (!resendPrimary && !resendSecondary) {
    throw new Error("[Email] No Resend API keys configured. Set RESEND_API_KEY in .env");
  }

  // Build email options
  const emailOptions = {
    to: to,
    subject: subject,
    html: htmlContent,
    text: textContent || htmlContent.replace(/<[^>]+>/g, ""),
    reply_to: "fedkiit@gmail.com",
  };

  // Add attachments if present
  if (attachments && attachments.length > 0) {
    emailOptions.attachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
    }));
  }

  // ============ TRY PRIMARY SENDER ============
  if (resendPrimary && process.env.EMAIL_FROM) {
    try {
      console.log(`[Email] Sending via PRIMARY: ${process.env.EMAIL_FROM}`);

      const { data, error } = await resendPrimary.emails.send({
        ...emailOptions,
        from: process.env.EMAIL_FROM,
      });

      if (!error && data) {
        console.log(`[Email] SUCCESS via PRIMARY:`, data.id);
        return data;
      }

      console.error(`[Email] PRIMARY failed:`, error?.message || "Unknown error");
    } catch (err) {
      console.error(`[Email] PRIMARY exception:`, err.message);
    }
  }

  // ============ TRY SECONDARY SENDER (FALLBACK) ============
  if (resendSecondary && process.env.EMAIL_FROM_2) {
    try {
      console.log(`[Email] Sending via SECONDARY: ${process.env.EMAIL_FROM_2}`);

      const { data, error } = await resendSecondary.emails.send({
        ...emailOptions,
        from: process.env.EMAIL_FROM_2,
      });

      if (!error && data) {
        console.log(`[Email] SUCCESS via SECONDARY:`, data.id);
        return data;
      }

      console.error(`[Email] SECONDARY failed:`, error?.message || "Unknown error");
      throw new Error(`Email failed: ${error?.message || "Secondary sender failed"}`);
    } catch (err) {
      console.error(`[Email] SECONDARY exception:`, err.message);
      throw err;
    }
  }

  // Both failed or not configured
  throw new Error("[Email] All email senders failed or not configured");
}

module.exports = { sendMail };
