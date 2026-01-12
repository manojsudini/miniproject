import express from "express";
import upload from "../middleware/upload.js";
import { applyJob } from "../controllers/applicationController.js";

const router = express.Router();

router.post("/apply", upload.single("resume"), applyJob);

export default router;
