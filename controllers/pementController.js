const axios = require("axios");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const { getSupportFailureTemplate, getUserFailureTemplate } = require("../utils/emailTemplate");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { productId, couponCode, buyerEmail } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product nahi mila" });
    }

    let finalPrice = Number(product.price);
    let isApplied = false;
    let appliedCouponData = null;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const validCoupon = await Coupon.findOne({
        code: cleanCode,
        isActive: true,
      });

      if (validCoupon) {
        const now = new Date();
        if (validCoupon.expiryDate && now > validCoupon.expiryDate) {
          return res.status(400).json({ success: false, msg: "Coupon expire ho chuka hai" });
        }

        const discountAmount = (finalPrice * Number(validCoupon.discount)) / 100;
        finalPrice -= discountAmount;
        isApplied = true;
        appliedCouponData = cleanCode;
      } else {
        console.log("Invalid Coupon Attempted:", cleanCode);
      }
    }

    const options = {
      amount: Math.round(finalPrice * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${productId.substring(0, 5)}`,
      notes: {
        productId: productId,
        buyerEmail: buyerEmail,
        appliedCoupon: appliedCouponData || "NONE",
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      finalPrice: finalPrice,
      discountApplied: isApplied,
      productTitle: product.title,
    });
  } catch (err) {
    console.error("Pro Order Error:", err);
    res.status(500).json({
      success: false,
      msg: "Server Error: Order generate nahi ho paya",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, msg: "Payment details missing!" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign.toString()).digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        msg: "Transaction Tampered! Invalid Signature.",
      });
    }

    const existingOrder = await Order.findOne({
      paymentId: razorpay_payment_id,
    });
    if (existingOrder) {
      return res.status(400).json({ success: false, msg: "Payment already processed!" });
    }

    const [user, course] = await Promise.all([User.findById(req.user.id), Product.findById(courseId)]);

    if (!user || !course) {
      return res.status(404).json({ success: false, msg: "User or Course not found" });
    }

    const orderAmount = Number(amount);
    const commRate = 20;
    const platformCommission = (orderAmount * commRate) / 100;
    const sellerEarnings = orderAmount - platformCommission;

    if (!user.purchasedCourses.includes(courseId)) {
      user.purchasedCourses.push(courseId);
    }
    user.isVip = true;
    user.badge = "vip";

    const newOrder = new Order({
      productId: course._id,
      productName: course.title,
      amount: orderAmount,

      platformCommission: platformCommission,
      sellerEarnings: sellerEarnings,
      commissionRate: commRate,

      sellerId: course.sellerId,
      sellerEmail: course.sellerEmail,
      sellerName: course.sellerName,
      customerEmail: user.email,
      customerName: user.name,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "success",
      payoutStatus: "Pending",
      mailTrack: "Course Unlocked",
    });

    await Promise.all([user.save(), newOrder.save()]);

    return res.status(200).json({
      success: true,
      msg: "Payment Verified & Course Unlocked! 🚀",
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("❌ Pro Verify Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server Error during verification",
      error: err.message,
    });
  }
};

exports.handlePaymentFailure = async (req, res) => {
  console.log("🚨 PAYMENT FAILURE API HIT");
  console.log("BODY:", req.body);

  try {
    const { courseId, buyerEmail, reason } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        msg: "Course ID is required",
      });
    }

    if (!buyerEmail) {
      return res.status(400).json({
        success: false,
        msg: "Buyer email is required",
      });
    }

    if (!process.env.BREVO_EMAIL || !process.env.BREVO_SMTP_KEY) {
      return res.status(500).json({
        success: false,
        msg: "Email service configuration missing",
      });
    }

    const user = await User.findOne({ email: buyerEmail });
    const course = await Product.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({
        success: false,
        msg: "User ya Course nahi mila",
      });
    }

    const supportEmail = process.env.SUPPORT_EMAIL_USER?.trim() || process.env.BREVO_EMAIL.trim();

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "BR30 Kart",
          email: process.env.BREVO_EMAIL.trim(),
        },

        replyTo: {
          email: "support.br30trader@gmail.com",
          name: "BR30 Support Team",
        },

        to: [{ email: supportEmail }],

        subject: `⚠️ Payment Failed: ${user.name}`,

        htmlContent: getSupportFailureTemplate(user, course, reason || "Payment Failed / User closed payment popup"),
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_SMTP_KEY.trim(),
          "content-type": "application/json",
        },
      }
    );

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "BR30 Kart",
          email: process.env.BREVO_EMAIL.trim(),
        },

        replyTo: {
          email: "support.br30trader@gmail.com",
          name: "BR30 Support Team",
        },

        to: [{ email: user.email }],

        subject: `Need help with ${course.title}?`,

        htmlContent: getUserFailureTemplate(user, course, reason || "Payment Failed / User closed payment popup"),
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_SMTP_KEY.trim(),
          "content-type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      msg: "Failure alerts sent!",
    });
  } catch (err) {
    console.error("❌ FAILURE ALERT ERROR FULL:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      msg: "Alert Error",
      error: err.message,
    });
  }
};
