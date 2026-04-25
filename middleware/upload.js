//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

/**
 * 🛠️ PROFILE IMAGE UPLOAD CONFIGURATION
 * Logic: Cloudinary integration with auto-replace (using User ID)
 * Status: Refactored & Security Hardened
 */

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 🛡️ 1. CLOUDINARY CONFIG: Environment-based Authentication
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 📁 2. STORAGE LOGIC: Using User ID as Public ID to enable auto-overwrite
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "profile_pics", // Cloudinary directory for avatars
      format: "jpg", // Standardized image format
      public_id: req.user.id, // 🔥 Logic: Replace old photo with new one
      resource_type: "image",
    };
  },
});

// 🚀 3. INITIALIZE MULTER: Applying 5MB file size restriction
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Optimized for performance
});

module.exports = upload;
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
