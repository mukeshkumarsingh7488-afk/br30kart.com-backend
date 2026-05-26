const express = require("express");
const router = express.Router();

const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Order = require("../models/order");
const Product = require("../models/Product");
const pementController = require("../controllers/pementController");

// 🔥 Razorpay init
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ CREATE ORDER
router.post("/create-order", pementController.createOrder);
router.post("/verify-payment", pementController.verifyPayment);
router.post("/payment-failure", pementController.handlePaymentFailure);

// ✅ MY COURSES
router.get("/my-courses/:email", async (req, res) => {
  try {
    const orders = await Order.find({
      buyerEmail: req.params.email,
      status: "success",
    });

    const productIds = orders.map((o) => o.productId);

    const products = await Product.find({
      _id: { $in: productIds },
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

module.exports = router;
