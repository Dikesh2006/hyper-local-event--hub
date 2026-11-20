import React from 'react';
import { useNavigate } from 'react-router-dom';

const TicketModal = ({ booking, onClose }) => {
  const navigate = useNavigate();

  if (!booking) return null;

  const isMovie = Boolean(booking.movie);
  const isEvent = Boolean(booking.event);
  const isManager = Boolean(booking.manager);
  const title =
    booking.movie?.title ||
    booking.event?.title ||
    booking.hall?.name ||
    (booking.manager ? `Event Manager: ${booking.manager.name}` : 'Admission Pass');
  const venue =
    booking.movie?.theatreName ||
    booking.event?.venue ||
    booking.hall?.address ||
    (booking.manager ? `City: ${booking.manager.city}` : 'City Venue');
  const city = booking.movie?.city || booking.event?.city || booking.hall?.city || booking.manager?.city || '';
  const dateStr = booking.date ? new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : 'Today';
  const showtimeStr = booking.showtime || (isEvent ? booking.event?.time : '07:00 PM') || '07:00 PM';
  const seatsList = (booking.seats || []).map((s) => (typeof s === 'string' ? s : s.seatNumber)).join(', ');
  const ticketId = booking.ticketId || `TKT-${booking._id?.slice(-8).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="text-center pb-4 border-b border-dashed border-white/10">
          <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-300">
            {isMovie ? '🎬 Cinema E-Ticket' : isEvent ? '🎟️ Event Pass' : isManager ? '👔 Manager Hire Confirmed' : '🏛️ Venue Booking'}
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-white">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {venue} {city ? `• ${city}` : ''}
          </p>
        </div>

        {/* Ticket Details Grid */}
        <div className="my-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl bg-slate-950/60 p-3 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
            <span className="font-semibold text-white mt-1 block">{dateStr}</span>
          </div>

          <div className="rounded-2xl bg-slate-950/60 p-3 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Show Time</span>
            <span className="font-semibold text-indigo-300 mt-1 block">{showtimeStr}</span>
          </div>

          <div className="rounded-2xl bg-slate-950/60 p-3 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Seats / Passes</span>
            <span className="font-semibold text-white mt-1 block truncate" title={seatsList || 'Standard'}>
              {seatsList || (booking.seats?.length ? `${booking.seats.length} Passes` : '1 Ticket')}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950/60 p-3 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
            <span className="font-bold text-emerald-400 mt-1 block text-sm">₹{booking.totalPrice}</span>
          </div>
        </div>

        {/* QR Code Verification Section */}
        <div className="rounded-2xl bg-white p-4 text-center text-slate-900 shadow-inner">
          <div className="flex justify-center">
            {booking.qrCodeUrl ? (
              <img
                src={booking.qrCodeUrl}
                alt={`QR code for ticket ${ticketId}`}
                className="h-44 w-44 object-contain rounded-lg"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] font-mono font-bold tracking-wider text-slate-800">
            {ticketId}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Scan at gate turnstile for fast-track entry
          </p>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Booking Confirmed & Verified
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <span>🖨️ Print Ticket</span>
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/user/bookings');
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
          >
            <span>My Bookings 🎟️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
