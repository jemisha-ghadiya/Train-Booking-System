import nodemailer from 'nodemailer';

// Create a transporter using Gmail (or any other SMTP service)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Gmail address
        pass: process.env.EMAIL_APP_PASSWORD  // App password or Gmail password
    }
});

// Function to send OTP email
export const sendOTPEmail = async (email: string, otp: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,  // Sender address
            to: email,  // Recipient address
            subject: 'Profile Update Verification OTP',
            text: `Your OTP for profile update is: ${otp}\nThis OTP will expire in 10 minutes.`
        };

        // Send the email using the transporter
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

// Function to send a simple welcome email
export const sendWelcomeEmail = async (email: string, username: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Train Booking System',
            text: `Hello ${username},\n\nWelcome to our Train Booking System! Your account has been successfully created.\n\nBest regards,\nTrain Booking Team`
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
    }
};
