import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import ManagerLayout from '../../components/layouts/ManagerLayout';

const ManagerBookingsPage = () => {
  const { token, authHeaders } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/bookings', authHeaders()).then((res) => setBookings(res.data)).catch(() => setBookings([]));
  }, [token]);

  return (
    <ManagerLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage bookings</h2>
        <div className="mt-6 grid gap-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{booking.movie?.title || booking.event?.title || 'Booking'}</p>
              <p className="mt-2 text-sm text-slate-400">{booking.status}</p>
            </div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerBookingsPage;
