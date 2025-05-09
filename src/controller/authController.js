const { userCollection } = require("../models/UserModels");
const { sendOtp } = require("../utils/helpers");
const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("../utils/http");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
module.exports = {
    //@desc : Getting the user sign-up Page.
    getUserSignup: (req, res, next) => {
        res.status(OK).render("user/user_signup", {
            errors: null,
            userSignUp: true,

        });
    },

    //@desc : User-Sign Handler
    userRegistration: async (req, res, next) => {
        const data = {
            firstName: req.body.fname,
            lastName: req.body.lname,
            email: req.body.email,
            password: await bcrypt.hash(req.body.password, 10),
            phone: req.body.phone,
        };

        try {
            const existuser = await userCollection.findOne({ email: data.email });
            if (existuser) {
                return res.status(BAD_REQUEST).json({
                    errors: { email: { msg: "User Already Exist" } },
                    userSignUp: true
                });
            } else {
                req.session.userdata = data;
                sendOtp(req.body.email, req.body.email)
                    .then((msg) => {
                        res.status(OK).json({ success: true });
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(INTERNAL_SERVER_ERROR).json({
                            customError: 'Failed to send OTP. Please try again later.',
                            userSignUp: true

                        });
                    });
            }
        } catch (err) {
            next(err);
        }
    },
    //getting user otp
    getsubmitSignupotp: async (req, res, next) => {
        console.log("Inserting data:", req.session.userdata);
        const userEmail = req.session.userdata?.email;
        console.log(userEmail);
        res.status(200).render("user/otp_submit", {
            userOtpSubmit: true,
            userEmail,

        }
        );
    },

    submitSignupotp: async (req, res, next) => {
        try {
            if (!req.session.userdata || !req.session.userdata.email) {
                return res.status(400).json({
                    errors: { email: { msg: "Email is required" } },
                    userOtpSubmit: true
                });
            }
            const isOtp = await Otpdb.otpCollection.findOne({
                otpId: req.session.userdata.email,
            });

            const time = Date.now();
            if (!isOtp) {
                return res.status(400).json({
                    errors: { otp: { msg: "OTP record not found" } },
                    userOtpSubmit: true
                });
            }

            console.log('OTP from request:', req.body.otp);
            console.log('OTP in DB:', isOtp.otp);
            console.log('OTP expiry time:', isOtp.expireAt);

            if (parseInt(req.body.otp) === isOtp.otp) {
                if (isOtp.expireAt >= time) {
                    const userInserted = await Userdb.userCollection.create(req.session.userdata);
                    console.log(userInserted._id, "<<<<<<>>>>>>");
                    if (userInserted) {
                        //----------create a wallet-----------
                        await Walletdb.walletCollection.create({ userId: userInserted._id, balance: 0 });
                        const token = jwt.sign({ _id: userInserted._id }, process.env.JWT_SECRET);
                        res.cookie("token", token, { httpOnly: true });
                        return res.status(200).json({
                            success: "success",
                            redirect: "/"
                        });

                    }
                } else {
                    return res.status(400).json({
                        errors: { otp: { msg: "OTP Expired" } },
                        userOtpSubmit: true
                    });
                }
            } else {
                return res.status(400).json({
                    errors: { otp: { msg: "Invalid OTP" } },
                    userOtpSubmit: true
                });
            }
        } catch (err) {
            console.log(err);
            next(err);
        }
    },

    //resend signup otp
    resendSignUpOtp: async (req, res, next) => {
        try {
            console.log("Session userdata:", req.session.userdata);
            console.log("User email:", req.session.userdata?.email);

            if (!req.session.userdata || !req.session.userdata.email) {
                return res.status(400).json({
                    customError: 'Email not found in session', success: false
                });
            }

            const data = await resendOtp(req.session.userdata.email, req.session.userdata.email);
            console.log("OTP resent to email:", req.session.userdata.email);
            console.log(data);
            if (data.success === undefined) {
                data.success = true;

            }
            res.status(200).json(data);
        } catch (error) {
            console.error("Error in resendSignUpOtp:", error);
            res.status(500).json({
                customError: 'Failed to resend OTP. Please try again later.',
                success: false
            });
        }
    },

    //get user Login
    getUserLogin: (req, res, next) => {
        try {
            const isBlocked = req.query.blocked === "true";

            if (req.cookies.token) {
                const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
                if (user) {
                    return res.redirect("/");
                }
            } else {
                req.session.destroy();
                return res.status(200).render("user/login", {
                    errors: null,
                    userLogin: true,
                    blocked: isBlocked
                });
            }
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    // user signin
    userSignin: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const existUser = await Userdb.userCollection.findOne({ email }).lean();
            if (!existUser) {
                return res.status(400).json({
                    errors: { email: { msg: "User not found" } },
                    userLogin: true
                });
            }
            if (!existUser.password) {
                return res.status(400).json({
                    errors: { email: { msg: "Signed in with Google" } },
                    userLogin: true
                });
            }
            const isMatch = await bcrypt.compare(password, existUser.password);
            if (!isMatch) {
                return res.status(400).json({
                    errors: { email: { msg: "Incorrect email or password" } },
                    userLogin: true
                });
            }

            if (existUser.isBlocked) {
                return res.status(400).json({
                    errors: { email: { msg: "User is blocked" } },
                    userLogin: true
                });
            }
            const token = jwt.sign({ _id: existUser._id }, process.env.JWT_SECRET);

            res.cookie("token", token, {
                httpOnly: true,
                sameSite: "Strict",
            });

            res.json({
                message: ' Login successful',
                success: true
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                customError: "Internal server error",
                userLogin: true
            });
        }
    },

    // getting forgot password email submit
    enterForgotEmail: async (req, res, next) => {
        res.status(200).render("user/forgot_password",

        );
    },
    // submitting forgot password email
    submitEmailForOtp: async (req, res, next) => {
        console.log("This is from submitEmail: " + req.body.Email);
        const { Email } = req.body;


        if (!Email) {
            return res.status(400).json({ errors: { email: { msg: "Email is required" } } });
        }
        try {


            const userExist = await Userdb.userCollection.findOne({ email: req.body.Email }).lean();
            if (!userExist) {
                return res.status(400).json({ errors: { email: { msg: "User not found" } } });
            } else {
                try {
                    await sendOtp(req.body.Email, userExist._id);

                    req.session.forgotUser = userExist._id;
                    req.session.forgotUserEmail = req.body.Email;
                    console.log("this is from req.body" + req.session.forgotUserEmail);
                    console.log("this is the id of the user" + req.session.forgotUser);

                    return res.json({
                        message: "OTP sent. Redirecting to OTP page.", redirectUrl: "/user/forgot_otp",
                        success: true,
                    });
                } catch (otpError) {
                    console.log('Error sending OTP:', otpError);
                    return res.status(500).json({ errors: { customError: "Failed to send OTP. Please try again." } });
                }
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    },

    // getting enter forgot email otp
    getEnterForgotOtp: async (req, res, next) => {
        res.status(200).render("user/forgot_otp", {
            email: req.session.forgotUserEmail
        },
            console.log("this is from getEnterForgotOtp" + req.session.forgotUserEmail)
        );
    },

    submitForgetOtp: async (req, res, next) => {
        console.log('Session forgetUser:', req.session.forgotUser);
        console.log('Entered OTP:', req.body.Otp);

        try {
            // Check if forgetUser session exists
            if (!req.session.forgotUser) {
                return res.status(400).json({
                    customError: `Session expired. Please try again.`,
                });
            }

            // Find user from database
            const user = await Userdb.userCollection.findById(req.session.forgotUser).lean();

            // Check if user exists and has email property
            if (!user || !user.email) {
                return res.status(400).json({
                    errors: { otp: { msg: "User not found or invalid email" } }
                });
            }

            // Proceed with OTP validation
            const otpInfo = await Otpdb.otpCollection.findOne({ otpId: req.session.forgotUser });
            if (!otpInfo) {
                return res.status(400).json({
                    errors: { otp: { msg: "Invalid OTP" } }
                });
            }

            // Convert OTP values to strings for comparison
            const enteredOtp = String(req.body.Otp).trim();
            const storedOtp = String(otpInfo.otp).trim();

            console.log("Entered OTP:", enteredOtp);
            console.log("Stored OTP:", storedOtp);

            // Validate OTP
            if (storedOtp === enteredOtp) {
                if (otpInfo.expireAt >= Date.now()) {
                    return res.json({ redirect: "/user/change_password" });
                } else {
                    return res.status(400).json({
                        errors: { otp: { msg: "OTP Expired" } }
                    });
                }
            } else {
                return res.status(400).json({
                    errors: { otp: { msg: "Invalid OTP" } }
                });
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    },

    resendForgortPass: async (req, res, next) => {
        try {
            // Debugging information
            console.log("Session Forgot User Email:", req.session.forgotUserEmail);
            // Resend OTP
            const data = await resendOtp(req.session.forgotUserEmail, req.session.forgotUser);

            // Log OTP resend information
            console.log("OTP resent to email:", req.session.forgotUserEmail);
            console.log(data);

            // Ensure success property exists
            if (data.success === undefined) {
                data.success = true;
            }

            // Respond with success data
            res.status(200).json(data);
        } catch (error) {
            // Log and handle errors
            console.error("Error in resendForgortPass:", error);
            res.status(500).json({
                customError: 'Failed to resend OTP. Please try again later.',
                success: false
            });
        }
    },

    //change password
    getChangePassword: async (req, res, next) => {

        res.status(200).render("user/changepassword", {
            changePassword: true
        })
    },

    changePassword: async (req, res, next) => {
        try {
            if (req.session.forgotUserEmail) {
                const user = await Userdb.userCollection.findOne({ email: req.session.forgotUserEmail });
                if (!user) {
                    return res.status(400).json({ customError: 'User not found' });
                }

                const newPassword = await bcrypt.hash(req.body.newPassword, 10);
                const updatedUser = await Userdb.userCollection.updateOne(
                    { email: req.session.forgotUserEmail },
                    { $set: { password: newPassword } }
                );

                if (updatedUser.modifiedCount > 0) {
                    res.status(200).json({ redirectUrl: '/user/login' });
                } else {
                    res.status(400).json({ customError: 'Failed to update password' });
                }
            } else {
                res.status(400).json({ customError: 'Timeout, please try again' });
            }
        } catch (error) {
            console.error('Error in changePassword:', error);
            res.status(500).json({ customError: 'An error occurred. Please try again later.' });
        }
    },

    userLogout: (req, res, next) => {
        res.clearCookie("token");
        res.json({ success: true });
    },



}