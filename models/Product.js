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

    discountSource: {
      type: String,
      enum: ["global", "individual", null],
      default: null,
    },

    isApproved: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    couponCreatedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ProductSchema.virtual("isDiscountValid").get(function () {
  if (!this.discount || this.discount <= 0) return false;

  const startTime = this.couponCreatedAt || this.createdAt;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expiryTime = new Date(startTime).getTime() + sevenDays;

  return Date.now() < expiryTime;
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", ProductSchema);
