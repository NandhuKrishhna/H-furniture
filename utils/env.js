const dotenv = require('dotenv');
dotenv.config();

const getEnv = (key, defaultValue) => {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Missing environment variable ${key}`);
    }
    return value;
};

const PORT = getEnv("PORT");
const NODE_ENV = getEnv("NODE_ENV");
const PASSWORD = getEnv("PASSWORD");
const MONGODB_URL = getEnv("MONGODB_URL");
const SESSION_SECRET = getEnv("SESSION_SECRET");
const JWT_SECRET = getEnv("JWT_SECRET");
const ADMIN_SECRET = getEnv("ADMIN_SECRET");
const LOGIN_EXPIRES = getEnv("LOGIN_EXPIRES");
const NODMAILER_PASSWORD = getEnv("NODMAILER_PASSWORD");
const NODMAILER_EMAIL = getEnv("NODMAILER_EMAIL");
const SMTP_HOST = getEnv("SMTP_HOST");
const SMTP_PORT = getEnv("SMTP_PORT");
const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getEnv("GOOGLE_CLIENT_SECRET");
const RAZORPAY_KEY_ID = getEnv("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = getEnv("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = getEnv("RAZORPAY_WEBHOOK_SECRET");
const CALLBACK_URL = getEnv("CALLBACK_URL");
const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET")

module.exports = {
    PORT,
    NODE_ENV,
    PASSWORD,
    MONGODB_URL,
    SESSION_SECRET,
    JWT_SECRET,
    ADMIN_SECRET,
    LOGIN_EXPIRES,
    NODMAILER_PASSWORD,
    NODMAILER_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET,
    CALLBACK_URL,
    JWT_REFRESH_SECRET
};
