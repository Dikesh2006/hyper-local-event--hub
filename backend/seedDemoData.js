const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Movie = require('./src/models/Movie');
const Theatre = require('./src/models/Theatre');
const Event = require('./src/models/Event');
const Hall = require('./src/models/Hall');
const Manager = require('./src/models/Manager');

dotenv.config();

// Helper to find or create record idempotently
const findOrCreate = async (Model, query, data) => {
  let doc = await Model.findOne(query);
  if (!doc) {
    doc = await Model.create(data);
    return { doc, created: true };
  }
  return { doc, created: false };
};

const seedDemoData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB. Starting safe demo data seeding (non-destructive)...\n');

    // ==========================================
    // 1. DEMO USERS & ROLES (TASK 5)
    // ==========================================
    console.log('--- 1. Seeding Demo Users & Roles ---');
    const demoUsers = [
      {
        name: 'Super Admin',
        email: 'admin@hyperlocal.com',
        password: 'AdminPassword@2026',
        role: 'admin',
        city: 'Bhopal',
        phone: '+91 98930 11223',
        status: 'approved',
      },
      {
        name: 'Rajesh Verma (CineMax Manager)',
        email: 'theatre.admin@bhopalcinema.com',
        password: 'TheatreAdmin@2026',
        role: 'theatreOwner',
        city: 'Bhopal',
        phone: '+91 98260 44556',
        status: 'approved',
      },
      {
        name: 'Pooja Saxena (Bhopal Events)',
        email: 'organizer@bhopalevents.com',
        password: 'OrganizerPass@2026',
        role: 'organizer',
        city: 'Bhopal',
        phone: '+91 94250 77889',
        status: 'approved',
      },
      {
        name: 'Vikram Singh (Palace Venues)',
        email: 'hallowner@bhopalvenues.com',
        password: 'HallOwnerPass@2026',
        role: 'hallOwner',
        city: 'Bhopal',
        phone: '+91 98931 99001',
        status: 'approved',
      },
      {
        name: 'Aman Sharma (College Student)',
        email: 'student.demo@bhopal.edu',
        password: 'StudentDemo@2026',
        role: 'user',
        city: 'Bhopal',
        phone: '+91 97555 33445',
        status: 'approved',
      },
    ];

    const usersMap = {};
    for (const u of demoUsers) {
      const { doc, created } = await findOrCreate(User, { email: u.email.toLowerCase() }, u);
      usersMap[u.role] = doc;
      console.log(`  ${created ? '✓ Created' : '• Exists'}: [${doc.role}] ${doc.name} (${doc.email})`);
    }

    const adminUser = usersMap.admin || (await User.findOne({ role: 'admin' }));
    const theatreOwner = usersMap.theatreOwner || adminUser;
    const eventOrganizer = usersMap.organizer || adminUser;
    const hallOwner = usersMap.hallOwner || adminUser;

    // ==========================================
    // 2. DEMO THEATERS IN BHOPAL (TASK 2)
    // ==========================================
    console.log('\n--- 2. Seeding Demo Theaters in Bhopal ---');
    const demoTheaters = [
      {
        name: 'CineMax Bhopal',
        city: 'Bhopal',
        address: 'DB City Mall, Zone-I, Maharana Pratap Nagar, Bhopal, MP 462011',
        owner: theatreOwner._id,
        rating: 4.8,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop',
        description: 'Premier multiplex in MP Nagar featuring 4K Dolby Atmos, ultra-luxurious recliners, and gourmet snacks. [Sample Demonstration Theater]',
        amenities: ['4K Dolby Atmos', 'VIP Recliner Loungers', 'Food Court', 'Valet Parking', 'Wheelchair Accessible'],
        screens: [
          {
            name: 'Screen 1 (Dolby Atmos 4K)',
            capacity: 80,
            rows: 8,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 350, rows: ['A', 'B'] },
              { name: 'Standard Gold', price: 250, rows: ['C', 'D', 'E', 'F', 'G', 'H'] },
            ],
          },
          {
            name: 'Screen 2 (RGB Laser Audi)',
            capacity: 80,
            rows: 8,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 380, rows: ['A', 'B'] },
              { name: 'Standard', price: 260, rows: ['C', 'D', 'E', 'F', 'G', 'H'] },
            ],
          },
        ],
      },
      {
        name: 'City Pride Cinema',
        city: 'Bhopal',
        address: 'Aashima Anupama Mall, Hoshangabad Road, Danakheda, Bhopal, MP 462026',
        owner: theatreOwner._id,
        rating: 4.6,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop',
        description: 'Popular family multiplex on Hoshangabad road with laser projection, acoustic seating, and expansive lobby. [Sample Demonstration Theater]',
        amenities: ['Laser Projection', 'Pushback Plush Seats', 'Snack Bar', 'Multi-level Parking', 'Online Ticket Kiosks'],
        screens: [
          {
            name: 'Screen 1 (Laser Prime)',
            capacity: 80,
            rows: 8,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 340, rows: ['A', 'B'] },
              { name: 'Executive', price: 240, rows: ['C', 'D', 'E', 'F', 'G', 'H'] },
            ],
          },
        ],
      },
      {
        name: 'Lake View Cinemas',
        city: 'Bhopal',
        address: 'VIP Road, Near Upper Lake Promenade, Kohefiza, Bhopal, MP 462001',
        owner: theatreOwner._id,
        rating: 4.9,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop',
        description: 'Boutique lakeside cinema offering picturesque sunset views of Bhopal Upper Lake before and after screenings. [Sample Demonstration Theater]',
        amenities: ['Lakeside Promenade Cafe', 'Dolby 7.1 Surround', 'Plush Loungers', 'Lake-view Rooftop Lounge'],
        screens: [
          {
            name: 'Screen 1 (Lakeside Dolby 7.1)',
            capacity: 80,
            rows: 8,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 380, rows: ['A', 'B'] },
              { name: 'Premium View', price: 280, rows: ['C', 'D', 'E', 'F', 'G', 'H'] },
            ],
          },
        ],
      },
      {
        name: 'MP Nagar Multiplex',
        city: 'Bhopal',
        address: 'Zone-II, Near Sargam Talkies Circle, MP Nagar, Bhopal, MP 462011',
        owner: theatreOwner._id,
        rating: 4.5,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=600&auto=format&fit=crop',
        description: 'Centrally located entertainment destination in the student and coaching hub of Bhopal. [Sample Demonstration Theater]',
        amenities: ['RGB Laser 3D', 'Acoustic Soundproofing', 'Digital Ticketing', 'Student Discount Counter'],
        screens: [
          {
            name: 'Screen 1 (Prime 3D)',
            capacity: 80,
            rows: 8,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 300, rows: ['A', 'B'] },
              { name: 'Standard', price: 200, rows: ['C', 'D', 'E', 'F', 'G', 'H'] },
            ],
          },
        ],
      },
    ];

    const theatresMap = {};
    for (const t of demoTheaters) {
      const { doc, created } = await findOrCreate(Theatre, { name: t.name, city: 'Bhopal' }, t);
      theatresMap[t.name] = doc;
      console.log(`  ${created ? '✓ Created' : '• Exists'}: ${doc.name} (${doc.screens?.length} screens in ${doc.city})`);
    }

    // ==========================================
    // 3. DEMO HALLS & VENUES IN BHOPAL (TASK 2)
    // ==========================================
    console.log('\n--- 3. Seeding Demo Halls in Bhopal ---');
    const demoHalls = [
      {
        name: 'Bhopal Heritage Palace Hall',
        city: 'Bhopal',
        address: 'VIP Road, Overlooking Upper Lake, Bhopal, MP 462001',
        capacity: 500,
        hourlyRate: 5500,
        pricePerNight: 45000,
        rating: 4.9,
        type: 'venue',
        owner: hallOwner._id,
        published: true,
        approved: true,
        featured: true,
        images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop'],
        description: 'Majestic heritage banquet palace with lakeside lawns, chandelier ballrooms, and royal Rajasthani architecture for weddings and galas.',
        amenities: ['Lakeside Lawn', 'Grand Chandelier Ballroom', 'Central AC', 'Valet Parking for 200 cars', 'In-house Catering'],
      },
      {
        name: 'Lakeview Banquet & Convention Center',
        city: 'Bhopal',
        address: 'Shamla Hills, Near VIP Circuit House, Bhopal, MP 462013',
        capacity: 350,
        hourlyRate: 4200,
        pricePerNight: 35000,
        rating: 4.8,
        type: 'hotel',
        owner: hallOwner._id,
        published: true,
        approved: true,
        featured: true,
        images: ['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop'],
        description: 'Modern hill-top convention venue overlooking Bhojtal lake, equipped with state-of-the-art AV projection for corporate summits and celebrations.',
        amenities: ['Panoramic Lake View', 'Stage Lighting & AV System', 'Bridal Suites', 'Buffet Dining Hall', 'Wi-Fi & Audio Setup'],
      },
      {
        name: 'Bhojpur Royal Grand Hall',
        city: 'Bhopal',
        address: 'Hoshangabad Road, Near Mandideep Industrial Hub, Bhopal, MP 462047',
        capacity: 400,
        hourlyRate: 4800,
        pricePerNight: 38000,
        rating: 4.7,
        type: 'venue',
        owner: hallOwner._id,
        published: true,
        approved: true,
        featured: false,
        images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&auto=format&fit=crop'],
        description: 'Spacious air-conditioned multi-purpose banquet hall ideal for college convocations, grand receptions, and cultural expos.',
        amenities: ['Spacious Stage', 'Green Rooms', 'Covered Parking', 'Power Backup', 'Round Tables Setup'],
      },
    ];

    for (const h of demoHalls) {
      const { doc, created } = await findOrCreate(Hall, { name: h.name, city: 'Bhopal' }, h);
      console.log(`  ${created ? '✓ Created' : '• Exists'}: ${doc.name} (Capacity: ${doc.capacity}, Rate: ₹${doc.hourlyRate}/hr)`);
    }

    // ==========================================
    // 4. DEMO MOVIES & SHOWS (TASK 1 & TASK 3)
    // ==========================================
    console.log('\n--- 4. Seeding Demo Movies & Shows (Linked to Theaters in Bhopal) ---');

    // Future dates relative to dynamic current date
    const today = new Date();
    const futureDate1 = new Date(today.getTime() + 86400000 * 1);
    const futureDate2 = new Date(today.getTime() + 86400000 * 2);
    const futureDate3 = new Date(today.getTime() + 86400000 * 3);

    const cinemax = theatresMap['CineMax Bhopal'] || Object.values(theatresMap)[0];
    const cityPride = theatresMap['City Pride Cinema'] || Object.values(theatresMap)[0];
    const lakeView = theatresMap['Lake View Cinemas'] || Object.values(theatresMap)[0];
    const mpNagar = theatresMap['MP Nagar Multiplex'] || Object.values(theatresMap)[0];

    const demoMovies = [
      {
        title: 'Oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genre: 'Biography / Drama / History',
        duration: 180,
        language: 'English',
        posterUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2023-07-21'),
        city: 'Bhopal',
        theatreName: cinemax.name,
        theatre: cinemax._id,
        owner: theatreOwner._id,
        rating: 4.9,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '10:30 AM',
            price: 250,
            availableSeats: 78,
            screen: 'Screen 1 (Dolby Atmos 4K)',
            date: futureDate1,
            theatreId: cinemax._id,
            theatreName: cinemax.name,
            bookedSeats: ['A3', 'A4'],
          },
          {
            time: '02:45 PM',
            price: 320,
            availableSeats: 80,
            screen: 'Screen 1 (Dolby Atmos 4K)',
            date: futureDate1,
            theatreId: cinemax._id,
            theatreName: cinemax.name,
            bookedSeats: [],
          },
          {
            time: '07:00 PM',
            price: 380,
            availableSeats: 75,
            screen: 'Screen 2 (RGB Laser Audi)',
            date: futureDate2,
            theatreId: cinemax._id,
            theatreName: cinemax.name,
            bookedSeats: ['B1', 'B2', 'B3', 'B4', 'B5'],
          },
        ],
      },
      {
        title: 'Kalki 2898 AD',
        description: 'A modern avatar of Vishnu descends to Earth to protect the world from evil forces in a futuristic post-apocalyptic era.',
        genre: 'Sci-Fi / Action / Mythology',
        duration: 181,
        language: 'Hindi',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2024-06-27'),
        city: 'Bhopal',
        theatreName: cityPride.name,
        theatre: cityPride._id,
        owner: theatreOwner._id,
        rating: 4.7,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '11:15 AM',
            price: 260,
            availableSeats: 76,
            screen: 'Screen 1 (Laser Prime)',
            date: futureDate1,
            theatreId: cityPride._id,
            theatreName: cityPride.name,
            bookedSeats: ['C1', 'C2', 'C3', 'C4'],
          },
          {
            time: '03:30 PM',
            price: 340,
            availableSeats: 80,
            screen: 'Screen 1 (Laser Prime)',
            date: futureDate1,
            theatreId: cityPride._id,
            theatreName: cityPride.name,
            bookedSeats: [],
          },
          {
            time: '08:00 PM',
            price: 380,
            availableSeats: 72,
            screen: 'Screen 1 (Laser Prime)',
            date: futureDate2,
            theatreId: cityPride._id,
            theatreName: cityPride.name,
            bookedSeats: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
          },
        ],
      },
      {
        title: 'Stree 2: Sarkate Ka Aatank',
        description: 'Chanderi is once again terrorized by a headless ghost, forcing Vicky and his quirky friends to join hands with the mysterious Stree.',
        genre: 'Comedy / Horror',
        duration: 147,
        language: 'Hindi',
        posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2024-08-15'),
        city: 'Bhopal',
        theatreName: mpNagar.name,
        theatre: mpNagar._id,
        owner: theatreOwner._id,
        rating: 4.8,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '12:00 PM',
            price: 220,
            availableSeats: 80,
            screen: 'Screen 1 (Prime 3D)',
            date: futureDate1,
            theatreId: mpNagar._id,
            theatreName: mpNagar.name,
            bookedSeats: [],
          },
          {
            time: '04:15 PM',
            price: 280,
            availableSeats: 74,
            screen: 'Screen 1 (Prime 3D)',
            date: futureDate1,
            theatreId: mpNagar._id,
            theatreName: mpNagar.name,
            bookedSeats: ['D4', 'D5', 'D6', 'D7', 'D8', 'D9'],
          },
          {
            time: '09:00 PM',
            price: 320,
            availableSeats: 80,
            screen: 'Screen 1 (Prime 3D)',
            date: futureDate2,
            theatreId: mpNagar._id,
            theatreName: mpNagar.name,
            bookedSeats: [],
          },
        ],
      },
      {
        title: 'Interstellar: IMAX Special',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft with a team of researchers to find a new planet for humanity.',
        genre: 'Sci-Fi / Adventure / Drama',
        duration: 169,
        language: 'English',
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2024-10-01'),
        city: 'Bhopal',
        theatreName: lakeView.name,
        theatre: lakeView._id,
        owner: theatreOwner._id,
        rating: 5.0,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '01:30 PM',
            price: 280,
            availableSeats: 80,
            screen: 'Screen 1 (Lakeside Dolby 7.1)',
            date: futureDate1,
            theatreId: lakeView._id,
            theatreName: lakeView.name,
            bookedSeats: [],
          },
          {
            time: '06:45 PM',
            price: 360,
            availableSeats: 70,
            screen: 'Screen 1 (Lakeside Dolby 7.1)',
            date: futureDate1,
            theatreId: lakeView._id,
            theatreName: lakeView.name,
            bookedSeats: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'],
          },
        ],
      },
      {
        title: 'Dune: Part Two',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between love and the fate of the universe.',
        genre: 'Action / Sci-Fi / Adventure',
        duration: 166,
        language: 'English',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2024-03-01'),
        city: 'Bhopal',
        theatreName: cinemax.name,
        theatre: cinemax._id,
        owner: theatreOwner._id,
        rating: 4.8,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '01:00 PM',
            price: 270,
            availableSeats: 80,
            screen: 'Screen 1 (Dolby Atmos 4K)',
            date: futureDate2,
            theatreId: cinemax._id,
            theatreName: cinemax.name,
            bookedSeats: [],
          },
          {
            time: '05:30 PM',
            price: 350,
            availableSeats: 76,
            screen: 'Screen 1 (Dolby Atmos 4K)',
            date: futureDate2,
            theatreId: cinemax._id,
            theatreName: cinemax.name,
            bookedSeats: ['B4', 'B5', 'B6', 'B7'],
          },
        ],
      },
      {
        title: 'Jawan',
        description: 'A prison warden recruits inmates to commit outrageous acts of vigilante justice across the nation, driven by a personal vendetta to rectify corrupt societal injustice.',
        genre: 'Action / Thriller',
        duration: 169,
        language: 'Hindi',
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2023-09-07'),
        city: 'Bhopal',
        theatreName: cityPride.name,
        theatre: cityPride._id,
        owner: theatreOwner._id,
        rating: 4.6,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '02:00 PM',
            price: 240,
            availableSeats: 80,
            screen: 'Screen 1 (Laser Prime)',
            date: futureDate1,
            theatreId: cityPride._id,
            theatreName: cityPride.name,
            bookedSeats: [],
          },
          {
            time: '07:15 PM',
            price: 310,
            availableSeats: 75,
            screen: 'Screen 1 (Laser Prime)',
            date: futureDate2,
            theatreId: cityPride._id,
            theatreName: cityPride.name,
            bookedSeats: ['C5', 'C6', 'C7', 'C8', 'C9'],
          },
        ],
      },
      {
        title: '12th Fail',
        description: 'Inspired by the true story of IPS officer Manoj Kumar Sharma who restarts his academic journey from poverty to crack India\'s toughest civil services exam.',
        genre: 'Drama / Inspirational / Biography',
        duration: 147,
        language: 'Hindi',
        posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2023-10-27'),
        city: 'Bhopal',
        theatreName: mpNagar.name,
        theatre: mpNagar._id,
        owner: theatreOwner._id,
        rating: 4.9,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '11:00 AM',
            price: 200,
            availableSeats: 80,
            screen: 'Screen 1 (Prime 3D)',
            date: futureDate1,
            theatreId: mpNagar._id,
            theatreName: mpNagar.name,
            bookedSeats: [],
          },
          {
            time: '03:45 PM',
            price: 250,
            availableSeats: 78,
            screen: 'Screen 1 (Prime 3D)',
            date: futureDate3,
            theatreId: mpNagar._id,
            theatreName: mpNagar.name,
            bookedSeats: ['A7', 'A8'],
          },
        ],
      },
      {
        title: 'Spider-Man: Beyond Horizons',
        description: 'Miles Morales catapults across the Multiverse to encounter a team of Spider-People charged with protecting its very existence.',
        genre: 'Animation / Action / Superhero',
        duration: 140,
        language: 'English',
        posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop'],
        releaseDate: new Date('2024-05-15'),
        city: 'Bhopal',
        theatreName: lakeView.name,
        theatre: lakeView._id,
        owner: theatreOwner._id,
        rating: 4.7,
        category: 'movie',
        published: true,
        showtimes: [
          {
            time: '10:45 AM',
            price: 250,
            availableSeats: 80,
            screen: 'Screen 1 (Lakeside Dolby 7.1)',
            date: futureDate1,
            theatreId: lakeView._id,
            theatreName: lakeView.name,
            bookedSeats: [],
          },
          {
            time: '04:30 PM',
            price: 320,
            availableSeats: 76,
            screen: 'Screen 1 (Lakeside Dolby 7.1)',
            date: futureDate2,
            theatreId: lakeView._id,
            theatreName: lakeView.name,
            bookedSeats: ['E1', 'E2', 'E3', 'E4'],
          },
        ],
      },
    ];

    for (const m of demoMovies) {
      const { doc, created } = await findOrCreate(Movie, { title: m.title, city: 'Bhopal' }, m);
      console.log(`  ${created ? '✓ Created' : '• Exists'}: ${doc.title} (${doc.genre}, ${doc.showtimes?.length} showtimes at ${doc.theatreName})`);
    }

    // ==========================================
    // 5. DEMO EVENTS (TASK 4)
    // ==========================================
    console.log('\n--- 5. Seeding Demo Events in Bhopal (All 6 Types) ---');
    const demoEvents = [
      {
        title: 'Bhopal Comedy Fest: Unfiltered Laughs',
        description: 'An evening of non-stop observational comedy and spontaneous crowd work featuring India\'s top trending stand-up comics live on stage.',
        category: 'comedy',
        city: 'Bhopal',
        venue: 'Ravindra Bhavan Auditorium, Polytechic Square, Bhopal',
        startDate: new Date('2026-11-05T19:30:00.000Z'),
        time: '07:30 PM',
        ticketPrice: 499,
        capacity: 350,
        seatsAvailable: 342,
        imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop',
        organizer: eventOrganizer._id,
        published: true,
        approved: true,
        featured: true,
      },
      {
        title: 'Echoes of Sufi & Rock Live Concert',
        description: 'Soul-stirring Sufi poetry blended with high-voltage acoustic rock rhythms by leading playback and indie bands in an open-air amphitheatre.',
        category: 'concert',
        city: 'Bhopal',
        venue: 'Open Air Theatre, Bharat Bhavan, Shamla Hills, Bhopal',
        startDate: new Date('2026-11-12T18:30:00.000Z'),
        time: '06:30 PM',
        ticketPrice: 799,
        capacity: 500,
        seatsAvailable: 485,
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop',
        organizer: eventOrganizer._id,
        published: true,
        approved: true,
        featured: true,
      },
      {
        title: 'Techno-Cultural Fiesta: Aagaz 2026',
        description: 'Central India\'s premier inter-college festival bringing battle of the bands, fashion parades, robotics tournaments, and star DJ nights.',
        category: 'college',
        city: 'Bhopal',
        venue: 'MANIT Sports Complex Arena, Link Road 3, Bhopal',
        startDate: new Date('2026-11-18T10:00:00.000Z'),
        time: '10:00 AM',
        ticketPrice: 299,
        capacity: 800,
        seatsAvailable: 760,
        imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop',
        organizer: eventOrganizer._id,
        published: true,
        approved: true,
        featured: true,
      },
      {
        title: 'Malwa & Bundelkhand Folk Heritage Night',
        description: 'Experience the rich cultural tapestry of Madhya Pradesh featuring traditional Matki dancers, Gond folk art displays, and heritage regional cuisine stalls.',
        category: 'festival',
        city: 'Bhopal',
        venue: 'Madhya Pradesh Tribal Museum Amphitheatre, Shyamla Hills, Bhopal',
        startDate: new Date('2026-11-22T17:00:00.000Z'),
        time: '05:00 PM',
        ticketPrice: 199,
        capacity: 400,
        seatsAvailable: 390,
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop',
        organizer: eventOrganizer._id,
        published: true,
        approved: true,
        featured: false,
      },
      {
        title: 'Central India AI & Web3 Innovators Summit',
        category: 'festival',
        city: 'Bhopal',
        venue: 'Bhopal Smart City Incubation Center, Govindpura, Bhopal',
        startDate: new Date('2026-11-28T09:30:00.000Z'),
        time: '09:30 AM',
        ticketPrice: 599,
        capacity: 250,
        seatsAvailable: 235,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop',
        organizer: eventOrganizer._id,
        published: true,
        approved: true,
        featured: true,
        description: 'Keynotes, live product demos, startup pitches, and developer masterclasses with leading AI researchers, founders, and venture capitalists.',
      },
      {
        title: 'Masterclass: Film Making & Scriptwriting Workshop',
        category: 'college',
        city: 'Bhopal',
        venue: 'Madhya Pradesh Council of Science & Technology, Vigyan Bhawan, Bhopal',
        startDate: new Date('2026-12-02T11:00:00.000Z'),
        time: '11:00 AM',
        ticketPrice: 899,
        capacity: 120,
        seatsAvailable: 110,
        imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop',
        organizer: eventOrganizer._id,
        published: true,
        approved: true,
        featured: false,
        description: 'Hands-on intensive masterclass on cinematography, lighting setup, script structures, and digital editing with industry veterans.',
      },
    ];

    for (const ev of demoEvents) {
      const { doc, created } = await findOrCreate(Event, { title: ev.title, city: 'Bhopal' }, ev);
      console.log(`  ${created ? '✓ Created' : '• Exists'}: [${doc.category}] ${doc.title} (Price: ₹${doc.ticketPrice}, Capacity: ${doc.capacity})`);
    }

    console.log('\n==================================================');
    console.log('DEMO DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
};

seedDemoData();
