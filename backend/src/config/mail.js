import dns from "node:dns/promises";
import nodemailer from "nodemailer";

const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = 465;
const DEFAULT_SMTP_SECURE = true;
const RESEND_API_URL = "https://api.resend.com/emails";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_API_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

let transporterPromise;

const parseBoolean = (value, fallback) => {
  if (value === undefined) {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const normalizeProvider = (value = "") => String(value).trim().toLowerCase().replace(/_/g, "-");

const createConfigError = (message) => {
  const error = new Error(message);
  error.code = "EMAIL_NOT_CONFIGURED";
  return error;
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [String(value).trim()].filter(Boolean);
};

const sanitizeHeaderValue = (value = "") => String(value).replace(/\r?\n/g, " ").trim();

const toBase64Url = (value) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const resolveSmtpConnection = async () => {
  const host = (process.env.SMTP_HOST || DEFAULT_SMTP_HOST).trim();
  const manualIp = (process.env.SMTP_HOST_IP || "").trim();
  const servername = (process.env.SMTP_TLS_SERVERNAME || host).trim();

  if (manualIp) {
    return { host: manualIp, servername };
  }

  try {
    const ipv4Addresses = await dns.resolve4(host);

    if (ipv4Addresses.length > 0) {
      return { host: ipv4Addresses[0], servername };
    }
  } catch (error) {
    console.warn(`SMTP IPv4 lookup failed for ${host}: ${error.message}`);
  }

  return { host, servername };
};

const createTransport = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw createConfigError("EMAIL_USER and EMAIL_PASS are required for SMTP mail delivery");
  }

  const { host, servername } = await resolveSmtpConnection();
  const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT);
  const secure = parseBoolean(process.env.SMTP_SECURE, DEFAULT_SMTP_SECURE);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      servername,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
  });
};

export const getMailTransport = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransport().catch((error) => {
      transporterPromise = undefined;
      throw error;
    });
  }

  return transporterPromise;
};

const resolveMailProvider = () => {
  const configuredProvider = normalizeProvider(process.env.EMAIL_PROVIDER);

  if (configuredProvider === "gmail" || configuredProvider === "gmail-api") {
    return "gmail-api";
  }

  if (configuredProvider === "resend") {
    return "resend";
  }

  if (configuredProvider === "smtp") {
    return "smtp";
  }

  if (configuredProvider) {
    return configuredProvider;
  }

  if (
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  ) {
    return "gmail-api";
  }

  if (process.env.RESEND_API_KEY) {
    return "resend";
  }

  return "smtp";
};

const assertSupportedMailConfiguration = (provider) => {
  if (provider === "smtp" && process.env.RENDER === "true") {
    throw createConfigError(
      "SMTP is blocked on Render. Configure EMAIL_PROVIDER=gmail-api or EMAIL_PROVIDER=resend."
    );
  }

  if (!["smtp", "resend", "gmail-api"].includes(provider)) {
    throw createConfigError(
      `Unsupported EMAIL_PROVIDER "${provider}". Use smtp, resend, or gmail-api.`
    );
  }
};

const shouldRetryMailSend = (error) => {
  if (process.env.SMTP_HOST_IP) {
    return false;
  }

  return ["ESOCKET", "ECONNECTION", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH"].includes(
    error?.code
  );
};

const sendMailWithSmtp = async (mailOptions) => {
  const message = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    ...mailOptions,
  };

  try {
    const transporter = await getMailTransport();
    return await transporter.sendMail(message);
  } catch (error) {
    if (!shouldRetryMailSend(error)) {
      throw error;
    }

    resetMailTransport();
    const transporter = await getMailTransport();
    return transporter.sendMail(message);
  }
};

const sendMailWithResend = async (message) => {
  if (!process.env.RESEND_API_KEY) {
    throw createConfigError("RESEND_API_KEY is required when using Resend");
  }

  const from = process.env.EMAIL_FROM || message.from;

  if (!from) {
    throw createConfigError("EMAIL_FROM is required when using Resend");
  }

  const payload = {
    from,
    to: ensureArray(message.to),
    subject: message.subject,
  };

  if (message.text !== undefined) {
    payload.text = message.text;
  }

  if (message.html !== undefined) {
    payload.html = message.html;
  }

  if (message.cc) {
    payload.cc = ensureArray(message.cc);
  }

  if (message.bcc) {
    payload.bcc = ensureArray(message.bcc);
  }

  const replyTo = process.env.EMAIL_REPLY_TO || message.replyTo;
  if (replyTo) {
    payload.reply_to = replyTo;
  }

  let response;

  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    error.code = "EMAIL_API_ERROR";
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error?.message || `Resend API request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.code = "EMAIL_API_ERROR";
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return {
    messageId: data?.id,
    provider: "resend",
    raw: data,
  };
};

const getRequiredEnv = (key, message) => {
  const value = process.env[key];

  if (!value) {
    throw createConfigError(message || `${key} is required`);
  }

  return value;
};

const exchangeRefreshTokenForAccessToken = async () => {
  const clientId = getRequiredEnv("GMAIL_CLIENT_ID", "GMAIL_CLIENT_ID is required for Gmail API");
  const clientSecret = getRequiredEnv(
    "GMAIL_CLIENT_SECRET",
    "GMAIL_CLIENT_SECRET is required for Gmail API"
  );
  const refreshToken = getRequiredEnv(
    "GMAIL_REFRESH_TOKEN",
    "GMAIL_REFRESH_TOKEN is required for Gmail API"
  );

  let response;

  try {
    response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    error.code = "EMAIL_API_ERROR";
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    const errorMessage =
      data?.error_description ||
      data?.error ||
      `Google OAuth token request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.code = "EMAIL_API_ERROR";
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data.access_token;
};

const buildMimeMessage = (message, fromHeader) => {
  const to = ensureArray(message.to);

  if (to.length === 0) {
    throw createConfigError("A recipient email address is required");
  }

  const cc = ensureArray(message.cc);
  const bcc = ensureArray(message.bcc);
  const replyTo = process.env.EMAIL_REPLY_TO || message.replyTo;
  const subject = sanitizeHeaderValue(message.subject || "(no subject)");
  const headers = [
    `From: ${sanitizeHeaderValue(fromHeader)}`,
    `To: ${to.map(sanitizeHeaderValue).join(", ")}`,
  ];

  if (cc.length > 0) {
    headers.push(`Cc: ${cc.map(sanitizeHeaderValue).join(", ")}`);
  }

  if (bcc.length > 0) {
    headers.push(`Bcc: ${bcc.map(sanitizeHeaderValue).join(", ")}`);
  }

  if (replyTo) {
    headers.push(`Reply-To: ${sanitizeHeaderValue(replyTo)}`);
  }

  headers.push(`Subject: ${subject}`);
  headers.push("MIME-Version: 1.0");

  if (message.html !== undefined && message.text !== undefined) {
    const boundary = `hiremate_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      String(message.text),
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      String(message.html),
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");
  }

  const isHtml = message.html !== undefined;
  const body = isHtml ? String(message.html) : String(message.text || "");

  return [
    ...headers,
    `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset="UTF-8"`,
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
    "",
  ].join("\r\n");
};

const sendMailWithGmailApi = async (message) => {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL || process.env.EMAIL_USER;

  if (!senderEmail) {
    throw createConfigError("GMAIL_SENDER_EMAIL or EMAIL_USER is required for Gmail API");
  }

  const fromHeader = process.env.EMAIL_FROM || message.from || senderEmail;
  const accessToken = await exchangeRefreshTokenForAccessToken();
  const rawMessage = toBase64Url(buildMimeMessage(message, fromHeader));

  let response;

  try {
    response = await fetch(GMAIL_SEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: rawMessage,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    error.code = "EMAIL_API_ERROR";
    throw error;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      data?.error?.message || `Gmail API request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.code = "EMAIL_API_ERROR";
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return {
    messageId: data?.id,
    threadId: data?.threadId,
    provider: "gmail-api",
    raw: data,
  };
};

export const sendMail = async (mailOptions) => {
  const provider = resolveMailProvider();
  assertSupportedMailConfiguration(provider);
  const message = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_SENDER_EMAIL,
    ...mailOptions,
  };

  if (provider === "resend") {
    return sendMailWithResend(message);
  }

  if (provider === "gmail-api") {
    return sendMailWithGmailApi(message);
  }

  return sendMailWithSmtp(message);
};

export const resetMailTransport = () => {
  transporterPromise = undefined;
};
