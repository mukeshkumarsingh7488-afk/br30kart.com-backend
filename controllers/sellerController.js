//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
const Order = require("../models/order");

// 1. 📈 GET SELLER ANALYTICS | LOGIC: FETCHING SALES PERFORMANCE & REVENUE METRICS
exports.getSellerAnalytics = async (req, res) => {
  try {
    const { email, start, end } = req.query;

    let query = {
      sellerEmail: email,
      status: "success",
    };

    if (start && end) {
      const startDate = new Date(start);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(end);
      endDate.setUTCHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    let totalRevenue = 0;
    let sellerProfit = 0;
    let pendingAmount = 0;
    let adminFee = 0;

    orders.forEach((order) => {
      totalRevenue += Number(order.amount || 0);

      adminFee += Number(order.platformCommission || 0);
      sellerProfit += Number(order.sellerEarnings || 0);

      if (
        order.payoutStatus &&
        order.payoutStatus.toLowerCase() === "pending"
      ) {
        pendingAmount += Number(order.sellerEarnings || 0);
      }
    });

    res.json({
      success: true,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        sellerProfit: Math.round(sellerProfit),
        pendingAmount: Math.round(pendingAmount),
        adminFee: Math.round(adminFee),
      },
      sales: orders,
    });

    console.log(
      `📊 Analytics: ${email} | Orders: ${orders.length} | Range: ${start} - ${end}`,
    );
  } catch (err) {
    console.error("🔥 Analytics Error:", err);
    res.status(500).json({ success: false, msg: "Calculation Error!" });
  }
};

// 2. 📑 TRACK SALES RECORDS | LOGIC: AGGREGATING REAL-TIME TRANSACTION DATA FROM DB
exports.getSellerSalesRecords = async (req, res) => {
  try {
    const { sellerEmail, search, from, to } = req.query;
    let query = { sellerEmail: sellerEmail };

    if (search) {
      query.productName = { $regex: search, $options: "i" };
    }

    if (from && to) {
      query.createdAt = {
        $gte: new Date(new Date(from).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(to).setUTCHours(23, 59, 59, 999)),
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (Number(order.amount) || 0),
      0,
    );

    const totalEarnings = orders.reduce(
      (sum, order) => sum + (Number(order.sellerEarnings) || 0),
      0,
    );
    const totalCommission = orders.reduce(
      (sum, order) => sum + (Number(order.platformCommission) || 0),
      0,
    );

    const pendingAmount = orders.reduce((sum, order) => {
      if (
        order.payoutStatus &&
        order.payoutStatus.toLowerCase() === "pending"
      ) {
        return sum + (Number(order.sellerEarnings) || 0);
      }
      return sum;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        orders,
        totals: {
          revenue: Math.round(totalRevenue),
          earnings: Math.round(totalEarnings),
          commission: Math.round(totalCommission),
          pending: Math.round(pendingAmount),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. 🎖️ GET BEST SELLER BADGE | LOGIC: CALCULATING PERFORMANCE THRESHOLDS FOR RECOGNITION
exports.getBestSellers = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      console.log("⚠️ [WARNING]: Email missing in query params");
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }

    console.log(`📊 [FETCHING]: Best Seller Data for: ${email}`);

    const salesStats = await Order.aggregate([
      { $match: { sellerEmail: email, status: "success" } },
      {
        $group: {
          _id: "$productName",
          count: { $sum: 1 },

          revenue: {
            $sum: {
              $convert: {
                input: "$amount",
                to: "double",
                onError: 0.0,
                onNull: 0.0,
              },
            },
          },
          totalEarnings: {
            $sum: {
              $convert: {
                input: "$sellerEarnings",
                to: "double",
                onError: 0.0,
                onNull: 0.0,
              },
            },
          },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const allOrders = await Order.find({
      sellerEmail: email,
      status: "success",
    }).sort({ createdAt: -1 });

    console.log(
      `✅ [SUCCESS]: Stats found: ${salesStats.length}, Total Orders: ${allOrders.length}`,
    );

    const worstSeller =
      salesStats.length > 1 ? salesStats[salesStats.length - 1] : null;

    res.status(200).json({
      success: true,
      topSellers: salesStats,
      worstSeller: worstSeller,
      allData: allOrders,
    });
  } catch (err) {
    console.error("❌ [CRITICAL ERROR]:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
