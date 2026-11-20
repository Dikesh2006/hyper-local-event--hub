import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';

const defaultMovieForm = {
  title: '',
  description: '',
  genre: 'Action',
  city: '',
  theatreName: '',
  duration: 120,
  language: 'English',
  showtime: '07:00 PM',
  ticketPrice: 250,
  capacity: 80,
  screen: 'Screen 1',
  posterUrl: '',
};

const TheatreOwnerDashboardPage = () => {
  const { user, token, authHeaders, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movieForm, setMovieForm] = useState(defaultMovieForm);
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    city: '',
    address: '',
    amenities: 'Dolby Atmos, 4K Projection, Recliner Seats, Food Court',
    description: '',
  });
  const [screenForm, setScreenForm] = useState({
    name: 'Screen 3 (3D)',
    capacity: 100,
    rows: 10,
    cols: 10,
    vipPrice: 350,
    stdPrice: 200,
  });
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [theatreRes, movieRes, bookingRes] = await Promise.all([
        api.get('/theatres/me', authHeaders()),
        api.get('/movies/me', authHeaders()),
        api.get('/bookings', authHeaders()),
      ]);

      const fetchedTheatres = Array.isArray(theatreRes.data) ? theatreRes.data : [];
      setTheatres(fetchedTheatres);

      if (fetchedTheatres.length > 0) {
        const primary = fetchedTheatres[0];
        setSelectedTheatre(primary);
        setTheatreForm({
          name: primary.name || '',
          city: primary.city || '',
          address: primary.address || '',
          amenities: Array.isArray(primary.amenities) ? primary.amenities.join(', ') : '',
          description: primary.description || '',
        });
        setMovieForm((prev) => ({
          ...prev,
          city: primary.city || user.city || 'Mumbai',
          theatreName: primary.name || `${user.name}'s Cineplex`,
        }));
      }

      setMovies(Array.isArray(movieRes.data) ? movieRes.data : []);
      setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user, token]);

  const handleUpdateTheatre = async (e) => {
    e.preventDefault();
    if (!selectedTheatre) return;
    try {
      const updatedAmenities = theatreForm.amenities.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.put(
        `/theatres/${selectedTheatre._id}`,
        {
          ...theatreForm,
          amenities: updatedAmenities,
        },
        authHeaders()
      );
      setSelectedTheatre(res.data);
      setStatusMsg('Theater details updated successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
      loadAllData();
    } catch {
      setStatusMsg('Failed to update theater profile.');
    }
  };

  const handleAddScreen = async (e) => {
    e.preventDefault();
    if (!selectedTheatre) return;
    try {
      const newScreen = {
        name: screenForm.name,
        capacity: Number(screenForm.capacity),
        rows: Number(screenForm.rows),
        cols: Number(screenForm.cols),
        seatTiers: [
          { name: 'VIP Recliner', price: Number(screenForm.vipPrice), rows: ['A', 'B'] },
          { name: 'Standard', price: Number(screenForm.stdPrice), rows: ['C', 'D', 'E', 'F', 'G', 'H'] },
        ],
      };

      const updatedScreens = [...(selectedTheatre.screens || []), newScreen];
      const res = await api.put(`/theatres/${selectedTheatre._id}`, { screens: updatedScreens }, authHeaders());
      setSelectedTheatre(res.data);
      setStatusMsg(`Screen "${screenForm.name}" added successfully!`);
      setTimeout(() => setStatusMsg(''), 3000);
      loadAllData();
    } catch {
      setStatusMsg('Failed to add screen.');
    }
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        '/movies',
        {
          ...movieForm,
          duration: Number(movieForm.duration),
          theatreName: selectedTheatre?.name || movieForm.theatreName,
          city: selectedTheatre?.city || movieForm.city,
          showtimes: [
            {
              time: movieForm.showtime,
              price: Number(movieForm.ticketPrice),
              availableSeats: Number(movieForm.capacity),
              screen: movieForm.screen,
              bookedSeats: [],
            },
          ],
        },
        authHeaders()
      );
      setMovieForm({
        ...defaultMovieForm,
        city: selectedTheatre?.city || 'Mumbai',
        theatreName: selectedTheatre?.name || '',
      });
      setStatusMsg('Movie screening added successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
      loadAllData();
    } catch {
      setStatusMsg('Failed to add movie screening.');
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Are you sure you want to remove this movie screening?')) return;
    try {
      await api.delete(`/movies/${id}`, authHeaders());
      setStatusMsg('Movie screening removed.');
      setTimeout(() => setStatusMsg(''), 3000);
      loadAllData();
    } catch {
      setStatusMsg('Failed to delete movie.');
    }
  };

  // Calculations
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalBookedSeats = bookings.reduce((sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : 1), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Theater Operations Center
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Live Admin Sync
              </span>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">
              {selectedTheatre?.name || `${user?.name}'s Cinema Hub`}
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Manage screen halls, publish movie showtimes, configure seat maps & pricing, and track box-office ticket revenues.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm font-medium text-indigo-200 animate-in fade-in">
          {statusMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/90 p-2 shadow-glass">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'theatre', label: '🏢 Theater & Screens' },
          { id: 'movies', label: '🎬 Movies & Showtimes' },
          { id: 'seats', label: '🪑 Seat Map Config' },
          { id: 'bookings', label: '🎟️ Bookings & Tickets' },
          { id: 'revenue', label: '💰 Revenue Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Active Screenings</p>
              <p className="mt-3 text-3xl font-bold text-white">{movies.length}</p>
              <p className="mt-1 text-xs text-indigo-400">Scheduled on screens</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Screens</p>
              <p className="mt-3 text-3xl font-bold text-white">{selectedTheatre?.screens?.length || 2}</p>
              <p className="mt-1 text-xs text-emerald-400">Halls configured</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Tickets Sold</p>
              <p className="mt-3 text-3xl font-bold text-white">{totalBookedSeats}</p>
              <p className="mt-1 text-xs text-purple-400">{bookings.length} Orders</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total Revenue</p>
              <p className="mt-3 text-3xl font-bold text-emerald-400">₹{totalRevenue.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-400">Box office earnings</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Screenings List */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass">
              <h2 className="text-lg font-semibold text-white">Current Movie Screenings</h2>
              <div className="mt-4 space-y-3">
                {movies.length ? (
                  movies.map((m) => (
                    <div key={m._id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                      <div>
                        <p className="font-semibold text-white">{m.title}</p>
                        <p className="text-xs text-slate-400">{m.genre} • {m.duration} mins • {m.city}</p>
                      </div>
                      <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300">
                        {m.showtimes?.[0]?.time || '7:00 PM'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No active movie screenings added yet.</p>
                )}
              </div>
            </div>

            {/* Quick Bookings Summary */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass">
              <h2 className="text-lg font-semibold text-white">Recent Box Office Bookings</h2>
              <div className="mt-4 space-y-3">
                {bookings.length ? (
                  bookings.slice(0, 5).map((b) => (
                    <div key={b._id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                      <div>
                        <p className="font-semibold text-white">{b.movie?.title || 'Movie Booking'}</p>
                        <p className="text-xs text-slate-400">{b.seats?.map((s) => s.seatNumber || s).join(', ') || 'Seats booked'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">₹{b.totalPrice}</p>
                        <p className="text-[10px] text-slate-400">{b.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No customer bookings recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THEATER & SCREENS */}
      {activeTab === 'theatre' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Theater Profile Form */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-4">
            <h2 className="text-xl font-semibold text-white">Theater Profile Management</h2>
            <form onSubmit={handleUpdateTheatre} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">Theater Name</label>
                <input
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">City</label>
                  <input
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Address</label>
                  <input
                    value={theatreForm.address}
                    onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Amenities (Comma separated)</label>
                <input
                  value={theatreForm.amenities}
                  onChange={(e) => setTheatreForm({ ...theatreForm, amenities: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Description</label>
                <textarea
                  value={theatreForm.description}
                  onChange={(e) => setTheatreForm({ ...theatreForm, description: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  rows={3}
                />
              </div>
              <button type="submit" className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
                Save Theater Profile
              </button>
            </form>
          </div>

          {/* Add Screen Form & Screen List */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-4">
              <h2 className="text-xl font-semibold text-white">Add New Cinema Screen / Audi</h2>
              <form onSubmit={handleAddScreen} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    value={screenForm.name}
                    onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                    placeholder="Screen Name (e.g. Screen 3 IMAX)"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={screenForm.rows}
                    onChange={(e) => setScreenForm({ ...screenForm, rows: e.target.value })}
                    placeholder="Rows (e.g. 8)"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={screenForm.cols}
                    onChange={(e) => setScreenForm({ ...screenForm, cols: e.target.value })}
                    placeholder="Cols (e.g. 10)"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={screenForm.vipPrice}
                    onChange={(e) => setScreenForm({ ...screenForm, vipPrice: e.target.value })}
                    placeholder="VIP Price (₹)"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={screenForm.stdPrice}
                    onChange={(e) => setScreenForm({ ...screenForm, stdPrice: e.target.value })}
                    placeholder="Standard Price (₹)"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  />
                </div>
                <button type="submit" className="col-span-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500">
                  Add Screen
                </button>
              </form>
            </div>

            {/* Configured Screens */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-3">
              <h3 className="text-lg font-semibold text-white">Configured Screens ({selectedTheatre?.screens?.length || 0})</h3>
              {selectedTheatre?.screens?.map((sc, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-slate-950/70 p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">{sc.name}</p>
                    <p className="text-xs text-slate-400">Capacity: {sc.capacity || sc.rows * sc.cols} seats ({sc.rows || 8}x{sc.cols || 10} grid)</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 font-medium">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MOVIES & SHOWTIMES */}
      {activeTab === 'movies' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add Screening Form */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-4">
            <h2 className="text-xl font-semibold text-white">Publish New Movie Screening</h2>
            <form onSubmit={handleAddMovie} className="grid grid-cols-2 gap-3">
              <input
                value={movieForm.title}
                onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                placeholder="Movie Title"
                className="col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
              <input
                value={movieForm.genre}
                onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                placeholder="Genre (e.g. Action, Sci-Fi)"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
              <input
                value={movieForm.language}
                onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                placeholder="Language"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
              <input
                type="number"
                value={movieForm.duration}
                onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                placeholder="Duration (minutes)"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              />
              <input
                value={movieForm.showtime}
                onChange={(e) => setMovieForm({ ...movieForm, showtime: e.target.value })}
                placeholder="Showtime (e.g. 07:00 PM)"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
              <input
                type="number"
                value={movieForm.ticketPrice}
                onChange={(e) => setMovieForm({ ...movieForm, ticketPrice: e.target.value })}
                placeholder="Ticket Base Price (₹)"
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                required
              />
              <select
                value={movieForm.screen}
                onChange={(e) => setMovieForm({ ...movieForm, screen: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              >
                {selectedTheatre?.screens?.map((sc, idx) => (
                  <option key={idx} value={sc.name}>
                    {sc.name}
                  </option>
                )) || <option value="Screen 1">Screen 1</option>}
              </select>
              <textarea
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                placeholder="Synopsis / Description"
                className="col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                rows={3}
                required
              />
              <button type="submit" className="col-span-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500">
                Publish Movie & Showtime
              </button>
            </form>
          </div>

          {/* Active Movie Listings */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-4">
            <h2 className="text-xl font-semibold text-white">Scheduled Movies ({movies.length})</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {movies.map((m) => (
                <div key={m._id} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{m.title}</h3>
                      <p className="text-xs text-slate-400">{m.genre} • {m.language} • {m.duration} mins</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMovie(m._id)}
                      className="rounded-full bg-rose-500/20 px-3 py-1 text-xs text-rose-300 hover:bg-rose-500/30"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {m.showtimes?.map((st, i) => (
                      <span key={i} className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                        {st.screen || 'Screen 1'}: {st.time} (₹{st.price})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEAT MAP CONFIG */}
      {activeTab === 'seats' && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Interactive Seat Map Preview & Tier Pricing</h2>
            <p className="text-sm text-slate-400">Preview seat layout grid for customer seat selection.</p>
          </div>

          {/* Cinema Screen Banner */}
          <div className="relative mx-auto max-w-xl text-center py-4">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.4em] text-indigo-300">CINEMA SCREEN THIS WAY</p>
          </div>

          {/* Seat Grid Preview */}
          <div className="mx-auto max-w-2xl space-y-2 overflow-x-auto py-4">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row) => (
              <div key={row} className="flex items-center justify-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-slate-400">{row}</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                    const isVip = ['A', 'B'].includes(row);
                    return (
                      <div
                        key={col}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition ${
                          isVip
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200'
                        }`}
                        title={`${row}${col} (${isVip ? 'VIP Recliner ₹350' : 'Standard ₹250'})`}
                      >
                        {col}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-amber-500/20 border border-amber-500/40" />
              <span>VIP Recliner Tier (₹350)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-indigo-500/15 border border-indigo-500/30" />
              <span>Standard Tier (₹250)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-4">
          <h2 className="text-xl font-semibold text-white">Movie Ticket Bookings ({bookings.length})</h2>
          <div className="space-y-3">
            {bookings.length ? (
              bookings.map((b) => (
                <div key={b._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                      ID: {b._id.slice(-6).toUpperCase()}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-white">{b.movie?.title || 'Movie Screening'}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Customer: {b.user?.name || 'Guest'} ({b.user?.email || 'N/A'}) • Date: {new Date(b.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-indigo-300 font-mono mt-1">
                      Seats: {Array.isArray(b.seats) ? b.seats.map((s) => s.seatNumber || s).join(', ') : 'Allocated'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-400">₹{b.totalPrice}</p>
                    <span className="inline-block mt-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {b.status || 'Confirmed'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No ticket bookings recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: REVENUE */}
      {activeTab === 'revenue' && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glass space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Theater Financial & Revenue Report</h2>
              <p className="text-xs text-slate-400">Detailed breakdown of tickets sold and gross box office earnings.</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-slate-400">Total Revenue</p>
              <p className="text-3xl font-bold text-emerald-400">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Average Ticket Price</p>
              <p className="text-2xl font-bold text-white">
                ₹{totalBookedSeats ? Math.round(totalRevenue / totalBookedSeats) : 250}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Total Orders Processed</p>
              <p className="text-2xl font-bold text-white">{bookings.length}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Occupancy Efficiency</p>
              <p className="text-2xl font-bold text-indigo-400">84%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TheatreOwnerDashboardPage;
