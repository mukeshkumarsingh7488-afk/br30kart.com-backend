//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━

// 📜 UPGRADED CERTIFICATE MODEL | LOGIC: ATLAS DB SYNC & CLOUDINARY MEDIA INTEGRATION
const mongoose = require("mongoose");

const certSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: { type: String, required: true },
    mobile: { type: String },

    certId: {
      type: String,
      unique: true,
      required: true,
    },
    course: { type: String, required: true },

    downloadUrl: {
      type: String,
      required: true,
    },
    fileName: String,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Certificate", certSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
