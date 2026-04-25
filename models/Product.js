//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
// 🛒 PRODUCT MODEL: Stores course details, pricing, and media assets.
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    category: {
      type: String,
      enum: [
        "Premium-Trading-Courses",
        "Trading-Standard-Course",
        "Crash-Course",
        "Other",
        "Bestseller",
        "pdfs",
      ],
      required: true,
    },
    price: { type: Number, required: true },
    videoLink: { type: String },
    thumbnail: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    sellerName: { type: String, required: true },
    discount: { type: Number, default: 0 },

    // 🔥 NEW: Multi-Seller Controls
    isApproved: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    couponCreatedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
