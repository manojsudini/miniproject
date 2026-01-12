import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

/* 🔥 Load env BEFORE cloudinary initializes */
dotenv.config();

/* Cloudinary will auto-read CLOUDINARY_URL */
export default cloudinary;
