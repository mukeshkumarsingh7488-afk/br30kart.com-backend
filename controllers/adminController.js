//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
const User = require("../models/User");
const Order = require("../models/order");
const nodemailer = require("nodemailer");
const Product = require("../models/Product");
require("dotenv").config();
// 📩 EMAIL TEMPLATE EXPORT | LOGIC: CENTRALIZED MAILING SYSTEM
const {
  sendEmail,
  payoutTemplate,
  rejectSellerTemplate,
  approvalTemplate,
  rejectDocsTemplate,
  sellerAlertTemplate,
  sellerAlertTemplate2,
} = require("../utils/emailTemplate");

// 1. 📊 GET ALL DASHBOARD DATA | LOGIC: FETCHING STATS & ANALYTICS
exports.getAllSellersDocs = async (req, res) => {
  try {
    const allUsers = await User.find({});

    const students = allUsers.filter(
      (u) => u.role === "student" || u.role === "vip",
    );
    const activeSellers = allUsers.filter(
      (u) => u.role === "seller" && u.isApproved === true,
    );
    const pendingSellers = allUsers.filter(
      (u) => u.role === "seller" && u.isApproved === false,
    );

    const vips = allUsers.filter((u) => u.role === "vip");

    res.status(200).json({
      success: true,
      students: students,
      sellers: activeSellers,
      requests: pendingSellers,
      vips: vips,
      totalStudents: students.length,
      totalSellers: activeSellers.length,
      totalVips: vips.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. ✅ APPROVE SELLER REQUEST | LOGIC: STATUS UPDATE & PERMISSION GRANTING
exports.approveSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      console.log("❌ Approval Error: User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await User.findByIdAndUpdate(id, { isApproved: true });

    console.log(
      `%c✅ [SELLER APPROVED] Name: ${user.name} | Email: ${user.email}`,
      "color: #2ecc71; font-weight: bold;",
    );

    res.status(200).json({
      success: true,
      message: `Success! ${user.name} has been successfully verified as a seller.`,
    });
  } catch (err) {
    console.error("❌ Approval Controller Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. 🚫 TOGGLE BLOCK STATUS | LOGIC: USER ACCESS SUSPENSION & ACTIVATION
exports.toggleUserBlock = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DB-ACTION] Toggle Block for ID: ${id}`);

    const user = await User.findById(id);
    if (!user) {
      console.log("❌ User not found in DB");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newStatus = !user.isBlocked;

    await User.findByIdAndUpdate(id, { isBlocked: newStatus });

    console.log(
      `✅ User ${user.name} is now ${newStatus ? "BLOCKED 🚫" : "UNBLOCKED ✅"}`,
    );

    res.status(200).json({
      success: true,
      message: newStatus ? "User Blocked" : "User Unblocked",
      isBlocked: newStatus,
    });
  } catch (err) {
    console.error("❌ Block Toggle Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. 🗑️ DELETE USER ACCOUNT | LOGIC: PERMANENT DATA REMOVAL & CLEANUP
exports.deleteUserAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      console.log(
        `%c❌ Delete Failed: User with ID ${id} not found!`,
        "color: red;",
      );
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    console.log(
      `%c🗑️ [DATABASE] User Deleted: ${user.name} (${user.email})`,
      "color: #ff4d4d; font-weight: bold;",
    );

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been deleted permanently!`,
    });
  } catch (err) {
    console.error("❌ Delete Controller Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. ⭐ TOGGLE VIP STATUS | LOGIC: PREMIUM MEMBERSHIP ACTIVATION & REVOCATION
exports.toggleVIPStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`%c[DEBUG] VIP Toggle Hit for: ${id}`, "color: yellow;");

    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.role === "vip" || user.isVip === true) {
      user.role = "student";
      user.isVip = false;
    } else {
      user.role = "vip";
      user.isVip = true;
    }

    await user.save();
    console.log(
      `✅ Status Updated: Role is ${user.role}, isVip is ${user.isVip}`,
    );

    res.status(200).json({
      success: true,
      newRole: user.role,
      isVip: user.isVip,
      message: `User is now ${user.role}`,
    });
  } catch (err) {
    console.error("❌ VIP Toggle Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. 🏆 GET ALL VIP USERS | LOGIC: FETCHING PREMIUM MEMBERSHIP LIST
exports.getVIPUsers = async (req, res) => {
  try {
    const vips = await User.find({ role: "vip" });

    res.status(200).json({
      success: true,
      vips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
// 7. 🔄 SELLER APPROVAL TOGGLE | LOGIC: APPROVE OR REVOKE SELLER RIGHTS
exports.toggleSellerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.isApproved = !user.isApproved;
    await user.save();

    console.log(
      `%c[DB] Seller ${user.name} Approval: ${user.isApproved}`,
      "color: #2ecc71;",
    );

    res.status(200).json({
      success: true,
      isApproved: user.isApproved,
      message: user.isApproved
        ? "Seller Approved! ✅"
        : "Seller Unapproved! ❌",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. 📈 CALCULATE SALES & PROFIT | LOGIC: AGGREGATING LIFETIME REVENUE & NET MARGINS
exports.getFinancialStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { status: "success" };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
      };
    }

    const statsData = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,

          totalSales: { $sum: { $toDouble: "$amount" } },

          feeCollected: { $sum: { $toDouble: "$platformCommission" } },

          totalPayout: {
            $sum: {
              $cond: [
                { $in: ["$payoutStatus", ["Completed", "paid"]] },
                { $toDouble: "$sellerEarnings" },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          feeCollected: 1,
          totalPayout: 1,
        },
      },
    ]);

    const result =
      statsData.length > 0
        ? statsData[0]
        : { totalSales: 0, totalPayout: 0, feeCollected: 0 };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Financial Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. 💸 FETCH PAYOUT RECORDS | LOGIC: RETRIEVING UPDATED DATABASE TRANSACTIONS
exports.getFridayPayouts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { status: "success" };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)),
      };
    }

    const payoutData = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$sellerEmail",
          sellerName: { $first: "$sellerName" },

          netDue: {
            $sum: {
              $cond: [
                { $in: ["$payoutStatus", ["pending", "Pending"]] },
                { $toDouble: "$sellerEarnings" },
                0,
              ],
            },
          },

          adminCommission: {
            $sum: {
              $cond: [
                { $in: ["$payoutStatus", ["pending", "Pending"]] },
                { $toDouble: "$platformCommission" },
                0,
              ],
            },
          },

          dueAmount: {
            $sum: {
              $cond: [
                { $in: ["$payoutStatus", ["pending", "Pending"]] },
                { $toDouble: "$amount" },
                0,
              ],
            },
          },

          alreadyPaid: {
            $sum: {
              $cond: [
                { $in: ["$payoutStatus", ["Completed", "paid"]] },
                { $toDouble: "$sellerEarnings" },
                0,
              ],
            },
          },
          allProducts: { $push: "$productName" },
        },
      },
      {
        $project: {
          _id: 0,
          sellerEmail: "$_id",
          sellerName: 1,
          dueAmount: 1,
          adminCommission: 1,
          netDue: 1,
          alreadyPaid: 1,
          courses: {
            $map: {
              input: { $setUnion: "$allProducts" },
              as: "product",
              in: {
                name: "$$product",
                count: {
                  $size: {
                    $filter: {
                      input: "$allProducts",
                      as: "p",
                      cond: { $eq: ["$$p", "$$product"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({ success: true, data: payoutData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. 💳 PROCESS PAYOUT (PAY NOW) | LOGIC: MARKING PAYOUT STATUS AS 'COMPLETED'
exports.updatePayoutStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const summary = await Order.aggregate([
      {
        $match: {
          sellerEmail: email,
          status: "success",
          payoutStatus: "Pending",
        },
      },
      {
        $group: {
          _id: { email: "$sellerEmail", course: "$productName" },
          sellerName: { $first: "$sellerName" },
          quantity: { $sum: 1 },
          courseTotal: { $sum: "$amount" },

          totalSellerEarnings: { $sum: "$sellerEarnings" },
          totalAdminCommission: { $sum: "$platformCommission" },
        },
      },
      {
        $group: {
          _id: "$_id.email",
          sellerName: { $first: "$sellerName" },
          totalSales: { $sum: "$courseTotal" },
          netPayout: { $sum: "$totalSellerEarnings" },
          adminCommission: { $sum: "$totalAdminCommission" },
          courses: {
            $push: {
              name: "$_id.course",
              count: "$quantity",
              total: "$courseTotal",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          sellerEmail: "$_id",
          sellerName: 1,
          totalSales: 1,
          adminCommission: 1,
          netPayout: 1,
          courses: 1,
        },
      },
    ]);

    if (summary.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pending orders found." });
    }

    await Order.updateMany(
      { sellerEmail: email, status: "success", payoutStatus: "Pending" },
      {
        $set: {
          payoutStatus: "Completed",
          payoutDate: new Date(),
          mailTrack: "SUCCESS MAIL SENT",
        },
      },
    );

    sendPayoutEmail(summary[0]).catch((err) =>
      console.log("Email Error:", err),
    );

    res.status(200).json({
      success: true,
      message: "Payout updated using DB records & Mail sent!",
    });
  } catch (error) {
    console.error("Payout Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. 📧 SEND EMAIL DISPATCHER | LOGIC: AUTOMATED SYSTEM NOTIFICATIONS
const sendPayoutEmail = async (sellerData) => {
  try {
    const data = Array.isArray(sellerData) ? sellerData[0] : sellerData;

    if (!data || !data.sellerEmail) {
      console.error("⚠️ Invalid sellerData received:", data);
      throw new Error("Invalid seller data or missing email");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const coursesArr = data.courses || [];
    const courseRows =
      coursesArr.length > 0
        ? coursesArr
            .map(
              (c) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eeeeee; font-family: sans-serif; font-size: 14px;">
                    ${c.name || "Unknown Course"} <b>(x${c.count || 0})</b>
                </td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-family: sans-serif; font-size: 14px; color: #2ecc71;">
                    ₹${Number(c.total || 0).toLocaleString("en-IN")}
                </td>
            </tr>
        `,
            )
            .join("")
        : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #888;">No course details available</td></tr>`;

    const mailOptions = {
      from: `"BR30 Kart Admin" <${process.env.EMAIL_USER}>`,
      to: data.sellerEmail,

      bcc: process.env.ADMIN_EMAIL || [],
      subject: `✅ Payment Processed: ₹${Number(data.netPayout || 0).toLocaleString("en-IN")} Credited`,
      html: payoutTemplate(data, courseRows),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Payout Email Sent to: ${data.sellerEmail}`);
    return info;
  } catch (err) {
    console.error("❌ sendPayoutEmail Error:", err.message);

    throw err;
  }
};

// 12. 🏪 GET ALL SELLERS | LOGIC: RETRIEVING REGISTERED SELLER DIRECTORY
exports.getAllData = async (req, res) => {
  try {
    const studentsAndVips = await User.find({
      role: { $in: ["student", "vip"] },
    }).sort({ createdAt: -1 });

    const sellers = await User.find({ role: "seller" }).sort({ createdAt: -1 });

    const totalStudents = studentsAndVips.length;
    const totalSellers = sellers.length;

    res.status(200).json({
      success: true,

      totalStudents,
      totalSellers,

      students: studentsAndVips,
      sellers: sellers,
    });

    console.log(
      `📊 Data Fetched: ${totalStudents} Users (Student+VIP), ${totalSellers} Sellers`,
    );
  } catch (error) {
    console.error("Dashboard Data Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Data fetch nahi ho paya",
      error: error.message,
    });
  }
};

// 13. ✅ VERIFY SELLER & NOTIFY | LOGIC: TOGGLE VERIFICATION & SUCCESS EMAIL DISPATCH
exports.toggleVerification = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User nahi mila" });

    user.isApproved = !user.isApproved;
    await user.save();

    const isApproved = user.isApproved;

    const status = isApproved ? "APPROVED" : "UNVERIFIED";
    const color = isApproved ? "#27ae60" : "#e74c3c";
    const statusEmoji = isApproved ? "✅" : "❌";

    const subject = `Account Status: ${status} ${statusEmoji}`;

    let sellerIdBlock = "";
    if (isApproved && user.sellerId) {
      sellerIdBlock = `
        <div style="margin-top:15px; padding:12px; border:2px dashed #27ae60; border-radius:8px; text-align:center;">
          <p style="margin:0; font-size:14px;">Your Seller ID</p>
          <h2 style="margin:5px 0; color:#27ae60;">${user.sellerId}</h2>
          <p style="font-size:12px; color:#666;">Keep this ID safe for tracking & support</p>
        </div>
      `;
    }

    const message = isApproved
      ? `
        <p>🎉 Congratulations <b>${user.name}</b>,</p>
        <p>Your account has been <b style="color:${color};">approved</b> successfully.</p>
        <p>You can now access all platform features without restrictions.</p>

        ${sellerIdBlock}  <!-- 🔥 HERE -->
      `
      : `
        <p>⚠️ Hello <b>${user.name}</b>,</p>
        <p>Your account has been marked as <b style="color:${color};">unverified</b>.</p>
        <p>Some features may be restricted until verification is completed again.</p>
      `;

    const body = `
      ${message}

      <div style="margin-top:15px; padding:12px; border-left:4px solid ${color}; background:${color}15; border-radius:6px;">
        <b>Current Status: ${status} ${statusEmoji}</b>
      </div>

      <p style="margin-top:15px;">
        If you have any query, you can contact our support team.
      </p>
    `;

    await sendNotificationEmail(
      user.email,
      subject,
      "Seller Account Update",
      body,
      color,
    );

    res.json({
      success: true,
      msg: `Account ${status} ${statusEmoji}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 14. ❌ REJECT REQUEST & NOTIFY | LOGIC: STATUS UPDATE & REJECTION EMAIL DISPATCH
exports.rejectSellerDocs = async (req, res) => {
  try {
    const { userId, email, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User nahi mila" });

    user.isApproved = false;
    user.isRejected = true;
    await user.save();

    const emailBody = rejectDocsTemplate(user.name, reason);

    await sendEmail({
      to: email,
      subject: "Verification Result ❌ - Documents Rejected",
      html: emailBody,
    });

    res.json({
      success: true,
      msg: "Seller rejected + email sent successfully ✅",
    });
  } catch (err) {
    console.error("🔥 Rejection Error:", err);
    res.status(500).json({ msg: "Server error during rejection" });
  }
};

// 15. 🛒 GET ALL PRODUCTS | LOGIC: RETRIEVING FULL INVENTORY & CATALOG DATA
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Server Error: Data nahi mil raha" });
  }
};

// 16. ⚡ CORE APPROVAL CONTROLLER | LOGIC: CENTRALIZED DECISION ENGINE FOR APPROVE/REJECT
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ msg: "Course nahi mila bhai!" });

    product.isApproved = !product.isApproved;
    await product.save();

    res.json({
      success: true,
      msg: `Course is now ${product.isApproved ? "Approved ✅" : "Rejected ❌"}`,
      status: product.isApproved,
    });
  } catch (err) {
    res.status(500).json({ error: "Approval toggle failed" });
  }
};

// 17. 👁️ TOGGLE VISIBILITY | LOGIC: HIDE OR SHOW CONTENT IN REAL-TIME (toggleVisibility)
exports.toggleVisibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, msg: "Course nahi mila!" });

    product.isVisible = product.isVisible === true ? false : true;

    await product.save();

    res.json({
      success: true,
      isVisible: product.isVisible,
      msg: product.isVisible
        ? "Course is now Visible on Store 👁️"
        : "Course is now Hidden 🚫",
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// 18. 🎫 RESET/DELETE COUPON | LOGIC: INVALIDATING DISCOUNTS & SETTING VALUE TO 0
exports.resetCourseDiscount = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { discount: 0 },
      { new: true },
    );

    if (!product) return res.status(404).json({ msg: "Course nahi mila!" });

    res.json({
      success: true,
      msg: "Course discount/coupon reset ho gaya! ⚡",
    });
  } catch (err) {
    res.status(500).json({ error: "Coupon reset failed" });
  }
};

// 19. 🗑️ DELETE COURSE | LOGIC: PERMANENT REMOVAL OF COURSE CONTENT & ASSETS
exports.deleteCourse = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Course parmanently delete ho gaya!" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

// 20. 📦 GET ALL ORDERS | LOGIC: MASTER ADMIN GLOBAL ORDER OVERVIEW & TRACKING
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Order fetch failed!" });
  }
};

// 21. 🔍 GET SINGLE ORDER DETAILS | LOGIC: RETRIEVING SPECIFIC ORDER METADATA & STATUS
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ msg: "Bhai, ye order database mein nahi mila!" });
    }

    res.json(order);
  } catch (err) {
    console.error("❌ Order Detail Error:", err);
    res.status(500).json({ error: "Server Error: Detail fetch nahi ho payi" });
  }
};

// 22. ⏳ FETCH PENDING SELLER REQUESTS | LOGIC: RETRIEVING AWAITING VERIFICATIONS
exports.getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await User.find({
      role: "seller",
      isApproved: false,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingSellers.length,
      sellers: pendingSellers,
    });
  } catch (err) {
    console.error("Error fetching pending sellers:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 23. 🔍 GET SELLER DETAILS | LOGIC: RETRIEVING FULL APPLICATION DATA FOR REVIEW
exports.getSellerDetails = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select(
      "kycDetails bankDetails name email",
    );
    res.json({ success: true, seller });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching data" });
  }
};

// 24. ❌ REJECT SELLER REQUEST | LOGIC: DISAPPROVAL & APPLICANT NOTIFICATION
exports.rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, reason } = req.body;

    const seller = await User.findByIdAndUpdate(
      id,
      { isApproved: false, isRejected: true },
      { new: true },
    );

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const htmlTemplate = rejectSellerTemplate(seller.name, reason);

    console.log(`🚀 Sending rejection mail to: ${email}...`);

    await sendEmail({
      to: email,
      subject: "❌ Action Required: Your Seller Application Status",
      html: htmlTemplate,
    });

    res.status(200).json({
      success: true,
      message: "Seller Rejected & Custom Mail Sent! 📧",
    });
  } catch (err) {
    console.error("🔥 Critical Rejection Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not complete rejection process.",
    });
  }
};

// 25. ✅ APPROVE SELLER REQUEST | LOGIC: FINAL VERIFICATION & ROLE UPGRADE
exports.approveSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await User.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true },
    );

    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found!" });

    const htmlContent = approvalTemplate(seller.name);

    await sendEmail({
      to: seller.email,
      subject: "🎉 Congratulations! Your Seller Account is Approved",
      html: htmlContent,
    });

    res.status(200).json({
      success: true,
      message: "Seller Approved & Professional Mail Sent! 🚀",
    });
  } catch (err) {
    console.error("🔥 Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Server Error: " + err.message });
  }
};

// 26. 🏪 GET SELLERS WITH COURSE STATS | LOGIC: FETCHING SELLER DIRECTORY & AGGREGATED COURSE COUNTS
exports.getSellerTracker = async (req, res) => {
  try {
    const sellers = await User.aggregate([
      { $match: { role: "seller" } },
      {
        $lookup: {
          from: "products",
          localField: "email",
          foreignField: "sellerEmail",
          as: "courses",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          lastLogin: 1,
          isBlocked: 1,
          courseCount: { $size: "$courses" },

          courseList: {
            $map: {
              input: "$courses",
              as: "c",
              in: {
                id: "$$c._id",
                title: "$$c.title",
                price: "$$c.price",
                category: "$$c.category",
                discount: "$$c.discount",
                thumbnail: "$$c.thumbnail",
                createdAt: "$$c.createdAt",
              },
            },
          },
        },
      },
    ]);
    res.json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 27. 🔔 SEND SELLER ALERT EMAIL | LOGIC: DISPATCHING CRITICAL SYSTEM NOTIFICATIONS
exports.sendSellerAlert = async (req, res) => {
  try {
    const { email, name, message } = req.body;

    await sendEmail({
      to: email,
      subject: "⚠️ IMPORTANT: BR30 Admin Alert",
      html: sellerAlertTemplate(name, message),
    });

    console.log(`📧 Alert sent to: ${email}`);
    res.json({ success: true, msg: "Alert Email Dispatched!" });
  } catch (err) {
    console.error("Mail Error:", err.message);
    res.status(500).json({ success: false, msg: "Mail failed to send!" });
  }
};

// 28. 🚫 TOGGLE SELLER BLOCK STATUS | LOGIC: SUSPENDING OR RESTORING SELLER ACCESS
exports.toggleBlockSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User nahi mila!" });

    user.isBlocked = !user.isBlocked;

    await user.save();

    console.log(
      `🚫 Status Updated: ${user.email} is now ${user.isBlocked ? "Blocked" : "Active"}`,
    );

    res.json({ success: true, isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

// 29. 🗑️ DELETE USER ACCOUNT | LOGIC: PERMANENT REMOVAL OF USER DATA & CREDENTIALS
exports.deleteSeller = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "User deleted from DB" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// 30. ⭐ TOGGLE FEATURED STATUS | LOGIC: PROMOTING COURSES TO 'BEST SELLER' CATEGORY
exports.toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, msg: "Product not found!" });

    product.isFeatured = product.isFeatured === true ? false : true;
    await product.save();

    res.json({
      success: true,
      isFeatured: product.isFeatured,
      msg: product.isFeatured
        ? "Marked as Best Seller 🔥"
        : "Removed from Best Seller",
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// 31. 📦 BULK ACTIONS CONTROLLER | LOGIC: BATCH PROCESSING FOR MULTIPLE COURSE UPDATES
exports.bulkUpdateCourses = async (req, res) => {
  try {
    const { ids, action } = req.body;

    console.log("Bulk Action Received:", { action, idsCount: ids?.length });

    if (!ids || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No IDs provided" });
    }

    if (action === "delete") {
      await Product.deleteMany({ _id: { $in: ids } });
      return res.json({ success: true, message: "Selected courses deleted!" });
    }

    const actionsMap = {
      approve: { isApproved: true },
      unapprove: { isApproved: false },
      hide: { isVisible: false },
      unhide: { isVisible: true },
      bestseller: { isFeatured: true },
      remove_bestseller: { isFeatured: false },
      del_coupon: { discount: 0 },
    };

    const updateData = actionsMap[action];

    if (!updateData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action selected" });
    }

    await Product.updateMany({ _id: { $in: ids } }, { $set: updateData });

    res.json({
      success: true,
      message: `Applied ${action} to ${ids.length} items!`,
    });
  } catch (error) {
    console.error("❌ BACKEND CRASH ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 31. 📩 SELLER ALERT DISPATCHER | LOGIC: SENDING NOTIFICATIONS FROM COURSE MANAGEMENT PANEL
exports.sendSellerActionMail = async (req, res) => {
  try {
    const { sellerEmail, sellerName, reason, message, courseId, courseTitle } =
      req.body;

    console.log("📩 Attempting to Notify Seller:", sellerEmail);

    const htmlContent = sellerAlertTemplate2({
      userName: sellerName || "Valued Seller",
      reason: reason,
      alertMessage: message || "No extra message provided by Admin.",
      courseTitle: courseTitle,
    });

    await sendEmail({
      email: sellerEmail,
      subject: `🚨 Admin Action: ${reason} (${courseTitle || "Update"})`,
      html: htmlContent,
    });

    console.log("✅ Mail Sent Successfully to:", sellerEmail);
    res.json({ success: true, message: "Seller notified successfully! 📧" });
  } catch (error) {
    console.error("❌ Mail Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Mail failed: " + error.message });
  }
};

// 33. 👥 BULK USER UPDATE | LOGIC: BATCH PROCESSING FOR MULTIPLE USER ATTRIBUTES
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No user selected. Please pick one!",
      });
    }

    const queryIds = { _id: { $in: ids } };

    // 2. Role-Based Database Operations
    switch (action) {
      // --- 🏪 SELLER CONTROL ---
      case "approve_seller":
        await User.updateMany(
          { ...queryIds, role: "seller" },
          { $set: { isApproved: true } },
        );
        break;
      case "unapprove_seller":
        await User.updateMany(
          { ...queryIds, role: "seller" },
          { $set: { isApproved: false } },
        );
        break;
      case "block_seller":
        await User.updateMany(
          { ...queryIds, role: "seller" },
          { $set: { isBlocked: true } },
        );
        break;
      case "unblock_seller":
        await User.updateMany(
          { ...queryIds, role: "seller" },
          { $set: { isBlocked: false } },
        );
        break;
      case "delete_seller":
        await User.deleteMany({ ...queryIds, role: "seller" });
        break;

      // --- 💎 VIP CONTROL (Role Switch, Block, Delete) ---
      case "make_vip":
        await User.updateMany(queryIds, { $set: { role: "vip", isVip: true } });
        break;
      case "remove_vip":
        // VIP hata kar wapas Student role set kar rahe hain
        await User.updateMany(
          { ...queryIds, role: "vip" },
          { $set: { role: "student", isVip: false } },
        );
        break;
      case "block_vip":
        await User.updateMany(
          { ...queryIds, role: "vip" },
          { $set: { isBlocked: true } },
        );
        break;
      case "unblock_vip":
        await User.updateMany(
          { ...queryIds, role: "vip" },
          { $set: { isBlocked: false } },
        );
        break;
      case "delete_vip":
        await User.deleteMany({ ...queryIds, role: "vip" });
        break;

      // --- 🎓 STUDENT CONTROL (Block, Delete, Certificate) ---
      case "block_student":
        await User.updateMany(
          { ...queryIds, role: "student" },
          { $set: { isBlocked: true } },
        );
        break;
      case "unblock_student":
        await User.updateMany(
          { ...queryIds, role: "student" },
          { $set: { isBlocked: false } },
        );
        break;
      case "delete_student":
        await User.deleteMany({ ...queryIds, role: "student" });
        break;
      case "reject_cert":
        await User.updateMany(queryIds, {
          $set: { isCertified: false, "certificateData.status": "Rejected" },
        });
        break;

      // --- 💀 DANGER ZONE ---
      case "delete_all":
        await User.deleteMany(queryIds);
        break;

      case "make_seller":
        await User.updateMany(queryIds, {
          $set: { role: "seller", isVip: false, isApproved: true },
        });
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid action selected!" });
    }

    res.json({
      success: true,
      message: `Bulk Action '${action}' successfully processed for selected users! 🔥`,
    });
  } catch (error) {
    console.error("❌ Bulk User Update Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error! " + error.message });
  }
};

// 34. 👁️ HIDE ENROLLED COURSE | LOGIC: TOGGLING VISIBILITY ON STUDENT ACTIVE PANEL
exports.getStudentTrackerData = async (req, res) => {
  try {
    console.log("📡 Fetching students for tracker...");

    const students = await User.find({
      role: { $in: ["student", "vip", "STUDENT", "VIP"] },
    })
      .populate("purchasedCourses", "title thumbnail price")
      .select("-password")
      .sort({ lastLogin: -1 });

    console.log(`✅ Found ${students.length} students in DB`);

    res.json({
      success: true,
      students: students,
    });
  } catch (err) {
    console.error("❌ Tracker API Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 35. 🌓 TOGGLE COURSE VISIBILITY | LOGIC: SWITCHING BETWEEN HIDDEN AND VISIBLE STATES
exports.toggleHideCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const user = await User.findById(userId);

    const isHidden = user.hiddenCourses.some(
      (h) => h.courseId.toString() === courseId,
    );

    if (isHidden) {
      user.hiddenCourses = user.hiddenCourses.filter(
        (h) => h.courseId.toString() !== courseId,
      );
    } else {
      user.hiddenCourses.push({ courseId });
    }

    await user.save();
    res.json({
      success: true,
      message: isHidden ? "Course Unhidden! 👁️" : "Course Hidden! 🚫",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 36. 🗑️ REMOVE COURSE FROM STUDENT | LOGIC: TERMINATING ENROLLMENT & DASHBOARD CLEANUP
exports.deleteStudentCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    await User.findByIdAndUpdate(userId, {
      $pull: {
        purchasedCourses: courseId,
        hiddenCourses: { courseId: courseId },
      },
    });

    res.json({
      success: true,
      message: "Course removed from student library! 🗑️",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 37. 🔔 SEND ALERT EMAIL | LOGIC: DISPATCHING CRITICAL NOTIFICATIONS TO STUDENTS & VIP MEMBERS
exports.sendStudentAlert = async (req, res) => {
  try {
    const { userId, studentEmail, studentName, message, reason } = req.body;

    console.log("📩 Sending Alert to Student:", studentEmail);

    const htmlContent = sellerAlertTemplate2({
      userName: studentName || "Student",
      reason: reason || "Account Update",
      alertMessage:
        message || "Hey, there's an important update for you from the Admin.",
    });

    await sendEmail({
      email: studentEmail,
      subject: `🚨 Important Update: ${reason || "Admin Message"}`,
      html: htmlContent,
    });

    res.json({ success: true, message: "Student notified successfully! 📧" });
  } catch (error) {
    console.error("❌ Student Alert Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Mail failed: " + error.message });
  }
};

//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
