//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// 🔔 NOTIFICATION MODEL: Stores user alerts, messages, and read/unread status.
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  category: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
