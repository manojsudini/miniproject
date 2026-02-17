import express from "express";
import multer from "multer";
import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import Application from "../models/Application.js";
import cloudinary from "../config/cloudinary.js";
import { sendAcceptanceMail } from "../utils/sendMail.js";

const router = express.Router();

/* FILE UPLOAD CONFIG */
const upload = multer({ dest: "uploads/" });

/* PDF TEXT EXTRACTION FUNCTION */
async function extractTextFromPDF(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ data });

    const pdf = await loadingTask.promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items.map(item => item.str);

      text += strings.join(" ")
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,]/g, "") + "\n";
    }

    return text.trim();
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return "";
  }
}

/* ================= APPLY JOB ================= */

router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Resume required"
      });
    }

    /* Extract text for ATS */
    const extractedText = await extractTextFromPDF(req.file.path);

    /* Upload PDF to Cloudinary */
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "hiremate_resumes",
      use_filename: true,
      unique_filename: false
    });

    /* Save to MongoDB */
    const application = new Application({
      name,
      email,
      phone,
      role,
      resumeName: req.file.originalname,
      resumeUrl: result.secure_url,
      text: extractedText,
      atsScore: 0,
      status: "Pending"
    });

    await application.save();

    /* Delete local temp file */
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Application submitted successfully"
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({
      message: "Error uploading resume"
    });
  }
});

/* ================= GET APPLICATIONS ================= */

router.get("/", async (req, res) => {
  try {
    const apps = await Application.find();
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching applications"
    });
  }
});

/* ================= UPDATE STATUS + SEND MAIL ================= */

router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    /* Send mail when accepted */
    if (status === "Accepted") {
      await sendAcceptanceMail(
        application.email,
        application.name
      );
    }

    res.json(application);

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({
      message: "Status update failed"
    });
  }
});

export default router;