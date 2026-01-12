import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

/* ✅ VERY IMPORTANT: body parser MUST come before routes */
app.use(cors());
app.use(express.json());

/* ✅ Routes AFTER middleware */
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("HireMate Backend Running");
});

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
