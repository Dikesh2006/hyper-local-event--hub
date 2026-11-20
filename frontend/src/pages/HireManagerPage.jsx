import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import AuthContext from '../context/AuthContext';
import AnimatedReveal from '../components/AnimatedReveal';
import TicketModal from '../components/TicketModal';

const HireManagerPage = () => {
  const { user, authHeaders } = useContext(AuthContext);
  const navigate = useNavigate();

  const [managers, setManagers] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hire Form State
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [eventType, setEventType] = useState('Wedding Celebration');
  const [eventVenue, setEventVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hireError, setHireError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [contactModalManager, setContactModalManager] = useState(null);

  useEffect(() => {
    setLoading(true);
    const queryParams = [];
    if (selectedCity !== 'All') queryParams.push(`city=${encodeURIComponent(selectedCity)}`);
    if (searchQuery.trim()) queryParams.push(`search=${encodeURIComponent(searchQuery.trim())}`);
    const url = `/managers${queryParams.length ? `?${queryParams.join('&')}` : ''}`;

    api
      .get(url)
      .then((res) => setManagers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setManagers([]))
      .finally(() => setLoading(false));
  }, [selectedCity, searchQuery]);

  const handleOpenHireModal = (manager) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedManager(manager);
    setEventVenue(`Grand Venue, ${manager.city}`);
    setHireError('');
  };

  const handleCloseHireModal = () => {
    setSelectedManager(null);
    setHireError('');
  };

  // 1. Proceed to /payment checkout flow (supports Razorpay test gateway)
  const handleProceedToPayment = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedManager) return;

    const bookingDetails = {
      type: 'manager',
      managerId: selectedManager._id,
      title: `Event Manager Hire: ${selectedManager.name}`,
      venue: eventVenue || `City: ${selectedManager.city}`,
      city: selectedManager.city,
      date: new Date(eventDate),
      showtime: eventType,
      seats: [
        {
          seatNumber: 'Lead Event Manager',
          price: selectedManager.pricePerEvent || 15000,
          tier: selectedManager.expertise || 'Full Event Management',
        },
      ],
      totalPrice: selectedManager.pricePerEvent || 15000,
    };

    handleCloseHireModal();
    navigate('/payment', { state: { bookingDetails } });
  };

  // 2. Direct Quick Hire booking
  const handleQuickHire = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedManager) return;

    if (paymentMethod === 'Razorpay') {
      handleProceedToPayment();
      return;
    }

    setIsProcessing(true);
    setHireError('');

    try {
      const payload = {
        managerId: selectedManager._id,
        date: new Date(eventDate),
        showtime: eventType,
        totalPrice: selectedManager.pricePerEvent || 15000,
        paymentMethod,
        seats: [
          {
            seatNumber: 'Lead Event Manager',
            price: selectedManager.pricePerEvent || 15000,
            tier: selectedManager.expertise || 'Full Event Supervision',
          },
        ],
      };

      const res = await api.post('/bookings', payload, authHeaders());
      setConfirmedBooking(res.data);
      handleCloseHireModal();
      setShowTicketModal(true);
    } catch (err) {
      setHireError(err.response?.data?.message || 'Failed to submit hire booking request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cities = ['All', 'Mumbai', 'Delhi', 'Bhopal', 'Bangalore', 'Pune'];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Verified Event Curators
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">Hire Verified Event Managers</h1>
            <p className="mt-2 max-w-2xl text-slate-300 text-sm">
              Connect with top-rated local managers for weddings, concerts, corporate galas, and outdoor festivals with verified credentials and seamless instant booking.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-950/60 p-3 border border-white/10">
            <span className="text-xl">🏆</span>
            <span className="text-xs font-bold text-slate-300">100% Verified Partners</span>
          </div>
        </div>
      </AnimatedReveal>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-glass">
        {/* City Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                selectedCity === city
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-950'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or expertise..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Managers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-64 rounded-3xl bg-slate-900/60 animate-pulse border border-white/5" />
          ))
        ) : managers.length ? (
          managers.map((manager, index) => (
            <AnimatedReveal key={manager._id} delay={0.08 + index * 0.04} duration={0.5} y={16}>
              <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-glass transition hover:border-indigo-500/50 hover:-translate-y-1 h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={manager.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop'}
                      alt={manager.name}
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{manager.name}</h2>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">📍 {manager.city || 'National'}</p>
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold mt-1">
                        <span>⭐ {manager.rating || 4.9}</span>
                        <span className="text-slate-400 font-normal">({manager.reviewsCount || 42} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {manager.bio || 'Experienced local event manager with verified credentials, specialized equipment, and strong vendor networks.'}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                    <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20">
                      🎯 {manager.expertise || 'Concerts & Weddings'}
                    </span>
                    {manager.experience && (
                      <span className="rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300">
                        ⏳ {manager.experience}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Booking Fee</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      ₹{manager.pricePerEvent || 15000}
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-1">per event</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setContactModalManager(manager)}
                      className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-950 transition"
                      title="Contact Information"
                    >
                      📞
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenHireModal(manager)}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95"
                    >
                      Hire Now →
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedReveal>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-white/10 bg-slate-900/80 p-12 text-center text-slate-400">
            No event managers found matching your search. Try another city or clear the filter.
          </div>
        )}
      </div>

      {/* Hire Booking Modal */}
      {selectedManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 md:p-8 text-white shadow-2xl space-y-6">
            <button
              onClick={handleCloseHireModal}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              ✕
            </button>

            <div>
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300">
                Book Event Manager
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white">Hire {selectedManager.name}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {selectedManager.expertise} • 📍 {selectedManager.city}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Type & Scale</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                >
                  <option value="Wedding Celebration">Wedding Celebration (Multi-day)</option>
                  <option value="Live Music Concert">Live Music Concert / Gig</option>
                  <option value="Corporate Conference">Corporate Conference & Gala</option>
                  <option value="College Festival">College / Youth Festival</option>
                  <option value="Private Birthday / Anniversary">Private Celebration / Birthday</option>
                  <option value="Exhibition & Trade Fair">Exhibition & Trade Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Venue / Event Location</label>
                <input
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g. Grand Ballroom, Fort Road, Mumbai"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Special Requirements or Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell the manager about expected guests, stage setup, audio requirements..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Price Summary */}
              <div className="rounded-2xl bg-slate-950/80 p-4 border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Professional Management Fee:</span>
                  <span className="font-bold text-white">₹{selectedManager.pricePerEvent || 15000}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform Booking Fee:</span>
                  <span className="font-bold text-emerald-400">Included (Free)</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2">
                  <span className="text-white">Total Booking Cost:</span>
                  <span className="text-emerald-400">₹{selectedManager.pricePerEvent || 15000}</span>
                </div>
              </div>

              {/* Payment Method Selector for Quick Hire */}
              <div className="space-y-1.5">
                <span className="text-slate-300 font-semibold block">Select Confirmation Mode:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Razorpay')}
                    className={`rounded-xl p-2.5 text-center font-bold border transition ${
                      paymentMethod === 'Razorpay'
                        ? 'border-indigo-500 bg-indigo-600/30 text-white'
                        : 'border-white/10 bg-slate-950 text-slate-400'
                    }`}
                  >
                    ⚡ Razorpay Checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`rounded-xl p-2.5 text-center font-bold border transition ${
                      paymentMethod === 'UPI'
                        ? 'border-indigo-500 bg-indigo-600/30 text-white'
                        : 'border-white/10 bg-slate-950 text-slate-400'
                    }`}
                  >
                    📱 Direct UPI / Bank
                  </button>
                </div>
              </div>

              {hireError && (
                <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-rose-200">
                  {hireError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="rounded-2xl border border-indigo-500/50 bg-indigo-600/30 py-3 text-xs font-bold text-indigo-200 hover:bg-indigo-600/50 transition"
              >
                Go to Checkout Page →
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleQuickHire}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:opacity-95 transition"
              >
                {isProcessing ? 'Confirming...' : 'Confirm Hire & Issue Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Manager Details Modal */}
      {contactModalManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <button
              onClick={() => setContactModalManager(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl">
                📞
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">{contactModalManager.name}</h3>
              <p className="text-xs text-slate-400">{contactModalManager.expertise}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-emerald-300 font-bold">{contactModalManager.contact || '+91 98765 43210'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-white font-medium">{contactModalManager.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified:</span>
                <span className="text-emerald-400 font-bold">✓ Background Checked</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const mgr = contactModalManager;
                setContactModalManager(null);
                handleOpenHireModal(mgr);
              }}
              className="w-full rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition"
            >
              Proceed to Hire Manager
            </button>
          </div>
        </div>
      )}

      {/* Ticket Modal for Confirmed Hire */}
      {showTicketModal && confirmedBooking && (
        <TicketModal
          booking={confirmedBooking}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
};

export default HireManagerPage;
