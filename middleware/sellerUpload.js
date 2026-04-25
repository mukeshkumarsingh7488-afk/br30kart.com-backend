//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

/**
 * 🛠️ SELLER DOCUMENT UPLOAD CONFIGURATION
 * Logic: Cloudinary storage setup for identity verification docs
 * Status: Refactored & Dynamic Naming Enabled
 */

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 📁 STORAGE LOGIC: Dynamic Folder & Public ID Management
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // 🔍 Identifying User: Using Email prefix or Timestamp as fallback
    const identifier = req.body.email
      ? req.body.email.split("@")[0]
      : Date.now();

    return {
      folder: "seller_docs", // Cloudinary folder for KYC docs
      format: "jpg", // Consistent image format
      public_id: `${identifier}-${file.fieldname}-${Date.now()}`, // Unique file naming
    };
  },
});

// 🚀 MIDDLEWARE: Exporting seller document upload handler
const sellerUpload = multer({ storage: storage });

module.exports = sellerUpload;
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
