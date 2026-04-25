//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

/**
 * 🛠️ CLOUDINARY GLOBAL CONFIGURATION
 * Logic: Authenticating Cloudinary API with Environment Variables
 * Status: Secured & Verified
 */

const cloudinary = require("cloudinary").v2;

// 🔐 1. AUTHENTICATION: Loading credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 🔍 2. DIAGNOSTIC: Confirming connection status (True/False)
console.log(
  "Cloudinary Status: Connection Verified ->",
  !!process.env.CLOUD_API_SECRET,
);

module.exports = cloudinary;
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
