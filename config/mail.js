//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

/**
 * 📧 SMTP EMAIL CONFIGURATION
 * Logic: Setting up Nodemailer with Gmail for system notifications
 * Status: Refactored & Security Verified
 */

const nodemailer = require("nodemailer");
require("dotenv").config();

// 🚀 TRANSPORTER SETUP: Authenticating with Secure SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com", // 🔍 Fixed: Host correctly set to SMTP
  port: 465,
  secure: true, // Uses SSL for secure delivery
  auth: {
    user: process.env.EMAIL_USER, // 🔐 Gmail ID
    pass: process.env.EMAIL_PASS, // 🔐 App-Specific Password
  },
});

// ✅ DIAGNOSTIC: Test connection in development (Optional)
// transporter.verify((error) => error ? console.log(error) : console.log("SMTP: Ready for Dispatch"));

module.exports = transporter;

// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================

//#endregion
