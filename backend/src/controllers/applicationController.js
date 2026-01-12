import Application from "../models/Application.js";
import streamifier from "streamifier";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const cloudinary = require("../config/cloudinary.cjs");

export const applyJob = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Resume is required" });
    }

    const fileName = path.parse(req.file.originalname).name;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "hiremate_resumes",
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    await Application.create({
      name,
      email,
      phone,
      role,
      resumeUrl: uploadResult.secure_url,
      resumeName: req.file.originalname,
      status: "ATS Screening",
    });

    res.status(201).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};
