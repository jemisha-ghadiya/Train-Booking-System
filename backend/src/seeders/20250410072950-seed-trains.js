'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('trains', [
      {
        trainNumber: '12001',
        trainName: 'Shatabdi Express',
        source: 'Delhi',
        destination: 'Bhopal',
        departureTime: new Date('2025-04-12T06:00:00Z'),
        arrivalTime: new Date('2025-04-12T12:30:00Z'),
        totalSeats: 200,
        availableSeats: 200,
        fare: 850.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trainNumber: '12951',
        trainName: 'Rajdhani Express',
        source: 'Mumbai',
        destination: 'Delhi',
        departureTime: new Date('2025-04-12T16:00:00Z'),
        arrivalTime: new Date('2025-04-13T08:00:00Z'),
        totalSeats: 300,
        availableSeats: 300,
        fare: 1450.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trainNumber: '12627',
        trainName: 'Karnataka Express',
        source: 'Bangalore',
        destination: 'Delhi',
        departureTime: new Date('2025-04-13T07:20:00Z'),
        arrivalTime: new Date('2025-04-14T12:10:00Z'),
        totalSeats: 250,
        availableSeats: 250,
        fare: 1750.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trainNumber: '11061',
        trainName: 'Pawan Express',
        source: 'Mumbai',
        destination: 'Darbhanga',
        departureTime: new Date('2025-04-13T11:00:00Z'),
        arrivalTime: new Date('2025-04-14T20:00:00Z'),
        totalSeats: 180,
        availableSeats: 180,
        fare: 1300.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trainNumber: '12559',
        trainName: 'Shiv Ganga Express',
        source: 'Varanasi',
        destination: 'Delhi',
        departureTime: new Date('2025-04-14T19:00:00Z'),
        arrivalTime: new Date('2025-04-15T05:00:00Z'),
        totalSeats: 220,
        availableSeats: 220,
        fare: 900.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trainNumber: '12615',
        trainName: 'Grand Trunk Express',
        source: 'Chennai',
        destination: 'Delhi',
        departureTime: new Date('2025-04-15T18:00:00Z'),
        arrivalTime: new Date('2025-04-17T07:30:00Z'),
        totalSeats: 270,
        availableSeats: 270,
        fare: 1850.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        trainNumber: '12487',
        trainName: 'Seemanchal Express',
        source: 'Jogbani',
        destination: 'Delhi',
        departureTime: new Date('2025-04-16T08:30:00Z'),
        arrivalTime: new Date('2025-04-17T04:15:00Z'),
        totalSeats: 160,
        availableSeats: 160,
        fare: 1100.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('trains', null, {});
  }
};
