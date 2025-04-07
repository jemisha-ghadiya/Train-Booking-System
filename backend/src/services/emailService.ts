import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Or any email service you're using
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Your OTP for Profile Update',
    text: `Your OTP is ${otp}. This OTP is valid for 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};