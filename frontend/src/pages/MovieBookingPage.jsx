import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../api/api';
import AnimatedReveal from '../components/AnimatedReveal';
import TicketModal from '../components/TicketModal';

const MovieBookingPage = () => {
  const { user, authHeaders } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlMovieId = searchParams.get('movieId');

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Credit / Debit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/movies'), api.get('/theatres/public')])
      .then(([movieRes, theatreRes]) => {
        const fetchedMovies = Array.isArray(movieRes.data) ? movieRes.data : [];
        setMovies(fetchedMovies);
        setTheatres(Array.isArray(theatreRes.data) ? theatreRes.data : []);

        if (fetchedMovies.length > 0) {
          // If a movie ID is in the query params, auto-select it
          const matched = urlMovieId ? fetchedMovies.find((m) => m._id === urlMovieId) : null;
          const targetMovie = matched || fetchedMovies[0];
          setSelectedMovie(targetMovie);
          if (targetMovie.showtimes?.length) {
            setSelectedShowtime(targetMovie.showtimes[0]);
          }
        }
      })
      .catch(() => {
        setMovies([]);
        setTheatres([]);
      })
      .finally(() => setLoading(false));
  }, [urlMovieId]);

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setSelectedShowtime(movie.showtimes?.[0] || null);
    setSelectedSeats([]);
    setBookingStatus('');
    setBookingError('');
    setConfirmedBooking(null);
  };

  const handleSeatClick = (seatNumber) => {
    if (selectedShowtime?.bookedSeats?.includes(seatNumber)) return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const calculateSeatPrice = (seatNumber) => {
    const row = seatNumber.charAt(0);
    const basePrice = selectedShowtime?.price || 250;
    if (['A', 'B'].includes(row)) return basePrice + 100; // VIP Tier
    return basePrice;
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + calculateSeatPrice(seat), 0);

  const handleProceedToPayment = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedSeats.length) {
      setBookingError('Please select at least one seat to proceed.');
      return;
    }

    // Navigate to /payment with state so user can experience full checkout flow
    const bookingDetails = {
      type: 'movie',
      movieId: selectedMovie._id,
      title: selectedMovie.title,
      venue: selectedMovie.theatreName || 'Cineplex Arena',
      city: selectedMovie.city,
      showtimeId: selectedShowtime?._id,
      showtime: selectedShowtime?.time || '07:00 PM',
      date: new Date(),
      seats: selectedSeats.map((s) => ({
        seatNumber: s,
        price: calculateSeatPrice(s),
        tier: ['A', 'B'].includes(s.charAt(0)) ? 'VIP Recliner' : 'Standard',
      })),
      totalPrice,
    };

    navigate('/payment', { state: { bookingDetails } });
  };

  const handleQuickBookNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedSeats.length) {
      setBookingError('Please select at least one seat to proceed.');
      return;
    }

    if (paymentMethod === 'Razorpay') {
      handleProceedToPayment();
      return;
    }

    setBookingError('');
    setIsProcessing(true);
    setBookingStatus('Processing secure checkout & generating verified QR ticket...');

    try {
      const payload = {
        movieId: selectedMovie._id,
        showtimeId: selectedShowtime?._id,
        showtime: selectedShowtime?.time || '07:00 PM',
        date: new Date(),
        seats: selectedSeats.map((s) => ({
          seatNumber: s,
          price: calculateSeatPrice(s),
          tier: ['A', 'B'].includes(s.charAt(0)) ? 'VIP Recliner' : 'Standard',
        })),
        totalPrice,
        paymentMethod,
      };

      const res = await api.post('/bookings', payload, authHeaders());
      setConfirmedBooking(res.data);
      setShowTicketModal(true);
      setBookingStatus('🎉 Booking confirmed successfully! Ticket generated.');
      setSelectedSeats([]);

      // Refresh movie showtimes to reflect new booked seats immediately
      const refreshedMovies = await api.get('/movies');
      setMovies(refreshedMovies.data);
      const updatedSelected = refreshedMovies.data.find((m) => m._id === selectedMovie._id);
      if (updatedSelected) {
        setSelectedMovie(updatedSelected);
        const updatedSt = updatedSelected.showtimes?.find((s) => s.time === selectedShowtime?.time);
        setSelectedShowtime(updatedSt || updatedSelected.showtimes?.[0] || null);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Selected seats may already be taken.');
      setBookingStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredMovies = selectedCity === 'All' ? movies : movies.filter((m) => m.city?.toLowerCase() === selectedCity.toLowerCase());
  const cities = ['All', ...new Set(movies.map((m) => m.city).filter(Boolean))];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Hyper Local Cinema Hub
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">Movie Ticket Booking</h1>
            <p className="mt-2 max-w-2xl text-slate-300 text-sm">
              Browse blockbusters, select theater venues, choose showtimes, and book interactive seat maps in real time.
            </p>
          </div>

          {/* City Selector Filter */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-medium pl-2">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer pr-4"
            >
              {cities.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AnimatedReveal>

      {/* Main Grid Layout */}
      <div className="grid gap-8 xl:grid-cols-[1.2fr_1.8fr]">
        {/* Left Column: Movie Catalog */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Now Showing ({filteredMovies.length})</h2>
          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
            {filteredMovies.map((movie) => {
              const isSelected = selectedMovie?._id === movie._id;
              return (
                <div
                  key={movie._id}
                  onClick={() => handleMovieSelect(movie)}
                  className={`cursor-pointer rounded-[2rem] border p-5 transition-all duration-300 shadow-glass ${
                    isSelected
                      ? 'border-indigo-500/80 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-slate-900/90 shadow-indigo-500/10'
                      : 'border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{movie.title}</h3>
                      <p className="mt-1 text-xs font-medium text-indigo-300">
                        {movie.genre || 'Action'} • {movie.language || 'English'} • {movie.duration || 120} mins
                      </p>
                      <p className="mt-2 text-xs text-slate-400 line-clamp-2">{movie.description}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
                      ★ {movie.rating || 4.2}
                    </span>
                  </div>

                  {/* Theater & Showtimes Pill List */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">📍 {movie.theatreName || 'Cineplex Arena'} • {movie.city || 'Mumbai'}</span>
                    <span className="text-xs font-semibold text-indigo-400">
                      From ₹{movie.showtimes?.[0]?.price || 250}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Showtime & Interactive Seat Map */}
        <div className="space-y-6">
          {selectedMovie ? (
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-6 md:p-8 shadow-glass space-y-6">
              {/* Selected Movie Summary Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedMovie.title}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedMovie.theatreName || 'Main Cineplex'} • {selectedMovie.city}
                  </p>
                </div>
                {/* Date Picker Buttons */}
                <div className="flex gap-2">
                  {['Today', 'Tomorrow', 'Day After'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        selectedDate === d ? 'bg-indigo-600 text-white' : 'bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Showtimes Selector */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select Showtime & Screen</p>
                <div className="flex flex-wrap gap-3">
                  {(selectedMovie.showtimes?.length ? selectedMovie.showtimes : [{ time: '07:00 PM', price: 250, screen: 'Screen 1' }]).map((st, idx) => {
                    const isStSelected = selectedShowtime?.time === st.time;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedShowtime(st);
                          setSelectedSeats([]);
                          setBookingError('');
                        }}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          isStSelected
                            ? 'border-indigo-500 bg-indigo-600/30 text-white ring-2 ring-indigo-500/50'
                            : 'border-white/10 bg-slate-950/70 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <p className="text-sm font-bold text-white">{st.time}</p>
                        <p className="text-[10px] text-slate-400">{st.screen || 'Screen 1'} • ₹{st.price || 250}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Seat Map */}
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-6">
                {/* Cinema Screen Indicator */}
                <div className="relative mx-auto max-w-md text-center">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.9)]" />
                  <p className="mt-2 text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-bold">ALL EYES THIS WAY • CINEMA SCREEN</p>
                </div>

                {/* Seat Grid Layout */}
                <div className="mx-auto max-w-lg space-y-2 overflow-x-auto py-2">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row) => (
                    <div key={row} className="flex items-center justify-center gap-2">
                      <span className="w-5 text-center text-xs font-bold text-slate-400">{row}</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                          const seatNo = `${row}${col}`;
                          const isBooked = selectedShowtime?.bookedSeats?.includes(seatNo);
                          const isSelected = selectedSeats.includes(seatNo);
                          const isVip = ['A', 'B'].includes(row);

                          return (
                            <button
                              key={col}
                              disabled={isBooked}
                              onClick={() => handleSeatClick(seatNo)}
                              title={isBooked ? `${seatNo} (Already Booked)` : `${seatNo} (${isVip ? 'VIP ₹350' : 'Std ₹250'})`}
                              className={`h-7 w-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center ${
                                isBooked
                                  ? 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)] scale-110'
                                  : isVip
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/40'
                                  : 'bg-slate-800/80 border border-white/10 text-slate-200 hover:bg-white/20'
                              }`}
                            >
                              {isBooked ? '✕' : col}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Seat Legend */}
                <div className="flex flex-wrap justify-center gap-4 text-[11px] text-slate-300 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-slate-800/80 border border-white/10" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-amber-500/20 border border-amber-500/40" />
                    <span>VIP Recliner (+₹100)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-indigo-600 border border-indigo-400" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-slate-800 text-slate-600 border border-slate-700" />
                    <span>Occupied</span>
                  </div>
                </div>
              </div>

              {/* Order Summary & Confirm Action */}
              <div className="rounded-3xl bg-slate-950/90 p-5 space-y-4 border border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Selected Seats:</span>
                  <span className="font-bold text-white">
                    {selectedSeats.length ? selectedSeats.join(', ') : 'None'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Ticket Price:</span>
                  <span className="text-2xl font-bold text-emerald-400">₹{totalPrice}</span>
                </div>

                {/* Payment Option Selector */}
                {selectedSeats.length > 0 && !confirmedBooking && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">Select Payment Method:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['UPI', 'Credit / Debit Card', 'Net Banking', 'Razorpay'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-xl px-2.5 py-2 text-xs font-medium transition ${
                            paymentMethod === method
                              ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-200">
                    {bookingError}
                  </div>
                )}

                {bookingStatus && (
                  <div className="rounded-xl bg-indigo-500/20 border border-indigo-500/40 p-3 text-xs text-indigo-200">
                    {bookingStatus}
                  </div>
                )}

                {confirmedBooking ? (
                  <div className="space-y-3 pt-2">
                    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                      <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">🎉 Ticket Generated & Confirmed</p>
                      <p className="text-lg font-mono font-bold text-white mt-1">
                        {confirmedBooking.ticketId || `ID: ${confirmedBooking._id?.slice(-8).toUpperCase()}`}
                      </p>
                      {confirmedBooking.qrCodeUrl && (
                        <div className="mt-3 flex justify-center">
                          <img
                            src={confirmedBooking.qrCodeUrl}
                            alt="Ticket QR Code"
                            className="h-36 w-36 rounded-xl border border-white/20 bg-white p-2 shadow-lg"
                          />
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-300">
                        {confirmedBooking.movie?.title || selectedMovie.title} • {confirmedBooking.showtime || selectedShowtime?.time}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Seats: {confirmedBooking.seats?.map((s) => s.seatNumber).join(', ')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowTicketModal(true)}
                        className="rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg"
                      >
                        View Full Digital Ticket
                      </button>
                      <button
                        onClick={() => navigate('/user/bookings')}
                        className="rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg"
                      >
                        Open My Bookings
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        disabled={!selectedSeats.length || isProcessing}
                        onClick={handleQuickBookNow}
                        className={`rounded-2xl py-3.5 text-xs font-bold transition shadow-lg ${
                          selectedSeats.length && !isProcessing
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95 shadow-emerald-600/30'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isProcessing
                          ? 'Generating Ticket...'
                          : user
                          ? `Pay & Confirm (₹${totalPrice})`
                          : 'Log in to Confirm'}
                      </button>

                      <button
                        disabled={!selectedSeats.length || isProcessing}
                        onClick={handleProceedToPayment}
                        className={`rounded-2xl py-3.5 text-xs font-bold transition border border-indigo-500/50 ${
                          selectedSeats.length && !isProcessing
                            ? 'bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50'
                            : 'bg-slate-900 text-slate-600 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        Go to Checkout Page →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-8 text-center text-slate-400">
              Select a movie from the catalog to view showtimes and choose seats.
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && confirmedBooking && (
        <TicketModal
          booking={confirmedBooking}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
};

export default MovieBookingPage;
