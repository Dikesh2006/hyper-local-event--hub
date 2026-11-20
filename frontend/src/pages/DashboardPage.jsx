import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../api/api';

const DashboardPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/bookings', authHeaders()).then((res) => setBookings(res.data)).catch(() => setBookings([]));
    if (user.role === 'admin') {
      api.get('/admin/analytics', authHeaders()).then((res) => setStats(res.data)).catch(() => setStats(null));
    }
  }, [user, token]);

  if (!user) {
    return <div className="rounded-[2rem] bg-slate-900/80 p-10 text-center text-slate-300">Please login to view your dashboard.</div>;
  }

  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] bg-white/5 p-8 shadow-glass backdrop-blur-xl">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <p className="mt-3 text-slate-300">Manage your bookings, view local analytics, and access your organizer or admin control panel.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[2rem] bg-slate-900/80 p-8 shadow-glass">
          <h2 className="text-xl font-semibold text-white">My Bookings</h2>
          <div className="mt-6 space-y-4">
            {bookings.length ? bookings.map((booking) => (
              <div key={booking._id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="font-semibold text-white">{booking.movie?.title || booking.event?.title || booking.hall?.name || 'Booking'}</p>
                <p className="mt-1 text-sm text-slate-400">{new Date(booking.date).toLocaleString()} • {booking.status}</p>
              </div>
            )) : <p className="text-slate-400">No bookings yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-slate-900/80 p-8 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <p className="mt-4 text-slate-300">Name: {user.name}</p>
            <p className="text-slate-300">Email: {user.email}</p>
            <p className="text-slate-300">Role: {user.role}</p>
          </div>
          {user.role === 'admin' && stats && (
            <div className="rounded-[2rem] bg-slate-900/80 p-8 shadow-glass">
              <h2 className="text-xl font-semibold text-white">Admin Analytics</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Users</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stats.users}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Events</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stats.events}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Halls</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stats.halls}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Bookings</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stats.bookings}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
