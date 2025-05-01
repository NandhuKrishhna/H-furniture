const nodemailer = require("nodemailer");
const catchErrors = require("./catchError")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODMAILER_EMAIL,
        pass: process.env.NODMAILER_PASSWORD,
    },
});


const sendMail = catchErrors(async ({ to, subject, text, html }) => {
    await transporter.sendMail({
        from: "h-furniture@gmail.com",
        to,
        subject,
        text,
        html,
    });
})




const generateOTP = () => (Math.floor(100000 + Math.random() * 900000)).toString();
module.exports = {
    generateOTP,
    sendMail
}