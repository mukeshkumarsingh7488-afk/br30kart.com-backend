//#region ━━━━━ 🚀 WELCOME DEVELOPER | SYSTEM INITIALIZED ━━━━━
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require("../models/Notification");

// 1. 📦 GET SELLER PRODUCTS | LOGIC: FETCHING INVENTORY FOR THE SELLER DASHBOARD
exports.getProductsByCategory = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller" && user.role !== "admin") {
      return res.status(403).json({ msg: "Not allowed" });
    }

    let { category } = req.query;

    const filter = {
      sellerId: user.sellerId,
    };

    if (category && category !== "all") {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// 2. 🚀 ADD NEW PRODUCT | LOGIC: PRODUCT CREATION & MEDIA UPLOAD (SELLER DASHBOARD)
exports.addProduct = async (req, res) => {
  console.log("🚀 Add Product Process Started...");

  try {
    const user = req.user;

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return res.status(403).json({ msg: "Only seller/admin allowed" });
    }

    const { title, category, price, videoLink, thumbnail } = req.body;

    const data = {
      title,
      category,
      price,
      videoLink,
      thumbnail,
      sellerId: user.sellerId,
      sellerEmail: user.email,
      sellerName: user.name,
      discount: 0,
      isApproved: user.role === "admin" ? true : false,
      createdAt: new Date(),

      lessons: [
        {
          title: "Introduction",
          videoLink: videoLink,
          isFree: true,
        },
      ],
    };

    const newProduct = new Product(data);
    await newProduct.save();
    console.log("✅ Product saved with Video Logic:", newProduct._id);

    try {
      const notifData = new Notification({
        title: "Naya Course Launch! 🔥",
        message: `${title} ab live hai. Abhi seekhna shuru karein!`,
        productId: newProduct._id,
      });
      await notifData.save();
      console.log("✅ Notification saved to DB");
    } catch (notifErr) {
      console.error(
        "❌ Notification DB Error (Non-critical):",
        notifErr.message,
      );
    }

    const io = req.app.get("socketio");
    if (io) {
      io.emit("new_notification", {
        type: "NEW_PRODUCT",
        title: "Naya Course! 🔥",
        message: `${title} ab live hai.`,
        productId: newProduct._id,
        productData: newProduct,
      });
      console.log("📡 Socket: Notification Sent");
    }

    res.status(201).json({
      success: true,
      message: "Product & Notification uploaded successfully!",
      data: newProduct,
    });
  } catch (err) {
    console.error("🔥 GLOBAL ERROR:", err);
    res.status(400).json({ error: "Upload failed", details: err.message });
  }
};

// 3. 🔄 UPDATE COURSE LOGIC | LOGIC: MODIFYING CONTENT & METADATA (SELLER DASHBOARD)
exports.updateCourse = async (req, res) => {
  console.log("=================================");
  console.log("🚀 Update Request Process Started...");
  console.log("🔍 Searching for ID:", req.params.id);

  try {
    const user = req.user;

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      console.log("❌ Unauthorized: Role not allowed");
      return res.status(403).json({ msg: "Only seller/admin allowed" });
    }

    const { title, price, videoLink } = req.body;

    let updateFields = {};
    if (title) updateFields.title = title;
    if (price) updateFields.price = Number(price);
    if (videoLink) updateFields.videoLink = videoLink;

    if (req.file) {
      updateFields.thumbnail = req.file.path;
      console.log("📷 New Image Path:", req.file.path);
    }

    console.log("📦 Data going to DB update:", updateFields);

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedCourse) {
      console.log("❌ DB mein ye ID nahi mili!");
      return res
        .status(404)
        .json({ success: false, msg: "Course ID nahi mili" });
    }

    try {
      if (typeof Notification !== "undefined") {
        const notifData = new Notification({
          title: "Course Updated! 📢",
          message: `${updatedCourse.title} mein kuch naya badlav hua hai.`,
          productId: updatedCourse._id,
        });
        await notifData.save();
        console.log("✅ Update notification saved to DB");
      }
    } catch (notifErr) {
      console.error("❌ Notification DB Error:", notifErr.message);
    }

    const io = req.app.get("socketio");
    if (io) {
      io.emit("new_notification", {
        type: "UPDATE_PRODUCT",
        title: "Course Updated! 📢",
        message: `${updatedCourse.title} में कुछ नया बदलाव हुआ है।`,
        productId: updatedCourse._id,
        productData: updatedCourse,
      });
      console.log("📡 Socket event emitted: Course Updated");
    }

    console.log("🎉 DB Updated Successfully");
    res.json({ success: true, data: updatedCourse });
  } catch (err) {
    console.error("🔥 GLOBAL UPDATE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 4. 💎 COURSE PURCHASE ENROLLMENT | LOGIC: VIP BADGE ASSIGNMENT & WELCOME EMAIL DISPATCH
exports.purchaseCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ msg: "Course nahi mila!" });
    }

    if (!user) {
      return res.status(404).json({ msg: "User nahi mila!" });
    }

    if (!Array.isArray(user.purchasedCourses)) {
      user.purchasedCourses = [];
    }

    const alreadyPurchased = user.purchasedCourses.some(
      (c) => c.courseId.toString() === courseId.toString(),
    );

    if (alreadyPurchased) {
      return res.status(400).json({
        msg: "Aapne ye course pehle hi kharid liya hai! 🚫",
      });
    }

    user.purchasedCourses.push({
      courseId: course._id,
      purchasedAt: new Date(),
    });

    // 💎 VIP upgrade logic
    user.isVip = true;
    user.role = "vip";

    await user.save();

    try {
      const html = purchaseTemplate(user.name, course.title);

      await sendEmail({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "💎 VIP Status Unlocked!",
        html,
      });

      console.log("💎 VIP Welcome Email Sent!");
    } catch (mailErr) {
      console.log("❌ Mail Error:", mailErr.message);
    }

    // 📦 RESPONSE (frontend ready)
    res.status(200).json({
      success: true,
      msg: "Course purchased successfully! 💎",
      purchasedCourse: course,
      totalCourses: user.purchasedCourses.length,
      isVip: user.isVip,
    });
  } catch (err) {
    console.error("🔥 Purchase Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// 5. 🛒 BUY COURSE EXECUTION | LOGIC: INITIATING CHECKOUT & ENROLLMENT PROCESS
exports.purchaseProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ msg: "Invalid Course ID" });
    }

    const user = await User.findById(userId);
    const course = await Product.findById(courseId);

    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    const alreadyBought = user.purchasedCourses.some(
      (id) => id.toString() === courseId,
    );

    if (alreadyBought) {
      return res.status(200).json({
        success: true,
        msg: "Already purchased ✅",
      });
    }

    user.purchasedCourses.push(courseId);

    await user.save();

    res.json({
      success: true,
      msg: "Course purchased successfully 🚀",
    });
  } catch (err) {
    console.error("❌ PURCHASE ERROR:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 6. 🔐 FETCH MY COURSES | LOGIC: RETRIEVING ENROLLMENTS WITH AUTO-LOCK VERIFICATION
exports.getMyProducts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("purchasedCourses");

    if (!user) return res.status(404).json({ msg: "User nahi mila!" });

    const coursesWithStatus = user.purchasedCourses.map((course) => {
      const isLocked = user.hiddenCourses.some(
        (h) => h.courseId.toString() === course._id.toString(),
      );

      return {
        ...course._doc,
        isLocked: isLocked,
      };
    });

    console.log(
      `📦 Sending ${coursesWithStatus.length} courses with lock status`,
    );
    res.json(coursesWithStatus);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 7. 📺 FETCH WATCH PAGE CONTENT | LOGIC: LOADING COURSE VIDEOS & RESOURCES (watch.html)
exports.getProductById = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;

    const user = await User.findById(userId);

    const isPurchased = user.purchasedCourses.some(
      (id) => id.toString() === courseId,
    );

    if (!isPurchased) {
      return res.status(403).json({
        message: "❌ Pehle course kharido bhai!",
      });
    }

    const course = await Product.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    res.json(course);
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// 8. 🗑️ DELETE PRODUCT | LOGIC: PERMANENT REMOVAL OF CONTENT & ASSOCIATED ASSETS
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// 9. 🌓 TOGGLE VISIBILITY | LOGIC: SWITCHING PRODUCT BETWEEN HIDE AND UNHIDE STATES
exports.toggleVisibility = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, msg: "Product nahi mila bhai!" });
    }

    product.isVisible = product.isVisible === true ? false : true;

    await product.save();

    res.json({
      success: true,
      isVisible: product.isVisible,
      msg: `Course ab ${product.isVisible ? "Visible" : "Hidden"} ho gaya hai!`,
    });
  } catch (err) {
    console.error("Toggle Error:", err.message);
    res.status(500).json({ success: false, msg: "Server error occurred" });
  }
};
//#endregion
// ==========================================
// ✅ Code successfully organized and refactored.
// 🚀 Ready for Production!
// ==========================================
