const getVerifyEmailTemplates = (otp, name) => ({
  subject: "Verify Your Email Address",
  text: `Hi ${name}, 
  
  Thank you for signing up with us! Please use the following OTP to verify your email address:
  
  OTP: ${otp}
  
  If you didn’t sign up for this account, you can safely ignore this email.
  
  Best regards,
  The FitSphere Team`,
  html: `
    <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
        <style>
    @import url('https://fonts.cdnfonts.com/css/satoshi');

    body {
      font-family: 'Satoshi', sans-serif;
    }
  </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table role="presentation" style="width: 100%; max-width: 400px; border-collapse: collapse; background-color: #E6E6FA; border-radius: 20px; overflow: hidden;">
            <tr>
              <td align="center" style="padding: 30px 20px;">
                <!-- Check Icon -->
                <div style="background-color: #4CAF50; width: 50px; height: 50px; border-radius: 25px; margin-bottom: 20px; display: inline-flex; align-items: center; justify-content: center;">
                  <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OPH6ohG3iFN25adc4J8ff5TXQELYtc.png" alt="Success" style="width: 30px; height: 30px;">
                </div>
  
                <!-- Title -->
                <h1 style="color: #000; font-size: 20px; margin: 0 0 20px 0;">
                  ✨ Verify Your Email Address! ✨
                </h1>
  
                <!-- OTP Box -->
                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                  <span style="font-size: 36px; font-weight: bold; color: #4a4a4a; letter-spacing: 5px;">${otp}</span>
                </div>
  
                <!-- Main Content Box -->
                <div style="background-color: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin: 0 10px;">
                  <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                    Thank you for signing up with us, ${name}! Please use the OTP above to verify your email address.
                  </p>
                  <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                    This OTP will expire in 10 minutes. Do not share this code with anyone.
                  </p>
                  <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0;">
                    If you didn’t sign up for this account, you can safely ignore this email.
                  </p>
                </div>
  
                <!-- Footer Logo -->
                <div style="margin-top: 30px;">
                  <span style="color: #4169E1; font-size: 20px; font-weight: bold;">FitSphere</span>
                  <span style="color: #4CAF50; font-size: 20px;">●</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
    `,
});


const getResetPasswordEmailTemplates = (otp, name) => ({
  subject: "Reset Your Password",
  text: `Hi ${name}, 
    
  We received a request to reset your password. Please use the following OTP to reset your password:
  
  OTP: ${otp}
  
  If you didn’t request this, you can safely ignore this email.
  
  Best regards,  
  The FitSphere Team`,
  html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
      </head>
       <style>
    @import url('https://fonts.cdnfonts.com/css/satoshi');

    body {
      font-family: 'Satoshi', sans-serif;
    }
  </style>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                  <td align="center" style="padding: 40px 0;">
                      <table role="presentation" style="width: 100%; max-width: 400px; border-collapse: collapse; background-color: #E6E6FA; border-radius: 20px; overflow: hidden;">
                          <tr>
                              <td align="center" style="padding: 30px 20px;">
                                  <!-- Check Icon -->
                                  <div style="background-color: #4CAF50; width: 50px; height: 50px; border-radius: 25px; margin-bottom: 20px; display: inline-flex; align-items: center; justify-content: center;">
                                      <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OPH6ohG3iFN25adc4J8ff5TXQELYtc.png" alt="Reset" style="width: 30px; height: 30px;">
                                  </div>
  
                                  <!-- Title -->
                                  <h1 style="color: #000; font-size: 24px; margin: 0 0 20px 0;">
                                      🔒 Reset Your Password
                                  </h1>
  
                                  <!-- OTP Box -->
                                  <div style="background-color: #f0f0f0; border-radius: 4px; padding: 20px; margin-bottom: 20px;">
                                      <span style="font-size: 36px; font-weight: bold; color: #4a4a4a; letter-spacing: 5px;">${otp}</span>
                                  </div>
  
                                  <!-- Main Content Box -->
                                  <div style="background-color: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin: 0 10px;">
                                      <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                                          We received a request to reset your password. Use the OTP above to complete the process.
                                      </p>
                                      <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                                          This OTP will expire in 10 minutes. Do not share this code with anyone.
                                      </p>
                                      <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                                          If you didn’t request a password reset, please ignore this email or contact our support team at<br>
                                          <a href="mailto:fitSpheresupport@gmail.com" style="color: #4169E1; text-decoration: none;">fitSpheresupport@gmail.com</a>
                                      </p>
                                      <p style="color: #000; font-size: 14px; line-height: 1.6; margin: 0;">
                                          Thank you for being a part of <span style="color: #4169E1; font-weight: bold;">FitSphere</span>.
                                      </p>
                                  </div>
  
                                  <!-- Footer Logo -->
                                  <div style="margin-top: 30px;">
                                      <span style="color: #4169E1; font-size: 20px; font-weight: bold;">FitSphere</span>
                                      <span style="color: #4CAF50; font-size: 20px;">●</span>
                                  </div>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
      </body>
      </html>
    `,
});

const getApprovalEmailTemplate = () => ({
  subject: "Account Approved - Welcome to FitSphere!",
  text: `Hi,

Great news! Your registration has been approved.

You can now log in to your FitSphere account and start enjoying our services.

If you have any questions, feel free to reach out to our support team.

Best regards,  
The FitSphere Team`,
  html: `
     <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 400px; border-collapse: collapse; background-color: #E6E6FA; border-radius: 20px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 30px 20px;">
                            <div style="background-color: #4CAF50; width: 50px; height: 50px; border-radius: 25px; margin-bottom: 20px; display: inline-flex; align-items: center; justify-content: center;">
                                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OPH6ohG3iFN25adc4J8ff5TXQELYtc.png" alt="Success" style="width: 30px; height: 30px;">
                            </div>
                            <h1 style="color: #000; font-size: 24px; margin: 0 0 20px 0;">
                                🎉 Congratulations! Your Account is Approved 🎉
                            </h1>
                            <div style="background-color: #90EE90; color: #000; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-bottom: 20px;">
                                <span style="font-size: 14px;">You can now log in and start using FitSphere.</span>
                            </div>
                            <div style="background-color: rgba(255, 255, 255, 0.9); padding: 25px; border-radius: 15px; margin: 0 10px;">
                                <p style="color: #000; font-size: 14px; line-height: 1.6;">
                                    Your account has been successfully verified and approved.
                                </p>
                                <p style="color: #000; font-size: 14px; line-height: 1.6;">
                                    You can now log in to your dashboard and start exploring FitSphere's features.
                                </p>
                                <p style="color: #000; font-size: 14px; line-height: 1.6;">
                                    If you have any questions, feel free to reach out to us at  
                                    <a href="mailto:fitSpheresupport@gmail.com" style="color: #4169E1; text-decoration: none;">fitSpheresupport@gmail.com</a>
                                </p>
                                <p style="color: #000; font-size: 14px; line-height: 1.6;">
                                    Welcome aboard! 🎉
                                </p>
                            </div>
                            <div style="margin-top: 30px;">
                                <span style="color: #4169E1; font-size: 20px; font-weight: bold;">FitSphere</span>
                                <span style="color: #4CAF50; font-size: 20px;">●</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
});

module.exports = {
  getVerifyEmailTemplates
}