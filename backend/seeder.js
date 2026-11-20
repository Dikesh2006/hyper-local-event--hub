const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Movie = require('./src/models/Movie');
const Event = require('./src/models/Event');
const Hall = require('./src/models/Hall');
const Manager = require('./src/models/Manager');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Movie.deleteMany();
    await Event.deleteMany();
    await Hall.deleteMany();
    await Manager.deleteMany();

    const admin = await User.create({
      name: 'Admin Hub',
      email: 'admin@hyperlocal.com',
      password: 'admin123',
      role: 'admin',
    });

    await Movie.create([
      { title: 'City Lights', description: 'A premium blockbuster movie experience.', genre: 'Drama', duration: 130, language: 'English', posterUrl: '', showtimes: [{ time: '11:00 AM', price: 250, availableSeats: 80 }, { time: '7:00 PM', price: 350, availableSeats: 60 }], city: 'Mumbai' },
      { title: 'Night Riders', description: 'High energy action film for local audiences.', genre: 'Action', duration: 145, language: 'Hindi', posterUrl: '', showtimes: [{ time: '2:00 PM', price: 280, availableSeats: 90 }, { time: '9:00 PM', price: 380, availableSeats: 50 }], city: 'Delhi' },
    ]);

    await Event.create([
      { title: 'Sunset Concert', description: 'Live music with top city performers.', category: 'concert', city: 'Mumbai', venue: 'City Arena', startDate: new Date(Date.now() + 86400000), ticketPrice: 699, imageUrl: '' },
      { title: 'Stand-up Night', description: 'Laugh out loud with local comedians.', category: 'comedy', city: 'Bangalore', venue: 'Laughter Lounge', startDate: new Date(Date.now() + 172800000), ticketPrice: 499, imageUrl: '' },
    ]);

    await Hall.create([
      { name: 'Grand Ballroom', city: 'Mumbai', address: 'Fort Road, South Mumbai', capacity: 300, hourlyRate: 4200, images: [], availability: [], description: 'Premium hall for weddings and corporate events.', owner: admin._id },
      { name: 'Skyline Hall', city: 'Delhi', address: 'Center Street, New Delhi', capacity: 200, hourlyRate: 3200, images: [], availability: [], description: 'Modern venue with audio-visual support.', owner: admin._id },
    ]);

    await Manager.create([
      { name: 'Riya Sharma', city: 'Mumbai', expertise: 'Concerts & Festivals', pricePerEvent: 15000, imageUrl: '', bio: 'Seasoned event manager with strong local vendor ties.', contact: '+91 98765 43210' },
      { name: 'Karan Mehta', city: 'Delhi', expertise: 'Corporate & Weddings', pricePerEvent: 18000, imageUrl: '', bio: 'Reliable full-service planner for premium gatherings.', contact: '+91 91234 56789' },
    ]);

    console.log('Social events seed completed');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
