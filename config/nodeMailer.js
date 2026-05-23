// config/nodeMailer.js
// DEPRECATED: This file has been replaced by Resend API
// See: config/resend.js and utils/email/nodeMailer.js for new implementation
// Date: January 2026

/* ============================================================
   ORIGINAL NODEMAILER CONFIGURATION (COMMENTED OUT)
   ============================================================

const nodemailer = require("nodemailer");

// Primary transporter (e.g., Gmail)
const mailTransporterPrimary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});


const mailTransporterSecondary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER_SECONDARY,
        pass: process.env.MAIL_PASS_SECONDARY,
    },
});

const mailTransporterTertiary = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER_TERTIARY,
        pass: process.env.MAIL_PASS_TERTIARY,
    },
});

const mailTransporterMailerSend = nodemailer.createTransport({
    host: "smtp.mailersend.net",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER_MAILERSEND,
        pass: process.env.MAIL_PASS_MAILERSEND,
    },
});

module.exports = {
    primary: mailTransporterPrimary,
    secondary: mailTransporterSecondary,
    tertiary: mailTransporterTertiary,
    mailerSend: mailTransporterMailerSend,
};

============================================================ */

// Export empty object to prevent import errors during transition
// This file is no longer used - Resend API is used instead
module.exports = {
    primary: null,
    secondary: null,
    tertiary: null,
    mailerSend: null,
};
