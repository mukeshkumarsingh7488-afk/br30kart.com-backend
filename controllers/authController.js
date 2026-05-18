import axios from "axios";
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const {
  sendEmail,
  registerOtpTemplate,
  forgotPasswordTemplate,
  sellerForgotPasswordTemplate,
  sellerOtpTemplate,
} = require("../utils/emailTemplate");

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        msg: "All fields are required!",
      });
    }

    if (!process.env.BREVO_EMAIL || !process.env.BREVO_SMTP_KEY) {
      return res.status(500).json({
        msg: "Email service configuration missing",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser?.isVerified) {
      return res.status(400).json({
        msg: "User already exists. Please login.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(password, 10);

    const masterAdminEmail =
      process.env.MASTER_ADMIN_EMAIL?.trim().toLowerCase();

    const isAdmin = normalizedEmail === masterAdminEmail;

    const isSeller = role === "seller";

    const userRole = isAdmin ? "admin" : isSeller ? "seller" : "student";

    let user;

    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.password = hashedPassword;
      existingUser.role = userRole;
      existingUser.isVerified = false;
      existingUser.otp = otp;
      existingUser.otpExpires = Date.now() + 10 * 60 * 1000;

      user = await existingUser.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: userRole,
        isVerified: false,
        otp,
        otpExpires: Date.now() + 10 * 60 * 1000,
      });
    }

    const htmlTemplateContent = isSeller
      ? sellerOtpTemplate(otp, name)
      : registerOtpTemplate(otp, name);

    const brevoResponse = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "BR30 Support Terminal",
          email: process.env.BREVO_EMAIL.trim(),
        },
        to: [
          {
            email: normalizedEmail,
          },
        ],
        subject: "🔐 Verify Your Account - OTP Security Token",
        htmlContent: htmlTemplateContent,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_SMTP_KEY.trim(),
          "content-type": "application/json",
        },
      },
    );

    if (brevoResponse.status === 200 || brevoResponse.status === 201) {
      return res.status(200).json({
        msg: "OTP sent successfully! Please verify your email.",
      });
    }

    throw new Error("Failed to send OTP email");
  } catch (err) {
    console.error(
      "🔥 Critical Registration API Error:",
      err.response?.data || err.message,
    );

    return res.status(500).json({
      msg: "Server error",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: "Already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.status(200).json({
      msg: "Account verified successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found!" });

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        msg: "Your account has been blocked. Please contact support for assistance. 🚫",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        msg: "Your email is not verified. Please verify your account using the OTP. ⚠️",
      });
    }

    if (user.isRejected) {
      return res.status(403).json({
        success: false,
        msg: "Your registration request has been rejected. ❌",
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        msg: "Your account is pending approval. Please wait for admin review. ⏳",
      });
    }

    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL;
    const isAdmin = email.toLowerCase() === masterAdminEmail.toLowerCase();

    if (!isAdmin && !user.isVerified) {
      return res.status(401).json({ msg: "Please verify your email first!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials!" });

    if (!isAdmin && user.role === "seller" && !user.isApproved) {
      return res.status(403).json({
        msg: "⏳ Aapka Seller Account abhi Verification mein hai. Admin approval ke baad hi aap login kar payenge (24-48h).",
      });
    }

    const finalRole = isAdmin ? "admin" : user.role;

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: finalRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: finalRole,
        badge: user.badge,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Login failed!" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        msg: "Email is required!",
      });
    }

    if (!process.env.BREVO_EMAIL || !process.env.BREVO_SMTP_KEY) {
      return res.status(500).json({
        msg: "Email service configuration missing",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        msg: "User with this email does not exist!",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const isSeller = user.role === "seller";

    const html = isSeller
      ? sellerForgotPasswordTemplate(otp, user.name)
      : forgotPasswordTemplate(otp, user.name);

    const brevoResponse = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "BR30 Kart",
          email: process.env.BREVO_EMAIL.trim(),
        },
        to: [
          {
            email: normalizedEmail,
          },
        ],
        subject: isSeller ? "Seller Password Reset OTP" : "Password Reset OTP",
        htmlContent: html,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_SMTP_KEY.trim(),
          "content-type": "application/json",
        },
      },
    );

    if (brevoResponse.status === 200 || brevoResponse.status === 201) {
      return res.status(200).json({
        msg: "Reset OTP sent to your email!",
      });
    }

    throw new Error("Failed to send reset OTP email");
  } catch (err) {
    console.error("Forgot Password Error:", err.response?.data || err.message);

    return res.status(500).json({
      msg: "Error sending reset OTP!",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (user && user.otp === otp && user.otpExpires > Date.now()) {
      user.password = await bcrypt.hash(newPassword, 10);
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      res
        .status(200)
        .json({ msg: "Password Reset Successful! You can login now." });
    } else {
      res.status(400).json({ msg: "Invalid OTP or Expired!" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Reset failed!" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found!" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    let updateData = {};

    if (name) updateData.name = name;

    if (req.file && req.file.path) {
      updateData.profilePic = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ msg: "User not found!" });

    res.json({ msg: "Profile Updated! 🚀", user: updatedUser });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ msg: "Server Error during update!" });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        msg: "Bhai, email dena zaroori hai!",
      });
    }

    if (!process.env.BREVO_EMAIL || !process.env.BREVO_SMTP_KEY) {
      return res.status(500).json({
        msg: "Email service configuration missing",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      email: normalizedEmail,
    });

    if (user) {
      if (user.isApproved === true) {
        return res.status(400).json({
          msg: "Email already registered and Approved! Please Login.",
        });
      }

      if (!user.isRejected && user.password) {
        return res.status(400).json({
          msg: "Email already registered! Please Login.",
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (!user) {
      user = new User({
        email: normalizedEmail,
        otp,
        otpExpires,
        name: name?.trim() || "Pending Verification",
        role: "seller",
        isApproved: false,
        isRejected: false,
        isVerified: false,
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.isVerified = false;

      if (name?.trim()) {
        user.name = name.trim();
      }
    }

    await user.save({
      validateBeforeSave: false,
    });

    const subject = user.isRejected
      ? "OTP for Re-application"
      : "Your Seller Verification OTP";

    const brevoResponse = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "BR30Kart Support",
          email: process.env.BREVO_EMAIL.trim(),
        },
        to: [
          {
            email: normalizedEmail,
          },
        ],
        subject,
        htmlContent: sellerOtpTemplate(otp, user.name || "User"),
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_SMTP_KEY.trim(),
          "content-type": "application/json",
        },
      },
    );

    if (brevoResponse.status === 200 || brevoResponse.status === 201) {
      return res.status(200).json({
        msg: "OTP sent successfully! 📩",
      });
    }

    throw new Error("Failed to send OTP");
  } catch (err) {
    console.error("🔥 Send OTP Error:", err.response?.data || err.message);

    return res.status(500).json({
      msg: "Server error! OTP send nahi ho paya!",
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(`🔍 Verifying OTP for: ${email}, OTP: ${otp}`);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User record nahi mila!" });
    }

    if (user.otp === otp && Date.now() < user.otpExpires) {
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;

      await user.save({ validateBeforeSave: false });

      console.log("✅ Email Verified Successfully!");
      return res.status(200).json({ msg: "Email Verified! ✅" });
    } else {
      console.log("❌ Wrong or Expired OTP");
      return res.status(400).json({ msg: "Wrong OTP ya Expired! ❌" });
    }
  } catch (err) {
    console.error("🔥 Verify Error:", err);
    res.status(500).json({ msg: "Verification fail ho gayi!" });
  }
};

exports.sellerRegister = async (req, res) => {
  try {
    const { name, email, password, aadharNo, bankName, accountNo, ifscCode } =
      req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ msg: "Pehle OTP verify karein! ⚠️" });
    }

    const masterEmail = process.env.MASTER_ADMIN_EMAIL || "";
    const isAdmin = email.toLowerCase() === masterEmail.toLowerCase();

    if (
      !isAdmin &&
      (!req.files?.aadharFront || !req.files?.aadharBack || !req.files?.bankDoc)
    ) {
      return res.status(400).json({
        msg: "Please upload all required documents (Aadhaar Front, Back, and Bank Document). 📁",
      });
    }

    user.name = name;
    user.password = await bcrypt.hash(password, 10);
    user.role = isAdmin ? "admin" : "seller";
    user.isApproved = isAdmin ? true : false;

    user.isRejected = false;

    user.kycDetails = {
      aadharNo: isAdmin ? "" : aadharNo,
      aadharFront:
        req.files?.aadharFront?.[0]?.path || user.kycDetails?.aadharFront || "",
      aadharBack:
        req.files?.aadharBack?.[0]?.path || user.kycDetails?.aadharBack || "",
    };

    user.bankDetails = {
      bankName: bankName || "",
      accountNo: accountNo || "",
      ifscCode: ifscCode || "",
      bankDoc: req.files?.bankDoc?.[0]?.path || user.bankDetails?.bankDoc || "",
    };

    user.otp = null;
    user.otpExpires = null;

    await user.save();
    console.log(
      `✅ Application updated for: ${email}. isRejected reset to false.`,
    );

    res.status(201).json({
      msg: isAdmin
        ? "Master Admin Registered! 🚀"
        : "Application Submitted Successfully! Purana data update kar diya gaya hai. ⏳",
    });
  } catch (err) {
    console.error("🔥 Registration Final Error:", err);
    res.status(500).json({ msg: "Registration failed! Error: " + err.message });
  }
};
