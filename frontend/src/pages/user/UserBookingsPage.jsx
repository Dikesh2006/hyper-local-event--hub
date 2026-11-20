import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import UserLayout from '../../components/layouts/UserLayout';
import TicketModal from '../../components/TicketModal';

const UserBookingsPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionMessage, setActionMessage] = useState('');

  const fetchBookings = () => {
    if (!user) return;
    setLoading(true);
    api
      .get('/bookings', authHeaders())
      .then((res) => {
        setBookings(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [user, token]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your seats.')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`, {}, authHeaders());
      setActionMessage('Booking cancelled successfully.');
      setTimeout(() => setActionMessage(''), 4000);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'movies') return Boolean(b.movie);
    if (activeFilter === 'events') return Boolean(b.event);
    if (activeFilter === 'halls') return Boolean(b.hall);
    if (activeFilter === 'managers') return Boolean(b.manager);
    return true;
  });

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-6 md:p-8 shadow-glass backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Customer Portal
              </span>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white tracking-tight">My Bookings & Tickets</h1>
              <p className="mt-1 text-xs md:text-sm text-slate-300">
                View your confirmed e-tickets, verify QR codes at venue turnstiles, and manage your admissions.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950/80 px-4 py-2.5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tickets</span>
                <span className="text-xl font-extrabold text-white">{bookings.length}</span>
              </div>
              <div className="rounded-2xl bg-slate-950/80 px-4 py-2.5 border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active</span>
                <span className="text-xl font-extrabold text-emerald-400">
                  {bookings.filter((b) => b.status === 'confirmed').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/80 p-3 border border-white/10 shadow-glass">
          <div className="flex gap-2">
            {[
              { id: 'all', label: `All (${bookings.length})` },
              { id: 'movies', label: `Movies (${bookings.filter((b) => b.movie).length})` },
              { id: 'events', label: `Events (${bookings.filter((b) => b.event).length})` },
              { id: 'halls', label: `Halls (${bookings.filter((b) => b.hall).length})` },
              { id: 'managers', label: `Managers (${bookings.filter((b) => b.manager).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchBookings}
            className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            ↻ Refresh
          </button>
        </div>

        {actionMessage && (
          <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs text-emerald-200">
            {actionMessage}
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-32 rounded-3xl bg-slate-900/60 animate-pulse border border-white/5" />
            ))
          ) : filteredBookings.length ? (
            filteredBookings.map((booking) => {
              const isMovie = Boolean(booking.movie);
              const isEvent = Boolean(booking.event);
              const isManager = Boolean(booking.manager);
              const isHall = Boolean(booking.hall);
              const title =
                booking.movie?.title ||
                booking.event?.title ||
                booking.hall?.name ||
                (booking.manager ? `Manager: ${booking.manager.name}` : 'Booking');
              const venue =
                booking.movie?.theatreName ||
                booking.event?.venue ||
                booking.hall?.address ||
                (booking.manager ? `City: ${booking.manager.city}` : 'Venue');
              const city = booking.movie?.city || booking.event?.city || booking.hall?.city || booking.manager?.city || '';
              const showtime = booking.showtime || (isEvent ? booking.event?.time : '07:00 PM') || '07:00 PM';
              const ticketId = booking.ticketId || `TKT-${booking._id?.slice(-8).toUpperCase()}`;
              const seatsFormatted = (booking.seats || []).map((s) => (typeof s === 'string' ? s : s.seatNumber)).join(', ');
              const isCancelled = booking.status === 'cancelled';

              return (
                <div
                  key={booking._id}
                  className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 md:p-6 shadow-glass transition hover:border-white/20"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isMovie
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : isEvent
                            ? 'bg-amber-500/20 text-amber-300'
                            : isManager
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {isMovie ? '🎬 Movie Ticket' : isEvent ? '🎟️ Event Pass' : isManager ? '👔 Manager Hire' : '🏛️ Venue'}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {ticketId}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          isCancelled
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white">{title}</h3>
                      <p className="text-xs text-slate-300">
                        📍 {venue} {city ? `• ${city}` : ''}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                        <span>📅 {new Date(booking.date).toLocaleDateString()}</span>
                        <span>⏰ {showtime}</span>
                        {seatsFormatted && (
                          <span className="rounded-lg bg-slate-950/70 px-2 py-0.5 text-indigo-300 font-medium">
                            💺 Seats: {seatsFormatted}
                          </span>
                        )}
                        <span className="text-emerald-400 font-bold">
                          Paid: ₹{booking.totalPrice}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
                      >
                        <span>🎟️ View Ticket QR</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="text-xs text-rose-400 hover:text-rose-300 transition px-2 py-1"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-12 text-center space-y-4">
              <span className="text-4xl">🎟️</span>
              <h3 className="text-lg font-bold text-white">No bookings found yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore local cinema blockbusters or thrilling live events in your city to make your first booking!
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  to="/movies"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Book Movies
                </Link>
                <Link
                  to="/events"
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  Discover Events
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </UserLayout>
  );
};

export default UserBookingsPage;
