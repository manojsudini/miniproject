import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  role: String,
  resumeName: String,
  resumeUrl: String,
  text: String,
  atsScore: Number,

  status: {
    type: String,
    default: "Pending"
  },

   
  interviewDate: String,
  interviewTime: String,
  interviewMode: String

}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);