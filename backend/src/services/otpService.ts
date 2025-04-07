import nodemailer from 'nodemailer';
export const sendOTPEmail = async (email: string, otp: string) => {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const mailOptions = {
        from: '"Messaging App" <no-reply@example.com>',
        to: email,
        subject: 'Confirm Your Profile Update',
        html: `
          <h1>Verify Profile Update</h1>
          <p>Your OTP code is: <b>${otp}</b></p>
          <p>This code will expire in 10 minutes.</p>
        `,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log('OTP Email Preview URL:', nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  };