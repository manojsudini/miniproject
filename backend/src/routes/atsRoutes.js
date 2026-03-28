import express from "express";

const router = express.Router();

const getAtsServiceBaseUrl = () => {
  const configuredUrl = (process.env.ATS_SERVICE_URL || "http://127.0.0.1:8000")
    .trim()
    .replace(/\/+$/, "");

  if (
    configuredUrl.startsWith("http://") ||
    configuredUrl.startsWith("https://")
  ) {
    return configuredUrl;
  }

  return `http://${configuredUrl}`;
};

const parseJsonSafely = async (response) => {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { message: responseText };
  }
};

const forwardToAts = async (req, res, path) => {
  try {
    const response = await fetch(`${getAtsServiceBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await parseJsonSafely(response);
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("ATS proxy error:", error);
    return res.status(502).json({
      message: "ATS service unavailable",
    });
  }
};

router.post("/match", async (req, res) => {
  await forwardToAts(req, res, "/match");
});

router.post("/match-batch", async (req, res) => {
  await forwardToAts(req, res, "/match-batch");
});

export default router;
