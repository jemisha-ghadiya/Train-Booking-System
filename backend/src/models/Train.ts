import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Train extends Model {
  public id!: number;
  public trainNumber!: string;
  public name!: string;
  public source!: string;
  public destination!: string;
  public departureTime!: Date;
  public arrivalTime!: Date;
  public totalSeats!: number;
  public availableSeats!: number;
  public fare!: number;
}

Train.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    trainNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    arrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Train',
    tableName: 'trains',
  }
);

export default Train; 