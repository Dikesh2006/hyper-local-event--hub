import { useEffect, useState } from 'react';
import api from '../../api/api';
import UserLayout from '../../components/layouts/UserLayout';

const UserEventsPage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events').then((res) => setEvents(Array.isArray(res.data) ? res.data : [])).catch(() => setEvents([]));
  }, []);

  return (
    <UserLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Upcoming events</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.length ? events.map((event) => (
            <div key={event._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{event.title}</p>
              <p className="mt-2 text-sm text-slate-400">{event.description}</p>
              <p className="mt-3 text-sm text-indigo-300">{event.city} • {event.venue}</p>
            </div>
          )) : <p className="text-sm text-slate-400">No events available.</p>}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserEventsPage;
