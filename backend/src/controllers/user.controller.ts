import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';
import { sendOTPEmail } from '../utils/emailUtils';
// import { sendOTPEmail } from '../services/otpService';
// import multer from 'multer'
// import { sendOTPEmail } from '../services/emailService';
// Email configuration


// Store OTP temporarily (in production, use Redis or a database)
const otpStore = new Map();

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required: username, email, and password'
            });
        }

        // Validate username format (alphanumeric, underscore, and dot)
        if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
            return res.status(400).json({
                message: 'Username can only contain letters, numbers, underscores, and dots'
            });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: 'Invalid email format'
            });
        }

        // Validate password length
        // if (password.length < 6) {
        //     return res.status(400).json({
        //         message: 'Password must be at least 6 characters long'
        //     });
        // }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }


        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Username or email already exists',
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        // Generate JWT token for immediate login
        // const token = jwt.sign(
        //   { 
        //     id: user.id,
        //     username: user.username,
        //     email: user.email 
        //   },
        //   process.env.JWT_SECRET || 'your-secret-key',
        //   { expiresIn: '24h' }
        // );

        // Try to send welcome email
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Welcome to Train Booking System',
                text: `Hello ${username},\n\nWelcome to our Train Booking System! Your account has been successfully created.\n\nBest regards,\nTrain Booking Team`,
            };

            //   await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue with registration even if email fails
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            //   token
        });
    } catch (error: any) {
        console.error('Registration error:', error);

        // Handle specific database errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map((e: any) => e.message)
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Username or email already exists'
            });
        }

        res.status(500).json({
            message: 'Error registering user',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Login user with remember me option
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password, rememberMe } = req.body;

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username || '' },
                    { email: email || '' }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: rememberMe ? '7d' : '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error during login', error });
    }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error during logout', error });
    }
};


// export const updateProfile = async (req: Request, res: Response) => {
//     try {
//         const userId = req.user?.id;
//         const { username, email } = req.body;
//         // const file = req.file;
//         const user = await User.findByPk(userId);
//         if (!user) return res.status(404).json({ message: 'User not found.' });
//         console.log(user, "-------------------------userId=====================");
//         if (username) user.username = username;
//         if (email) user.email = email;
//         // if (file) {
//         //     // Save uploaded file path (already saved by multer)
//         //     user.profileImage = `/uploads/profile/${file.filename}`;
//         // }
//         // console.log(req.file);
//         console.log(user);
//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
//         user.otp = otp;
//         user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes
//         await user.save();
//         await sendOTPEmail(user.email, otp); // Send OTP after saving
//         console.log('Generated OTP:', otp);
//         console.log('Saved to user:', user.otp, user.otpExpiresAt);
//         return res.status(200).json({
//             message: 'Profile updated successfully. OTP sent to confirm.',
//             user: {
//                 id: user.id,
//                 username: user.username,
//                 email: user.email,
//                 profileImage: user.profileImage,
//             },
//         });
//     } catch (error: any) {
//         console.error('Update Profile Error:', error);
//         return res.status(500).json({
//             message: 'Failed to update profile.',
//             error: error.message,
//         });
//     }
// };


export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { username, email } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and expiration date in the user model
        user.otp = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Attempt to save user with the OTP data
        const updatedUser = await user.save(); // Save updated user instance to the database

        // Ensure that the save was successful
        if (!updatedUser) {
            return res.status(500).json({ message: 'Failed to save OTP data to the database' });
        }

        // Send OTP to the user's email (use a utility function to send the email)
        await sendOTPEmail(user.email, otp);

        res.status(200).json({
            message: 'Profile updated successfully',
            email: user.email
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error });
    }
};

// Verify OTP and update profile
export const verifyAndUpdateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { otp, username, email } = req.body;

        // Ensure the user is authenticated
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Retrieve the user from the database
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the OTP exists and is valid
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check if the OTP is expired
        if (user.otpExpiresAt && Date.now() > user.otpExpiresAt.getTime()) {
            user.otp = null;  // Clear expired OTP from the database
            user.otpExpiresAt = null;  // Clear OTP expiration time
            await user.save();
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Update the profile fields after OTP verification
        if (username) user.username = username;
        if (email) user.email = email;

        // Save the updated profile data
        await user.save();

        // Clear OTP after successful verification
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({
            message: 'OTP verified successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,  // Include profile image if needed
            },
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error });
    }
};


// Reset password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({ password: hashedPassword });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password', error });
    }
};

export const getUserData = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findByPk(userId, {
            attributes: ['username', 'email']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User data retrieved successfully',
            user: {
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error retrieving user data:', error);
        res.status(500).json({ message: 'Error retrieving user data', error });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and expiration
        user.otp = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(200).json({
            message: 'Password reset OTP has been sent to your email',
            email: email
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            message: 'Error processing forgot password request',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const resetPasswordWithOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: 'Email, OTP, and new password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify OTP
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check OTP expiration
        if (user.otpExpiresAt && Date.now() > user.otpExpiresAt.getTime()) {
            user.otp = null;
            user.otpExpiresAt = null;
            await user.save();
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            message: 'Error resetting password',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


export const checkAuth = (req: Request, res: Response) => {
    try {
        const token =
            req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(200).json({ authenticated: false });
        }

        const secret = process.env.JWT_SECRET || 'your-secret-key';

        try {
            const decoded = jwt.verify(token, secret) as JwtPayload;
            return res.status(200).json({ authenticated: true });
        } catch (err) {
            return res.status(200).json({ authenticated: false });
        }
    } catch (error) {
        console.error('Auth check error:', error);
        return res.status(200).json({ authenticated: false });
    }
};