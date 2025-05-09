const z = require("zod");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nameSchema = z.string().min(3, { message: "Name must be at least 3 characters long" });

const emailSchema = z
    .string()
    .regex(emailRegex, { message: "Invalid email format" });

const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters long" });

const confirmPasswordSchema = z.string().min(6, { message: "Confirm password is required" });

const userAgentSchema = z.string().optional();

// Register schema
const userRegisterSchema = z
    .object({
        fname: nameSchema,
        lname: nameSchema,
        email: emailSchema,
        password: passwordSchema
    })
// Login schema
const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: userAgentSchema,
});

// Verification code schema
const verificationCodeSchema = z.string().min(1).max(24);

// Reset password schema
const resetPasswordSchema = z.object({
    password: passwordSchema,
});

// OTP verification schema
const otpVerificationSchema = z.object({
    code: z.string().min(6, {
        message: "OTP must be at least 6 characters long",
    }),
});

module.exports = {
    emailSchema,
    passwordSchema,
    confirmPasswordSchema,
    userAgentSchema,
    userRegisterSchema,
    loginSchema,
    verificationCodeSchema,
    resetPasswordSchema,
    otpVerificationSchema,
};
