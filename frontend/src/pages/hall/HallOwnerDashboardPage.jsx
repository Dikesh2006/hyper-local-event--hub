import { useEffect, useState, useContext } from 'react';
import api from '../../api/api';
import AuthContext from '../../context/AuthContext';
import AnimatedReveal from '../../components/AnimatedReveal';

const HallOwnerDashboardPage = () => {
  const { user, authHeaders } = useContext(AuthContext);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editHallId, setEditHallId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: 'Mumbai',
    capacity: 300,
    hourlyRate: 3500,
    pricePerNight: 25000,
    type: 'venue',
    description: '',
    imageUrl: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMyHalls = () => {
    setLoading(true);
    api.get('/halls/me', authHeaders())
      .then((res) => {
        setHalls(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyHalls();
  }, []);

  const handleSaveHall = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      ...form,
      images: form.imageUrl ? [form.imageUrl] : [],
    };

    try {
      if (editHallId) {
        await api.put(`/halls/${editHallId}`, payload, authHeaders());
        setMessage('Hall updated successfully!');
      } else {
        await api.post('/halls', payload, authHeaders());
        setMessage('Hall added successfully!');
      }
      setShowModal(false);
      setEditHallId(null);
      fetchMyHalls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hall listing.');
    }
  };

  const handleEditClick = (hall) => {
    setEditHallId(hall._id);
    setForm({
      name: hall.name || '',
      address: hall.address || '',
      city: hall.city || 'Mumbai',
      capacity: hall.capacity || 300,
      hourlyRate: hall.hourlyRate || 3500,
      pricePerNight: hall.pricePerNight || 25000,
      type: hall.type || 'venue',
      description: hall.description || '',
      imageUrl: hall.images?.[0] || '',
    });
    setShowModal(true);
  };

  const handleDeleteHall = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hall?')) return;
    try {
      await api.delete(`/halls/${id}`, authHeaders());
      setMessage('Hall deleted.');
      fetchMyHalls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hall.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-3xl border border-slate-200 bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/30">
              🏛️ Hall & Venue Owner Portal
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, {user?.name}!</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Manage your banquet halls, convention grounds, pricing and reservation availability.
            </p>
          </div>
          <button
            onClick={() => {
              setEditHallId(null);
              setForm({
                name: '',
                address: '',
                city: 'Mumbai',
                capacity: 300,
                hourlyRate: 3500,
                pricePerNight: 25000,
                type: 'venue',
                description: '',
                imageUrl: '',
              });
              setShowModal(true);
            }}
            className="rounded-full bg-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-500 active:scale-95"
          >
            + Add New Hall / Venue
          </button>
        </div>
      </AnimatedReveal>

      {message && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">{message}</div>}
      {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700">{error}</div>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">My Listed Halls</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{halls.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Avg Hourly Rate</p>
          <p className="mt-2 text-2xl font-extrabold text-teal-600">
            ₹{halls.length ? Math.round(halls.reduce((acc, h) => acc + (h.hourlyRate || 0), 0) / halls.length) : 0}/hr
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Account Status</p>
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Approved Venue Provider
          </span>
        </div>
      </div>

      {/* Halls Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">My Halls & Venues ({halls.length})</h2>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading hall listings...</div>
        ) : halls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-slate-600 text-sm font-semibold">No halls listed under your account.</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Add New Hall / Venue" above to list your venue.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {halls.map((hall) => (
              <div key={hall._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="h-40 w-full overflow-hidden rounded-xl bg-slate-100 mb-3">
                    <img
                      src={hall.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop'}
                      alt={hall.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop'; }}
                    />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{hall.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">📍 {hall.address}, {hall.city}</p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{hall.description || 'Spacious event venue for weddings and corporate gatherings.'}</p>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span>👥 Capacity: {hall.capacity}</span>
                    <span className="font-bold text-teal-700">₹{hall.hourlyRate}/hr</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleEditClick(hall)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHall(hall._id)}
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">{editHallId ? 'Edit Hall Listing' : 'Add New Hall'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveHall} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Hall Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Royal Crystal Ballroom"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="text-xs font-semibold text-slate-700">Guest Capacity</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Address / Location</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. Fort Road, South Mumbai"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={form.hourlyRate}
                    onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Price Per Night (₹)</label>
                  <input
                    type="number"
                    value={form.pricePerNight}
                    onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Features, AC, sound system, catering options..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Photo Image URL</label>
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
                  className="w-1/2 rounded-full bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 shadow-md shadow-teal-600/20"
                >
                  {editHallId ? 'Save Changes' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallOwnerDashboardPage;
