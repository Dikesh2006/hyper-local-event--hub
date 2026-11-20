import { useEffect, useState, useContext } from 'react';
import api from '../../api/api';
import AuthContext from '../../context/AuthContext';
import AnimatedReveal from '../../components/AnimatedReveal';

const OrganizerDashboardPage = () => {
  const { user, authHeaders } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEventId, setEditEventId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'concert',
    city: 'Mumbai',
    venue: '',
    startDate: '',
    time: '07:00 PM',
    ticketPrice: 499,
    seatsAvailable: 200,
    imageUrl: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMyData = () => {
    setLoading(true);
    Promise.allSettled([
      api.get('/events/me', authHeaders()),
      api.get('/bookings', authHeaders()),
    ]).then(([eventsRes, bookingsRes]) => {
      if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value.data)) {
        setEvents(eventsRes.value.data);
      }
      if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value.data)) {
        setBookings(bookingsRes.value.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMyData();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editEventId) {
        await api.put(`/events/${editEventId}`, form, authHeaders());
        setMessage('Event updated successfully!');
      } else {
        await api.post('/events', form, authHeaders());
        setMessage('Event published successfully!');
      }
      setShowModal(false);
      setEditEventId(null);
      setForm({
        title: '',
        description: '',
        category: 'concert',
        city: 'Mumbai',
        venue: '',
        startDate: '',
        time: '07:00 PM',
        ticketPrice: 499,
        seatsAvailable: 200,
        imageUrl: '',
      });
      fetchMyData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event.');
    }
  };

  const handleEditClick = (event) => {
    setEditEventId(event._id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'concert',
      city: event.city || 'Mumbai',
      venue: event.venue || '',
      startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      time: event.time || '07:00 PM',
      ticketPrice: event.ticketPrice || 499,
      seatsAvailable: event.seatsAvailable || 200,
      imageUrl: event.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`, authHeaders());
      setMessage('Event deleted.');
      fetchMyData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  const totalRevenue = events.reduce((sum, ev) => sum + (ev.analytics?.bookings || 0) * (ev.ticketPrice || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              ✦ Organizer Portal
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {user?.name}!</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Manage your hosted concerts, comedy nights, festivals and track attendee bookings.
            </p>
          </div>
          <button
            onClick={() => {
              setEditEventId(null);
              setForm({
                title: '',
                description: '',
                category: 'concert',
                city: 'Mumbai',
                venue: '',
                startDate: '',
                time: '07:00 PM',
                ticketPrice: 499,
                seatsAvailable: 200,
                imageUrl: '',
              });
              setShowModal(true);
            }}
            className="rounded-full bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
          >
            + Create New Event
          </button>
        </div>
      </AnimatedReveal>

      {message && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">{message}</div>}
      {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">{error}</div>}

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">My Total Events</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{events.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Ticket Registrations</p>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600">
            {events.reduce((acc, e) => acc + (e.analytics?.bookings || 0), 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Est. Revenue</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Host Status</p>
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Verified Organizer
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">My Events ({events.length})</h2>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading your events...</div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-slate-600 text-sm font-semibold">No events created yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Create New Event" above to host your first live event.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <div key={event._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                        {event.category}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">{event.title}</h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      ₹{event.ticketPrice}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-2">{event.description}</p>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>📍 {event.venue || event.city}</span>
                    <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                    <span>🎟️ Seats: {event.seatsAvailable || 200}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleEditClick(event)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="rounded-xl border border-red-100 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">{editEventId ? 'Edit Event' : 'Create New Event'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Event Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Unplugged Night Live"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Event details..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="concert">Concert</option>
                    <option value="comedy">Stand-up Comedy</option>
                    <option value="sports">Sports</option>
                    <option value="college">College Fest</option>
                    <option value="festival">Festival</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Venue Address</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g. Hard Rock Cafe"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Ticket Price (₹)</label>
                  <input
                    type="number"
                    value={form.ticketPrice}
                    onChange={(e) => setForm({ ...form, ticketPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Seats Capacity</label>
                  <input
                    type="number"
                    value={form.seatsAvailable}
                    onChange={(e) => setForm({ ...form, seatsAvailable: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Banner Image URL (Optional)</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-full bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  {editEventId ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboardPage;
