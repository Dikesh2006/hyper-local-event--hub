import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import UserLayout from '../../components/layouts/UserLayout';

const UserDashboardPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [profile, setProfile] = useState({ name: '', city: '', phone: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      api.get('/bookings', authHeaders()),
      api.get('/events'),
      api.get(`/reviews?targetType=user&target=${user._id}`),
      api.get('/users/wishlist', authHeaders()),
      api.get('/users/profile', authHeaders()),
    ])
      .then(([bookingsRes, eventsRes, reviewsRes, wishlistRes, profileRes]) => {
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data.slice(0, 4) : []);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data.slice(0, 4) : []);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
        setWishlist(Array.isArray(wishlistRes.data) ? wishlistRes.data : []);
        setProfile({
          name: profileRes.data?.name || '',
          city: profileRes.data?.city || '',
          phone: profileRes.data?.phone || '',
        });
      })
      .catch(() => {
        setBookings([]);
        setEvents([]);
        setReviews([]);
        setWishlist([]);
      })
      .finally(() => setLoading(false));
  }, [user, token]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put('/users/profile', profile, authHeaders());
      setProfile({ name: response.data.user.name, city: response.data.user.city || '', phone: response.data.user.phone || '' });
    } catch {
      // keep the UI stable if the profile update fails
    }
  };

  const handleRemoveWishlist = async (itemId) => {
    try {
      const response = await api.delete(`/users/wishlist/${itemId}`, authHeaders());
      setWishlist(Array.isArray(response.data.wishlist) ? [] : wishlist);
    } catch {
      // keep the UI stable if the wishlist update fails
    }
  };

  return (
    <UserLayout>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Profile</p>
                <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
              </div>
              <div className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm text-indigo-200">{user?.role || 'user'}</div>
            </div>
            <form onSubmit={handleProfileSave} className="mt-6 grid gap-4 sm:grid-cols-2">
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Full name" />
              <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="City" />
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Phone" />
              <button type="submit" className="rounded-2xl bg-indigo-500 px-4 py-3 font-semibold text-white">Save profile</button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">My bookings</h2>
                <span className="text-xs text-slate-400">{bookings.length} total</span>
              </div>
              <Link to="/user/bookings" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                View All Tickets →
              </Link>
            </div>
            <div className="mt-6 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-950/70" />)
              ) : bookings.length ? bookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{booking.movie?.title || booking.event?.title || booking.hall?.name || 'Booking'}</p>
                      {booking.ticketId && (
                        <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                          {booking.ticketId}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{new Date(booking.date).toLocaleDateString()} • {booking.showtime || '07:00 PM'} • {booking.status}</p>
                  </div>
                  <Link
                    to="/user/bookings"
                    className="rounded-xl bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-600/60"
                  >
                    View Ticket
                  </Link>
                </div>
              )) : <p className="text-sm text-slate-400">No bookings yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Upcoming events</h2>
            <div className="mt-6 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-950/70" />)
              ) : events.length ? events.map((event) => (
                <div key={event._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{event.city} • {event.venue}</p>
                </div>
              )) : <p className="text-sm text-slate-400">No upcoming events available.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Wishlist</h2>
            <div className="mt-6 space-y-3">
              {wishlist.length ? wishlist.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.city} • ₹{item.ticketPrice}</p>
                  </div>
                  <button onClick={() => handleRemoveWishlist(item._id)} className="text-sm text-rose-300">Remove</button>
                </div>
              )) : <p className="text-sm text-slate-400">No favorites saved yet.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">My reviews</h2>
            <div className="mt-6 space-y-3">
              {reviews.length ? reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-medium text-white">{review.comment || 'Helpful review'}</p>
                  <p className="mt-1 text-sm text-slate-400">Rating: {review.rating}/5</p>
                </div>
              )) : <p className="text-sm text-slate-400">No reviews submitted yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserDashboardPage;
