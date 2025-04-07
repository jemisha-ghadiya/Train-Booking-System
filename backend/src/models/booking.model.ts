import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Train from './train.model';

class Booking extends Model {
  public id!: number;
  public trainId!: number;
  public userId!: number;
  public passengerName!: string;
  public passengerAge!: number;
  public seatNumber!: string;
  public bookingDate!: Date;
  public status!: 'confirmed' | 'cancelled';
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    trainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Train,
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    passengerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passengerAge: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seatNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'confirmed',
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
  }
);

// Define associations
Booking.belongsTo(Train, { foreignKey: 'trainId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

export default Booking; 