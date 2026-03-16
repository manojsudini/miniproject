import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    role: {
      type: String,
      required: true
    },

    resumeName: String,

    resumeUrl: String,

    /* Extracted resume text used for AI matching */
    text: String,

    /* ATS match percentage from AI */
    atsScore: {
      type: Number,
      default: 0
    },

    /* Application status */
    status: {
      type: String,
      default: "APPLIED"
    },

    /* HR rejection reason */
    rejectionReason: {
      type: String,
      default: ""
    },

    /* Interview scheduling fields */
    interviewDate: String,

    interviewTime: String,

    interviewMode: String
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);