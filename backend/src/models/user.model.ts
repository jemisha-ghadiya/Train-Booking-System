import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
    public id!: number;
    public username!: string;
    public email!: string;
    public password!: string;
    public otp!: string | null;  // OTP field
    public otpExpiresAt!: Date | null; 
    public profileImage!: string | null;  // OTP expiration field
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: /^[a-zA-Z0-9_.]+$/, // Alphanumeric, underscore, and dot
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: true, // OTP will be nullable initially
        },
        otpExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true, // OTP expiration time will also be nullable initially
        },
        profileImage: {
            type: DataTypes.STRING,
            allowNull: true, // The profile image will be nullable initially
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
    }
);

export default User;
