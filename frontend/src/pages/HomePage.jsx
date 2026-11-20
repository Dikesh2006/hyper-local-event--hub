import { useEffect, useState, useMemo, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import AuthContext, { normalizeUserRole, getDashboardPath } from '../context/AuthContext';
import AnimatedReveal from '../components/AnimatedReveal';

// Fallback curated media for ultra-rich aesthetic if database returns empty
const FALLBACK_MOVIES = [
  {
    _id: 'fb-m1',
    title: 'Starlight Echoes',
    genre: 'Sci-Fi / Adventure',
    language: 'Hindi, English',
    rating: 4.8,
    city: 'Mumbai',
    theatreName: 'PVR Icon, Phoenix Citadel',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop',
    description: 'An epic journey across time and space exploring local cosmic phenomena.',
    showtimes: [{ time: '11:00 AM', price: 280 }, { time: '07:30 PM', price: 380 }]
  },
  {
    _id: 'fb-m2',
    title: 'The Urban Chronicles',
    genre: 'Action / Thriller',
    language: 'Hindi',
    rating: 4.6,
    city: 'Delhi',
    theatreName: 'INOX Megaplex',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop',
    description: 'A high-octane thrill ride through the underground streets of the metropolis.',
    showtimes: [{ time: '02:15 PM', price: 250 }, { time: '09:00 PM', price: 350 }]
  },
  {
    _id: 'fb-m3',
    title: 'Love & Rhythms',
    genre: 'Romance / Musical',
    language: 'Tamil, Telugu',
    rating: 4.7,
    city: 'Bangalore',
    theatreName: 'Cinepolis Forum Mall',
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop',
    description: 'A soulful tale of two artists finding love amidst rhythm and dance.',
    showtimes: [{ time: '04:00 PM', price: 300 }, { time: '08:15 PM', price: 400 }]
  },
  {
    _id: 'fb-m4',
    title: 'Shadows of the Fort',
    genre: 'Mystery / Drama',
    language: 'Marathi, Hindi',
    rating: 4.5,
    city: 'Pune',
    theatreName: 'PVR Westend Mall',
    posterUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&auto=format&fit=crop',
    description: 'Unraveling ancient secrets hidden beneath centuries of history.',
    showtimes: [{ time: '01:00 PM', price: 220 }, { time: '06:00 PM', price: 320 }]
  },
];

const FALLBACK_EVENTS = [
  {
    _id: 'fb-e1',
    title: 'Neon Nights Music Festival',
    category: 'concert',
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    time: '07:00 PM',
    venue: 'Jio World Garden',
    city: 'Mumbai',
    ticketPrice: 999,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop',
    description: 'Experience an unforgettable EDM night with international DJs and visual laser show.'
  },
  {
    _id: 'fb-e2',
    title: 'Unfiltered Comedy Special',
    category: 'comedy',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    time: '08:30 PM',
    venue: 'The Laughter Lounge',
    city: 'Bangalore',
    ticketPrice: 499,
    imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&auto=format&fit=crop',
    description: 'Top stand-up comedians bring you 90 minutes of non-stop hilarious observational humor.'
  },
  {
    _id: 'fb-e3',
    title: 'City Food & Beats Carnival',
    category: 'festival',
    startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    time: '04:00 PM',
    venue: 'DLF CyberHub Grounds',
    city: 'Delhi',
    ticketPrice: 299,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop',
    description: 'Savor gourmet food trucks, artisanal craft beverages, and live indie acoustic sets.'
  },
  {
    _id: 'fb-e4',
    title: 'Acoustic Sunset Unplugged',
    category: 'concert',
    startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    time: '06:30 PM',
    venue: 'Hard Rock Cafe',
    city: 'Pune',
    ticketPrice: 799,
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&auto=format&fit=crop',
    description: 'An intimate evening featuring soulful acoustic renditions by top local singers.'
  },
];

const FALLBACK_HALLS = [
  {
    _id: 'fb-h1',
    name: 'The Royal Crystal Ballroom',
    city: 'Mumbai',
    address: 'Fort Road, South Mumbai',
    capacity: 500,
    hourlyRate: 4500,
    rating: 4.9,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop'],
    description: 'Luxurious air-conditioned ballroom ideal for weddings, galas, and corporate expos.'
  },
  {
    _id: 'fb-h2',
    name: 'Grand Regal Banquet & Garden',
    city: 'Delhi',
    address: 'Vasant Kunj, New Delhi',
    capacity: 350,
    hourlyRate: 3800,
    rating: 4.8,
    images: ['https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop'],
    description: 'Spacious banquet hall with scenic outdoor lawn and crystal lighting.'
  },
  {
    _id: 'fb-h3',
    name: 'Skyline Terrace & Convention Hall',
    city: 'Bangalore',
    address: '100ft Road, Indiranagar',
    capacity: 250,
    hourlyRate: 3200,
    rating: 4.7,
    images: ['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&auto=format&fit=crop'],
    description: 'Modern rooftop venue with panoramic city views and state-of-the-art audio visual tech.'
  },
];

const FALLBACK_MANAGERS = [
  {
    _id: 'fb-mgr1',
    name: 'Ananya Roy',
    city: 'Mumbai',
    expertise: 'Concerts & Grand Weddings',
    rating: 4.9,
    pricePerEvent: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    bio: '10+ years experience managing high-profile concerts, luxury weddings, and celeb events.'
  },
  {
    _id: 'fb-mgr2',
    name: 'Rohan Malhotra',
    city: 'Delhi',
    expertise: 'Corporate Events & Galas',
    rating: 4.8,
    pricePerEvent: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
    bio: 'Specialist in corporate summits, product launches, and seamlessly executed tech expos.'
  },
  {
    _id: 'fb-mgr3',
    name: 'Priya Nair',
    city: 'Bangalore',
    expertise: 'Stand-up Comedy & Festivals',
    rating: 4.9,
    pricePerEvent: 20000,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop',
    bio: 'Renowned event producer specializing in live comedy tours, food carnivals, and cultural fests.'
  },
];

const CITIES = ['All Cities', 'Bhopal', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata'];

const CATEGORY_CARDS = [
  {
    id: 'movies',
    title: 'Movies',
    icon: '🎬',
    sub: 'Blockbusters & Indie Cinema',
    path: '/movies',
    gradient: 'from-purple-600 via-indigo-600 to-blue-600',
    bgBadge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'comedy',
    title: 'Stand-up Comedy',
    icon: '🎤',
    sub: 'Live Comedy & Laugh Specials',
    path: '/events?category=comedy',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    bgBadge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    id: 'events',
    title: 'Events',
    icon: '🎉',
    sub: 'Concerts, Sports & Fests',
    path: '/events',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'halls',
    title: 'Halls & Venues',
    icon: '🏛️',
    sub: 'Banquet Halls & Open Grounds',
    path: '/halls',
    gradient: 'from-rose-500 via-pink-600 to-purple-600',
    bgBadge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    id: 'managers',
    title: 'Event Managers',
    icon: '👨‍💼',
    sub: 'Verified Planners & Crew',
    path: '/hire',
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
    bgBadge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
];

const WHY_US_FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Discover Local Events',
    description: 'Explore live movies, comedy nights, concerts, and venue listings curated right in your neighborhood.'
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Easy & Fast Booking',
    description: 'Instant ticket confirmation and seat allocation with seamless digital pass generation.'
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Verified Venues & Managers',
    description: 'Every banquet hall and event planner is manually audited and rated for quality assurance.'
  },
  {
    icon: (
      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Secure Payments',
    description: 'Bank-grade encrypted payments supporting UPI, Cards, NetBanking, and instant refunds.'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      const normRole = normalizeUserRole(user.role);
      if (['organizer', 'hall_owner', 'manager'].includes(normRole)) {
        navigate(getDashboardPath(user.role), { replace: true });
      }
    }
  }, [user, navigate]);
  
  const [movies, setMovies] = useState([]);
  const [events, setEvents] = useState([]);
  const [halls, setHalls] = useState([]);
  const [managers, setManagers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const cityParam = selectedCity !== 'All Cities' ? `?city=${encodeURIComponent(selectedCity)}` : '';

    Promise.allSettled([
      api.get(`/movies${cityParam}`),
      api.get(`/events${cityParam}`),
      api.get(`/halls${cityParam}`),
      api.get(`/managers${cityParam}`),
    ])
      .then(([movieRes, eventRes, hallRes, mgrRes]) => {
        if (!isMounted) return;

        const fetchedMovies = movieRes.status === 'fulfilled' && Array.isArray(movieRes.value.data) ? movieRes.value.data : [];
        const fetchedEvents = eventRes.status === 'fulfilled' && Array.isArray(eventRes.value.data) ? eventRes.value.data : [];
        const fetchedHalls = hallRes.status === 'fulfilled' && Array.isArray(hallRes.value.data) ? hallRes.value.data : [];
        const fetchedMgrs = mgrRes.status === 'fulfilled' && Array.isArray(mgrRes.value.data) ? mgrRes.value.data : [];

        setMovies(fetchedMovies);
        setEvents(fetchedEvents);
        setHalls(fetchedHalls);
        setManagers(fetchedMgrs);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError('Failed to fetch latest events from server. Displaying preview catalog.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  // Combine real backend data with fallback items if database has fewer items
  const displayMovies = useMemo(() => {
    const list = [...movies];
    FALLBACK_MOVIES.forEach((fallback) => {
      if (!list.some((m) => m.title?.toLowerCase() === fallback.title.toLowerCase())) {
        list.push(fallback);
      }
    });
    if (selectedCity !== 'All Cities') {
      return list.filter((m) => !m.city || m.city.toLowerCase().includes(selectedCity.toLowerCase())).slice(0, 4);
    }
    return list.slice(0, 4);
  }, [movies, selectedCity]);

  const displayEvents = useMemo(() => {
    const list = [...events];
    FALLBACK_EVENTS.forEach((fallback) => {
      if (!list.some((e) => e.title?.toLowerCase() === fallback.title.toLowerCase())) {
        list.push(fallback);
      }
    });
    if (selectedCity !== 'All Cities') {
      return list.filter((e) => !e.city || e.city.toLowerCase().includes(selectedCity.toLowerCase())).slice(0, 4);
    }
    return list.slice(0, 4);
  }, [events, selectedCity]);

  const displayHalls = useMemo(() => {
    const list = [...halls];
    FALLBACK_HALLS.forEach((fallback) => {
      if (!list.some((h) => h.name?.toLowerCase() === fallback.name.toLowerCase())) {
        list.push(fallback);
      }
    });
    if (selectedCity !== 'All Cities') {
      return list.filter((h) => !h.city || h.city.toLowerCase().includes(selectedCity.toLowerCase())).slice(0, 3);
    }
    return list.slice(0, 3);
  }, [halls, selectedCity]);

  const displayManagers = useMemo(() => {
    const list = [...managers];
    FALLBACK_MANAGERS.forEach((fallback) => {
      if (!list.some((m) => m.name?.toLowerCase() === fallback.name.toLowerCase())) {
        list.push(fallback);
      }
    });
    if (selectedCity !== 'All Cities') {
      return list.filter((m) => !m.city || m.city.toLowerCase().includes(selectedCity.toLowerCase())).slice(0, 3);
    }
    return list.slice(0, 3);
  }, [managers, selectedCity]);

  // Quick live search matching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedMovies = displayMovies.filter(m => m.title?.toLowerCase().includes(q) || m.genre?.toLowerCase().includes(q));
    const matchedEvents = displayEvents.filter(e => e.title?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q));
    const matchedHalls = displayHalls.filter(h => h.name?.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q));
    const matchedMgrs = displayManagers.filter(m => m.name?.toLowerCase().includes(q) || m.expertise?.toLowerCase().includes(q));

    return {
      movies: matchedMovies,
      events: matchedEvents,
      halls: matchedHalls,
      managers: matchedMgrs,
      total: matchedMovies.length + matchedEvents.length + matchedHalls.length + matchedMgrs.length
    };
  }, [searchQuery, displayMovies, displayEvents, displayHalls, displayManagers]);

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-16 md:space-y-24 pb-12">
      
      {/* 2. HERO SECTION */}
      <AnimatedReveal delay={0.05} duration={0.8} y={20} className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-10 lg:p-14 text-white shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span>✦ Hyper Local Entertainment & Booking Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
              Discover What’s <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Happening Near You
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Movies, events, comedy shows, venues and event managers — all in one place.
            </p>

            {/* Interactive Search & Location Bar */}
            <form onSubmit={handleHeroSearchSubmit} className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-xl shadow-2xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
              
              {/* City Select */}
              <div className="relative sm:w-44 flex items-center border-b sm:border-b-0 sm:border-r border-white/10 pb-2 sm:pb-0 pr-2">
                <svg className="h-4 w-4 ml-3 text-indigo-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-white outline-none cursor-pointer appearance-none"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
                <svg className="h-3.5 w-3.5 mr-2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, events, comedy shows..."
                  className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Submit Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
              >
                Search
              </button>
            </form>

            {/* Live Hero Search Preview Popup */}
            {searchResults && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Search Results ({searchResults.total})
                  </span>
                  <span className="text-[10px] text-slate-400">Press enter to view all</span>
                </div>
                {searchResults.total === 0 ? (
                  <p className="text-xs text-slate-400 p-2">No matching events or movies found.</p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.movies.map((m) => (
                      <Link key={m._id} to="/movies" className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition">
                        <div>
                          <p className="text-xs font-bold text-white">🎬 {m.title}</p>
                          <p className="text-[10px] text-slate-400">{m.genre} • {m.city}</p>
                        </div>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">Movie</span>
                      </Link>
                    ))}
                    {searchResults.events.map((e) => (
                      <Link key={e._id} to="/events" className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition">
                        <div>
                          <p className="text-xs font-bold text-white">🎉 {e.title}</p>
                          <p className="text-[10px] text-slate-400">{e.venue} • ₹{e.ticketPrice}</p>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">Event</span>
                      </Link>
                    ))}
                    {searchResults.halls.map((h) => (
                      <Link key={h._id} to="/halls" className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition">
                        <div>
                          <p className="text-xs font-bold text-white">🏛️ {h.name}</p>
                          <p className="text-[10px] text-slate-400">{h.city} • Capacity {h.capacity}</p>
                        </div>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">Hall</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/events"
                className="rounded-full bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:scale-105"
              >
                Explore Events
              </Link>
              <Link
                to="/movies"
                className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
              >
                Book a Movie
              </Link>
            </div>

            {/* Stats badges */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/10">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">500+</p>
                <p className="text-xs text-slate-400 font-medium">Live Events</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">100+</p>
                <p className="text-xs text-slate-400 font-medium">Verified Venues</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">4.9 ⭐</p>
                <p className="text-xs text-slate-400 font-medium">User Rating</p>
              </div>
            </div>

          </div>

          {/* Hero Banner Visual Card */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="relative mx-auto max-w-sm rounded-3xl border border-white/15 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop"
                  alt="Live Concert Feature"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute top-3 right-3 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Trending Now
                </span>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Live Music & Fest</p>
                  <p className="text-lg font-bold">Neon Nights Festival 2026</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Jio World Garden, Mumbai
                </span>
                <span className="font-bold text-white">₹999 onwards</span>
              </div>
            </div>
          </div>
        </div>
      </AnimatedReveal>

      {/* 3. CATEGORIES SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Explore Categories
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select your favorite entertainment zone to start booking
            </p>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_CARDS.map((cat, index) => (
            <AnimatedReveal key={cat.id} delay={0.08 + index * 0.04} duration={0.6} y={16}>
              <Link
                to={cat.path}
                className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200"
              >
                <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${cat.gradient} mb-4 group-hover:w-full transition-all duration-300`} />
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{cat.icon}</div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {cat.sub}
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
                  <span>Browse</span>
                  <svg className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </AnimatedReveal>
          ))}
        </div>
      </section>

      {/* 4. POPULAR MOVIES SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎬</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Popular Movies
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Book tickets for trending local and national movies
            </p>
          </div>
          <Link
            to="/movies"
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>View All Movies</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="h-52 w-full rounded-xl bg-slate-200" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
              </div>
            ))
          ) : displayMovies.map((movie, index) => (
            <AnimatedReveal key={movie._id} delay={0.1 + index * 0.05} duration={0.6} y={20}>
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200 h-full">
                <div>
                  {/* Poster Image */}
                  <div className="relative h-60 w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={movie.posterUrl || movie.bannerUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop'}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md flex items-center gap-1">
                      <span>⭐</span>
                      <span>{movie.rating || 4.5}</span>
                    </div>
                    {movie.language && (
                      <span className="absolute bottom-2.5 left-2.5 rounded-md bg-indigo-600/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                        {movie.language}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-4 space-y-1">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {movie.genre || 'Drama'}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{movie.city || movie.theatreName || 'Local Theatres'}</span>
                    </p>
                  </div>
                </div>

                {/* Book Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Starts from</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{movie.showtimes?.[0]?.price || 250}
                    </span>
                  </div>
                  <Link
                    to={`/movies?movieId=${movie._id}`}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </section>

      {/* 5. UPCOMING EVENTS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Upcoming Events Near You
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Live concerts, comedy shows, sports and local carnivals
            </p>
          </div>
          <Link
            to="/events"
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>View All Events</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="h-44 w-full rounded-xl bg-slate-200" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
              </div>
            ))
          ) : displayEvents.map((event, index) => (
            <AnimatedReveal key={event._id} delay={0.1 + index * 0.05} duration={0.6} y={20}>
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200 h-full">
                <div>
                  {/* Event Image */}
                  <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={event.imageUrl || event.bannerUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop'}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop';
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
                      {event.category || 'Event'}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow-sm">
                      {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="mt-4 space-y-1">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.time || '07:00 PM'}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{event.venue || 'City Arena'}, {event.city}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pass Price</span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      ₹{event.ticketPrice}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/events?eventId=${event._id}`}
                      className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
                    >
                      Book Now
                    </Link>
                    <Link
                      to="/events"
                      className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </section>

      {/* 6. POPULAR HALLS & VENUES SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Popular Halls & Venues
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Banquet halls, convention centers and celebration grounds
            </p>
          </div>
          <Link
            to="/halls"
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>View All Halls</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="h-48 w-full rounded-xl bg-slate-200" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
              </div>
            ))
          ) : displayHalls.map((hall, index) => (
            <AnimatedReveal key={hall._id} delay={0.1 + index * 0.05} duration={0.6} y={20}>
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200 h-full">
                <div>
                  <div className="relative h-52 w-full overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={hall.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop'}
                      alt={hall.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md flex items-center gap-1">
                      <span>⭐</span>
                      <span>{hall.rating || 4.7}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {hall.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="truncate">{hall.address || hall.city}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        👥 Capacity: {hall.capacity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rental Rate</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{hall.hourlyRate || hall.pricePerNight} <span className="text-xs font-normal text-slate-500">/ hr</span>
                    </span>
                  </div>
                  <Link
                    to="/halls"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-600"
                  >
                    Book Hall
                  </Link>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </section>

      {/* 7. EVENT MANAGERS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍💼</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Find Event Managers
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Hire trusted event coordinators for weddings, galas and concerts
            </p>
          </div>
          <Link
            to="/hire"
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <span>View All Managers</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="h-32 w-full rounded-xl bg-slate-200" />
                <div className="h-5 w-3/4 rounded bg-slate-200" />
              </div>
            ))
          ) : displayManagers.map((mgr, index) => (
            <AnimatedReveal key={mgr._id} delay={0.1 + index * 0.05} duration={0.6} y={20}>
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200 h-full">
                <div>
                  <div className="flex items-center gap-4">
                    <img
                      src={mgr.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'}
                      alt={mgr.name}
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
                      }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {mgr.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{mgr.city}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-500">
                        <span>⭐ {mgr.rating || 4.8}</span>
                        <span className="text-slate-400 font-normal">(Verified)</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {mgr.bio || 'Professional local event manager with proven track record in organising seamless functions.'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                      🎯 {mgr.expertise || 'Full Event Management'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Starting Fee</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ₹{mgr.pricePerEvent} <span className="text-[10px] font-normal text-slate-500">/ event</span>
                    </span>
                  </div>
                  <Link
                    to="/hire"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
                  >
                    Hire Manager
                  </Link>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </section>

      {/* 8. WHY CHOOSE US SECTION */}
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-indigo-50/30 p-6 sm:p-10 lg:p-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Why Choose Hyper Local Event Hub?
          </h2>
          <p className="text-sm text-slate-500">
            Designed to bring local entertainment and seamless event organizing right to your fingertips.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US_FEATURES.map((item, index) => (
            <AnimatedReveal key={item.title} delay={0.08 + index * 0.05} duration={0.6} y={16}>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1 h-full flex flex-col items-start justify-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </section>

      {/* 9. CTA SECTION */}
      <AnimatedReveal delay={0.1} duration={0.8} y={20}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-8 sm:p-12 text-center text-white shadow-2xl">
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Plan Your Next Experience
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Everything you need to discover, book and manage your next event.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link
                to="/events"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-indigo-700 shadow-xl transition hover:bg-indigo-50 hover:scale-105"
              >
                Explore Now
              </Link>
            </div>
          </div>
        </div>
      </AnimatedReveal>

    </div>
  );
};

export default HomePage;

