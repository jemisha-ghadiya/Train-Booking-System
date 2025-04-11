// Import models
const User = require('./user.model').default;
const Train = require('./train.model').default;
const Booking = require('./booking.model').default;
const Admin = require('./admin.model').default;

// Define associations
Booking.belongsTo(Train, { foreignKey: 'trainId' });
Train.hasMany(Booking, { foreignKey: 'trainId' });

Booking.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Booking, { foreignKey: 'userId' });

module.exports = {
  User,
  Train,
  Booking,
  Admin
}; 