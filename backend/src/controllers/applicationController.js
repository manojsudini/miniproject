import Application from "../models/Application.js";
import streamifier from "streamifier";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

/* ===== CLOUDINARY CONFIG ===== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ===== APPLY JOB ===== */
export const applyJob = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const originalName = path.parse(req.file.originalname).name;

    /* ⭐ FIXED CLOUDINARY UPLOAD */
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "hiremate_resumes",
          resource_type: "raw",       // ⭐ IMPORTANT FOR PDF
          use_filename: true,
          unique_filename: false,
          public_id: originalName,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    /* SAVE TO DATABASE */
    const application = await Application.create({
      name,
      email,
      phone,
      role,
      resumeUrl: uploadResult.secure_url,
      resumeName: req.file.originalname,
      status: "ATS Screening",
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};