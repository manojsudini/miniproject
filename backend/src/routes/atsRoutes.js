import express from "express";

const router = express.Router();
const ATS_REQUEST_TIMEOUT_MS = Number(process.env.ATS_REQUEST_TIMEOUT_MS || 45000);
const ATS_MAX_RETRIES = Number(process.env.ATS_MAX_RETRIES || 2);

const getAtsServiceBaseUrl = () => {
  const configuredUrl = (
    process.env.ATS_SERVICE_URL ||
    process.env.ATS_SERVICE_HOSTPORT ||
    "http://127.0.0.1:8000"
  )
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

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const shouldRetryRequest = (error, response) => {
  if (response) {
    return response.status >= 500;
  }

  return ["AbortError", "TimeoutError", "TypeError"].includes(error?.name);
};

const fetchWithRetry = async (url, options) => {
  let lastResponse;

  for (let attempt = 0; attempt <= ATS_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(ATS_REQUEST_TIMEOUT_MS),
      });

      if (response.ok || !shouldRetryRequest(undefined, response) || attempt === ATS_MAX_RETRIES) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      if (!shouldRetryRequest(error) || attempt === ATS_MAX_RETRIES) {
        throw error;
      }
    }

    await delay(800 * (attempt + 1));
  }

  return lastResponse;
};

const forwardToAts = async (req, res, path) => {
  const targetUrl = `${getAtsServiceBaseUrl()}${path}`;

  try {
    const response = await fetchWithRetry(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      console.error("ATS upstream request failed:", {
        path,
        status: response.status,
        url: targetUrl,
        response: data,
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("ATS proxy error:", error);
    return res.status(502).json({
      message: "ATS service unavailable",
      details: error?.message || "Unknown ATS proxy error",
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
