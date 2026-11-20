import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import AnimatedReveal from '../components/AnimatedReveal';

const HallBookingPage = () => {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [city, setCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = city === 'All' ? '/halls' : `/halls?city=${encodeURIComponent(city)}`;
    api
      .get(query)
      .then((res) => setHalls(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  }, [city]);

  const handleBookHall = (hall) => {
    const bookingDetails = {
      type: 'hall',
      hallId: hall._id,
      title: hall.name,
      venue: hall.address,
      city: hall.city,
      date: new Date(),
      showtime: 'Full Day Event Access',
      seats: [{ seatNumber: 'Grand Venue Access', price: (hall.hourlyRate || 3000) * 4, tier: 'Full Day' }],
      totalPrice: (hall.hourlyRate || 3000) * 4,
    };
    navigate('/payment', { state: { bookingDetails } });
  };

  return (
    <div className="space-y-10">
      {/* Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 shadow-glass backdrop-blur-xl">
        <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
          Banquet & Convention Venues
        </span>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">Book Banquet Halls & Event Spaces</h1>
        <p className="mt-2 max-w-2xl text-slate-300 text-sm">
          Discover verified air-conditioned ballrooms, heritage palaces, and modern convention centers in Bhopal, Mumbai, and Delhi.
        </p>
      </AnimatedReveal>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-slate-900/80 p-5 shadow-glass border border-white/10">
        <div className="flex flex-wrap gap-2.5">
          {['All', 'Bhopal', 'Mumbai', 'Delhi'].map((opt) => (
            <button
              key={opt}
              onClick={() => setCity(opt)}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                city === opt
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Showing {halls.length} venues in {city === 'All' ? 'all cities' : city}
        </span>
      </div>

      {/* Halls Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-64 rounded-[2rem] bg-slate-900/60 animate-pulse border border-white/5" />
          ))
        ) : halls.length ? (
          halls.map((hall) => (
            <div
              key={hall._id}
              className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-glass transition hover:border-indigo-500/40 hover:-translate-y-1"
            >
              <div className="space-y-4">
                {hall.images?.length > 0 && (
                  <div className="h-48 w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img
                      src={hall.images[0]}
                      alt={hall.name}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                      ★ {hall.rating || 4.8} Verified Venue
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-white">{hall.name}</h2>
                    <p className="mt-1 text-xs text-slate-400">📍 {hall.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Rate</span>
                    <span className="text-xl font-extrabold text-indigo-400">₹{hall.hourlyRate}/hr</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{hall.description}</p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300">
                    👥 Capacity: {hall.capacity} Guests
                  </span>
                  {hall.city && (
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-indigo-300">
                      📍 {hall.city}
                    </span>
                  )}
                  {hall.amenities?.slice(0, 3).map((a, i) => (
                    <span key={i} className="rounded-lg bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-400">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Book Action */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-400 font-semibold">● Instant Digital Booking</span>
                </div>
                <button
                  onClick={() => handleBookHall(hall)}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95"
                >
                  Book Venue Now →
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-[2rem] bg-slate-900/80 p-8 text-slate-400 col-span-2 text-center">
            No halls found for {city}. Try selecting 'All' or another city.
          </p>
        )}
      </div>
    </div>
  );
};

export default HallBookingPage;
