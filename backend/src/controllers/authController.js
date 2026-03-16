import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";

/* TEMP OTP STORE */
const otpStore = {};

/* ================= SIGNUP ================= */
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully",
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};


/* ================= LOGIN (SEND OTP) ================= */
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    /* ROLE VALIDATION */
    if (user.role !== role) {
      return res.status(403).json({
        message: `You are registered as ${user.role}. Cannot login as ${role}`,
      });
    }

    /* GENERATE OTP */
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    otpStore[email] = otp;

    /* EMAIL TRANSPORTER */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    /* SEND OTP EMAIL */
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "HireMate Login OTP",
      text: `Your OTP for login is: ${otp}`,
    });

    res.json({
      message: "OTP sent to your email",
      email,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};


/* ================= VERIFY OTP ================= */
export const verifyOtp = async (req, res) => {
  try {

    const { email, otp } = req.body;

    if (!otpStore[email] || otpStore[email] !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    /* DELETE OTP AFTER USE */
    delete otpStore[email];

    const user = await User.findOne({ email });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name,
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};