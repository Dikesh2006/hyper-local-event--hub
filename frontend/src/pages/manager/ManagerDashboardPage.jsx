import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import ManagerLayout from '../../components/layouts/ManagerLayout';

const emptyForm = {
  title: '',
  description: '',
  category: 'concert',
  city: '',
  venue: '',
  startDate: '',
  ticketPrice: '',
  time: '',
  capacity: '',
  published: true,
};

const ManagerDashboardPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ events: 0, bookings: 0 });
  const [form, setForm] = useState(emptyForm);

  const loadData = () => {
    if (!user) return;
    Promise.all([
      api.get('/events/me', authHeaders()),
      api.get('/bookings', authHeaders()),
    ])
      .then(([eventsRes, bookingsRes]) => {
        const upcomingEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        setEvents(upcomingEvents);
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setStats({ events: upcomingEvents.length, bookings: Array.isArray(bookingsRes.data) ? bookingsRes.data.length : 0 });
      })
      .catch(() => {
        setEvents([]);
        setBookings([]);
        setStats({ events: 0, bookings: 0 });
      });
  };

  useEffect(() => {
    loadData();
  }, [user, token]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post('/events', {
        ...form,
        ticketPrice: Number(form.ticketPrice),
        capacity: Number(form.capacity),
      }, authHeaders());
      setForm(emptyForm);
      loadData();
    } catch {
      // keep the dashboard responsive even if the request fails
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/events/${id}`, authHeaders());
      loadData();
    } catch {
      // keep the dashboard responsive even if the request fails
    }
  };

  const handlePublishToggle = async (event) => {
    try {
      await api.put(`/events/${event._id}`, { published: !event.published }, authHeaders());
      loadData();
    } catch {
      // keep the dashboard responsive even if the request fails
    }
  };

  return (
    <ManagerLayout>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-glass">
              <p className="text-sm text-amber-100">Published events</p>
              <p className="mt-3 text-3xl font-semibold">{stats.events}</p>
            </div>
            <div className="rounded-[1.75rem] bg-gradient-to-br from-indigo-500 to-violet-500 p-5 text-white shadow-glass">
              <p className="text-sm text-indigo-100">Bookings</p>
              <p className="mt-3 text-3xl font-semibold">{stats.bookings}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Create and manage events</h2>
            <form onSubmit={handleCreate} className="mt-6 grid gap-3 md:grid-cols-2">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Event title" required />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="City" required />
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Venue" required />
              <input value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} type="number" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Ticket price" required />
              <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" required />
              <input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Time" />
              <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} type="number" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Capacity" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white">
                {['concert', 'sports', 'comedy', 'college', 'festival'].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Description" required />
              <label className="md:col-span-2 flex items-center gap-3 text-sm text-slate-300">
                <input checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} type="checkbox" className="h-4 w-4" />
                Publish immediately
              </label>
              <button type="submit" className="md:col-span-2 rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white">Save event</button>
            </form>
            <div className="mt-6 space-y-3">
              {events.map((event) => (
                <div key={event._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{event.city} • {event.venue}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePublishToggle(event)} className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">{event.published ? 'Published' : 'Draft'}</button>
                      <button onClick={() => handleDelete(event._id)} className="rounded-full bg-rose-500/20 px-3 py-1 text-sm text-rose-200">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Bookings</h2>
            <div className="mt-6 space-y-3">
              {bookings.length ? bookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-medium text-white">{booking.movie?.title || booking.event?.title || 'Booking'}</p>
                  <p className="mt-1 text-sm text-slate-400">{booking.status}</p>
                </div>
              )) : <p className="text-sm text-slate-400">No bookings yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboardPage;
