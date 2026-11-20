import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';

const emptyForm = {
  name: '',
  city: '',
  address: '',
  capacity: '',
  hourlyRate: '',
  pricePerNight: '',
  amenities: '',
  type: 'hotel',
  description: '',
  published: true,
};

const HotelOwnerDashboardPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadData = () => {
    if (!user) return;
    Promise.all([
      api.get('/halls/me', authHeaders()),
      api.get('/bookings', authHeaders()),
    ])
      .then(([listingRes, bookingRes]) => {
        setListings(Array.isArray(listingRes.data) ? listingRes.data : []);
        setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : []);
      })
      .catch(() => {
        setListings([]);
        setBookings([]);
      });
  };

  useEffect(() => {
    loadData();
  }, [user, token]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post('/halls', {
        ...form,
        capacity: Number(form.capacity),
        hourlyRate: Number(form.hourlyRate),
        pricePerNight: Number(form.pricePerNight || 0),
        amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      }, authHeaders());
      setForm(emptyForm);
      loadData();
    } catch {
      // keep the dashboard responsive even if the request fails
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/halls/${id}`, authHeaders());
      loadData();
    } catch {
      // keep the dashboard responsive even if the request fails
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Hotel Owner Portal</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Manage your hotels and room inventory</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Add new properties, manage prices and availability, and track bookings from one place.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Add a new property</h2>
            <form onSubmit={handleCreate} className="mt-6 grid gap-3 md:grid-cols-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Property name" required />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="City" required />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Address" required />
              <input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} type="number" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Capacity" required />
              <input value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} type="number" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Hourly rate" required />
              <input value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} type="number" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Night rate" />
              <input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Amenities (comma separated)" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white">
                <option value="hotel">Hotel</option>
                <option value="theatre">Theatre</option>
                <option value="venue">Venue</option>
              </select>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" placeholder="Description" />
              <button type="submit" className="md:col-span-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white">Save listing</button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Your listings</h2>
            <div className="mt-6 space-y-3">
              {listings.map((listing) => (
                <div key={listing._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <p className="font-medium text-white">{listing.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{listing.city} • ₹{listing.hourlyRate || listing.pricePerNight}</p>
                  </div>
                  <button onClick={() => handleDelete(listing._id)} className="rounded-full bg-rose-500/20 px-3 py-1 text-sm text-rose-200">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
          <h2 className="text-xl font-semibold text-white">Recent bookings</h2>
          <div className="mt-6 space-y-3">
            {bookings.length ? bookings.map((booking) => (
              <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <p className="font-medium text-white">{booking.hall?.name || 'Booking'}</p>
                <p className="mt-1 text-sm text-slate-400">{booking.status}</p>
              </div>
            )) : <p className="text-sm text-slate-400">No bookings yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelOwnerDashboardPage;
