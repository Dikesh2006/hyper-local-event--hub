import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import ManagerLayout from '../../components/layouts/ManagerLayout';

const ManagerEventsPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/events').then((res) => setEvents(Array.isArray(res.data) ? res.data : [])).catch(() => setEvents([]));
  }, [user, token]);

  return (
    <ManagerLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage your events</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <div key={event._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{event.title}</p>
              <p className="mt-2 text-sm text-slate-400">{event.description}</p>
              <p className="mt-2 text-sm text-amber-300">{event.city}</p>
            </div>
          ))}
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerEventsPage;
