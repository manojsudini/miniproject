const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const configuredApiBaseUrl = trimTrailingSlash(
  process.env.REACT_APP_API_BASE_URL || ""
);

export const API_BASE_URL = configuredApiBaseUrl;

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const RAZORPAY_KEY_ID =
  process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_SN7sEcagRzBQAG";
