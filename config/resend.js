/**
 * RESEND EMAIL CONFIGURATION
 * This file is kept for backward compatibility but is no longer used.
 * Email sending is now handled directly in utils/email/nodeMailer.js
 * 
 * The Resend clients are initialized directly in nodeMailer.js using:
 * - RESEND_API_KEY + EMAIL_FROM (primary)
 * - RESEND_API_KEY_2 + EMAIL_FROM_2 (fallback)
 */

// This file is deprecated - Resend clients are created in nodeMailer.js
module.exports = {};
