import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../api/api';
import TicketModal from '../components/TicketModal';
import AnimatedReveal from '../components/AnimatedReveal';

const EventsPage = () => {
  const { user, authHeaders } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlEventId = searchParams.get('eventId');

  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    const url = category === 'all' ? '/events' : `/events?category=${category}`;
    api
      .get(url)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setEvents(list);

        // If URL requested a specific event, pre-open its booking modal
        if (urlEventId) {
          const matched = list.find((e) => e._id === urlEventId);
          if (matched) {
            setSelectedEvent(matched);
            setTicketQuantity(1);
          }
        }
      })
      .catch(() => setEvents([]));
  }, [category, urlEventId]);

  const handleOpenBooking = (event) => {
    setSelectedEvent(event);
    setTicketQuantity(1);
    setBookingError('');
    setConfirmedBooking(null);
  };

  const handleCloseBooking = () => {
    setSelectedEvent(null);
    setBookingError('');
  };

  const calculateTotal = () => {
    if (!selectedEvent) return 0;
    return (selectedEvent.ticketPrice || 0) * ticketQuantity;
  };

  const handleProceedToPayment = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const bookingDetails = {
      type: 'event',
      eventId: selectedEvent._id,
      title: selectedEvent.title,
      venue: selectedEvent.venue || 'City Arena',
      city: selectedEvent.city,
      date: selectedEvent.startDate,
      showtime: selectedEvent.time || '07:00 PM',
      seats: Array.from({ length: ticketQuantity }).map((_, idx) => ({
        seatNumber: `Pass ${idx + 1}`,
        price: selectedEvent.ticketPrice,
        tier: 'General Admission',
      })),
      totalPrice: calculateTotal(),
    };

    navigate('/payment', { state: { bookingDetails } });
  };

  const handleQuickBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (paymentMethod === 'Razorpay') {
      handleProceedToPayment();
      return;
    }

    setBookingError('');
    setIsProcessing(true);

    try {
      const payload = {
        eventId: selectedEvent._id,
        date: selectedEvent.startDate || new Date(),
        showtime: selectedEvent.time || '07:00 PM',
        seats: Array.from({ length: ticketQuantity }).map((_, idx) => ({
          seatNumber: `Pass ${idx + 1}`,
          price: selectedEvent.ticketPrice,
          tier: 'General Admission',
        })),
        totalPrice: calculateTotal(),
        paymentMethod,
      };

      const res = await api.post('/bookings', payload, authHeaders());
      setConfirmedBooking(res.data);
      setShowTicketModal(true);
      setSelectedEvent(null);

      // Refresh events to update available seats
      const refreshed = await api.get('/events');
      setEvents(Array.isArray(refreshed.data) ? refreshed.data : []);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Event booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 shadow-glass backdrop-blur-xl">
        <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
          City Live Experiences
        </span>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">Browse Events & Live Passes</h1>
        <p className="mt-2 max-w-2xl text-slate-300 text-sm">
          Discover high-energy concerts, stand-up comedy nights, tournaments, and local carnivals. Secure instant verified digital passes.
        </p>
      </AnimatedReveal>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-slate-900/80 p-5 shadow-glass border border-white/10">
        <div className="flex flex-wrap gap-2.5">
          {['all', 'concert', 'sports', 'comedy', 'college', 'festival'].map((option) => (
            <button
              key={option}
              onClick={() => setCategory(option)}
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                category === option ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Showing {events.length} {category === 'all' ? 'active' : category} events
        </span>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {events.length ? (
          events.map((event) => (
            <div
              key={event._id}
              className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-glass transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      {event.category || 'Event'}
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-white">{event.title}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pass</span>
                    <span className="text-xl font-extrabold text-emerald-400">₹{event.ticketPrice}</span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-300 line-clamp-3">{event.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400 border-t border-white/5 pt-3">
                  <span>📍 {event.venue || 'City Arena'}, {event.city}</span>
                  <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                  <span>⏰ {event.time || '07:00 PM'}</span>
                  <span>🎟️ {event.seatsAvailable ?? 200} tickets left</span>
                </div>
              </div>

              {/* Book Button */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    ● Instant QR Ticket on checkout
                  </span>
                </div>
                <button
                  onClick={() => handleOpenBooking(event)}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95"
                >
                  Book Tickets Now →
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-[2rem] bg-slate-900/80 p-8 text-slate-400 col-span-2 text-center">
            No events found in this category.
          </p>
        )}
      </div>

      {/* Event Booking Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl">
            <button
              onClick={handleCloseBooking}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Event Pass Checkout
            </span>
            <h2 className="mt-2 text-2xl font-bold text-white">{selectedEvent.title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              📍 {selectedEvent.venue}, {selectedEvent.city} • 📅 {new Date(selectedEvent.startDate).toLocaleDateString()} at {selectedEvent.time || '07:00 PM'}
            </p>

            {/* Quantity Selector */}
            <div className="mt-6 rounded-2xl bg-slate-950/80 p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Number of Passes:</span>
                <div className="flex items-center gap-3">
                  <button
                    disabled={ticketQuantity <= 1}
                    onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-lg bg-slate-800 text-sm font-bold text-white disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-white">{ticketQuantity}</span>
                  <button
                    disabled={ticketQuantity >= (selectedEvent.seatsAvailable || 10)}
                    onClick={() => setTicketQuantity((q) => Math.min(10, q + 1))}
                    className="h-8 w-8 rounded-lg bg-slate-800 text-sm font-bold text-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                <span>Pass Price: ₹{selectedEvent.ticketPrice} each</span>
                <span className="text-emerald-400 font-semibold">{selectedEvent.seatsAvailable ?? 200} available</span>
              </div>
            </div>

            {/* Total Price */}
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950/80 p-4 border border-white/5">
              <span className="text-sm text-slate-300">Total Payable Amount:</span>
              <span className="text-2xl font-extrabold text-emerald-400">₹{calculateTotal()}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-4 space-y-2">
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
                        : 'bg-slate-950/80 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {bookingError && (
              <div className="mt-3 rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-200">
                {bookingError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                disabled={isProcessing}
                onClick={handleQuickBook}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white transition hover:opacity-95 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isProcessing ? 'Generating Passes...' : user ? `Pay & Generate Ticket (₹${calculateTotal()})` : 'Login to Confirm Pass'}
              </button>

              <button
                disabled={isProcessing}
                onClick={handleProceedToPayment}
                className="rounded-xl border border-indigo-500/50 bg-indigo-600/30 py-3 text-xs font-bold text-indigo-200 transition hover:bg-indigo-600/50"
              >
                Go to Checkout Page →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Ticket Modal */}
      {showTicketModal && confirmedBooking && (
        <TicketModal
          booking={confirmedBooking}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
};

export default EventsPage;
