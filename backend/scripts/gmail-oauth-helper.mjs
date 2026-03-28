import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_REDIRECT_URI = "https://developers.google.com/oauthplayground";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

const clientId = getRequiredEnv("GMAIL_CLIENT_ID");
const clientSecret = getRequiredEnv("GMAIL_CLIENT_SECRET");
const redirectUri = process.env.GMAIL_REDIRECT_URI || DEFAULT_REDIRECT_URI;
const authCode = process.env.GMAIL_AUTH_CODE;

if (!authCode) {
  const authUrl = new URL(AUTH_BASE_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GMAIL_SEND_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");

  console.log("Open this URL in your browser and approve Gmail send access:");
  console.log(authUrl.toString());
  console.log("");
  console.log("Then rerun with GMAIL_AUTH_CODE set to the returned authorization code.");
  process.exit(0);
}

const response = await fetch(TOKEN_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authCode,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  }),
});

const data = await response.json().catch(() => null);

if (!response.ok) {
  console.error("Token exchange failed:", data || response.statusText);

  if (data?.error === "invalid_grant") {
    console.log("");
    console.log("The authorization code is invalid, expired, or already used.");
    console.log("Get a fresh code and exchange it immediately.");
    console.log("Do not click the OAuth Playground exchange button before rerunning this script.");
  }

  process.exit(1);
}

console.log("Access token:", data?.access_token || "");
console.log("Refresh token:", data?.refresh_token || "");

if (!data?.refresh_token) {
  console.log("");
  console.log(
    "No refresh token was returned. Revoke the app or use prompt=consent with a fresh authorization flow."
  );
}
