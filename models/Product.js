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

// 🔥 5 मिनट का टेस्ट लॉजिक (इसे बाद में 7 दिन कर देना)
ProductSchema.virtual("isDiscountValid").get(function () {
  if (!this.discount || this.discount <= 0) return false;

  const startTime = this.couponCreatedAt || this.createdAt;
  const fiveMinutes = 5 * 60 * 1000;
  const expiryTime = new Date(startTime).getTime() + fiveMinutes;

  return Date.now() < expiryTime; // अगर अभी का समय एक्सपायरी से कम है तो true
});

// इसे JSON में भेजने के लिए यह ज़रूरी है
ProductSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("Product", ProductSchema);
//#endregion
// ==========================================
// ✅ Schema organized, validated, and refactored.
// 🚀 Database Model is ready for production!
// ==========================================
