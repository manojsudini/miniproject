import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    role: String,
    resumeUrl: String,
    status: String,
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
