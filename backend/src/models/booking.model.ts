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
  public class!: string; // New field
  public bookingDate!: Date;
  public status!: 'confirmed' | 'cancelled';
  
  // Add association properties
  public Train?: Train;
  public User?: User;
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
    class: {
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
Booking.belongsTo(Train, { foreignKey: 'trainId', as: 'Train' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Train.hasMany(Booking, { foreignKey: 'trainId' });
User.hasMany(Booking, { foreignKey: 'userId' });

export default Booking; 