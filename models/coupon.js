//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// 🎫 COUPON MODEL: Stores code, discount, status, and expiry for future access.
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },

  discount: {
    type: Number,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Coupon", couponSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
