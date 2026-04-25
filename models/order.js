//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// 📦 ORDER MODEL: Stores transaction details, payment status, and user enrollments.
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  productName: String,
  amount: Number,

  platformCommission: {
    type: Number,
    required: true,
    default: 0,
  },
  sellerEarnings: {
    type: Number,
    required: true,
    default: 0,
  },
  commissionRate: {
    type: Number,
    default: 20,
  },

  sellerId: {
    type: String,
    required: false,
  },
  sellerEmail: String,
  sellerName: String,

  customerName: String,
  customerEmail: String,

  paymentId: String,
  orderId: String,

  status: {
    type: String,
    default: "pending",
  },

  payoutStatus: {
    type: String,
    enum: ["Pending", "Completed"],
    default: "Pending",
  },

  payoutDate: {
    type: Date,
  },

  mailTrack: {
    type: String,
    default: "Awaiting Payment",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
