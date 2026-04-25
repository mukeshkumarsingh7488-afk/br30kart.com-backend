//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

/**
 * 🛠️ CLOUDINARY UPLOAD CONFIGURATION
 * Logic: Managing Image Uploads to Cloudinary via Multer
 * Status: Refactored & Production Ready
 */

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// 📁 STORAGE CONFIG: Cloudinary folder and file type definitions
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "course_thumbnails", // Folder name in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"], // Secure file filtering
  },
});

// 🚀 MIDDLEWARE: Exporting upload handler for Routes
const uploadCloud = multer({ storage });

module.exports = uploadCloud;
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
