//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
//  📩 EMAIL TEMPLATE EXPORT | LOGIC: MANAGING SYSTEM-WIDE EMAIL LAYOUTS
const {
  getSupportFailureTemplate,
  getUserFailureTemplate,
} = require("../utils/emailTemplate");

//#region  💳 RAZORPAY CONFIGURATION | LOGIC: SECURING API CREDENTIALS VIA ENVIRONMENT VARIABLES
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
//#endregion

// 1. 🛒 CREATE PAYMENT ORDER | LOGIC: INITIATING TRANSACTION FROM FRONTEND REQUEST
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
          return res
            .status(400)
            .json({ success: false, msg: "Coupon expire ho chuka hai" });
        }

        const discountAmount =
          (finalPrice * Number(validCoupon.discount)) / 100;
        finalPrice -= discountAmount;
        isApplied = true;
        appliedCouponData = cleanCode;
      } else {
        console.log("Invalid Coupon Attempted:", cleanCode);
      }
    }

    const options = {
      amount: Math.round(finalPrice * 100), // Amount in Paise
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

// 2. 🛡️ VERIFY PAYMENT | LOGIC: AUTHENTICATING TRANSACTION FROM FRONTEND RESPONSE
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, msg: "Payment details missing!" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

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
      return res
        .status(400)
        .json({ success: false, msg: "Payment already processed!" });
    }

    const [user, course] = await Promise.all([
      User.findById(req.user.id),
      Course.findById(courseId),
    ]);

    if (!user || !course) {
      return res
        .status(404)
        .json({ success: false, msg: "User or Course not found" });
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

// 3. ⚠️ PAYMENT FAILURE ALERT | LOGIC: DISPATCHING NOTIFICATIONS TO USER & SUPPORT TEAM
exports.handlePaymentFailure = async (req, res) => {
  try {
    const { courseId, reason } = req.body;

    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({ msg: "User ya Course nahi mila" });
    }

    console.log("User:", user.name, user.email);
    console.log("Course:", course.title);

    await sendEmail({
      authEmail: process.env.SUPPORT_EMAIL_USER,
      authPass: process.env.SUPPORT_EMAIL_PASS,
      brandName: "SYSTEM ALERT",
      email: process.env.SUPPORT_EMAIL_USER,
      subject: `⚠️ Payment Failed: ${user.name}`,
      html: getSupportFailureTemplate(user, course, reason),
    });

    await sendEmail({
      authEmail: process.env.SUPPORT_EMAIL_USER,
      authPass: process.env.SUPPORT_EMAIL_PASS,
      brandName: "BR30 TRADER Support",
      email: user.email,
      subject: `Need help with ${course.title}?`,
      html: getUserFailureTemplate(user, course, reason),
    });

    return res.json({
      success: true,
      msg: "Failure alerts sent!",
    });
  } catch (err) {
    console.error("❌ FAILURE ALERT ERROR:", err);
    return res.status(500).json({
      success: false,
      msg: "Alert Error",
      error: err.message,
    });
  }
};
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
