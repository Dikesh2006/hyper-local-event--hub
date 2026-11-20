import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminDashboardPage = () => {
  const { user, token, authHeaders } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user) return;
    Promise.all([
      api.get('/admin/analytics', authHeaders()),
      api.get('/users', authHeaders()),
    ])
      .then(([analyticsRes, usersRes]) => {
        setAnalytics(analyticsRes.data);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      })
      .catch(() => {
        setAnalytics(null);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user, token]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/users/${id}/status`, { status }, authHeaders());
      loadData();
    } catch {
      // keep the admin UI stable even if moderation fails
    }
  };

  return (
    <AdminLayout>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Users', value: analytics?.users ?? 0, accent: 'from-indigo-500 to-indigo-400' },
              { label: 'Events', value: analytics?.events ?? 0, accent: 'from-emerald-500 to-emerald-400' },
              { label: 'Bookings', value: analytics?.bookings ?? 0, accent: 'from-amber-500 to-orange-400' },
              { label: 'Halls', value: analytics?.halls ?? 0, accent: 'from-fuchsia-500 to-pink-400' },
            ].map((card) => (
              <div key={card.label} className={`rounded-[1.75rem] bg-gradient-to-br ${card.accent} p-5 shadow-glass`}>
                <p className="text-sm text-slate-100/80">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Manage users</h2>
            <div className="mt-6 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-950/70" />)
              ) : users.slice(0, 8).map((entry) => (
                <div key={entry._id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{entry.name}</p>
                    <p className="text-sm text-slate-400">{entry.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">{entry.role}</span>
                    {entry.status !== 'approved' ? (
                      <button onClick={() => handleStatusUpdate(entry._id, 'approved')} className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-200">Approve</button>
                    ) : null}
                    <button onClick={() => handleStatusUpdate(entry._id, 'suspended')} className="rounded-full bg-rose-500/20 px-3 py-1 text-sm text-rose-200">Suspend</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
            <h2 className="text-xl font-semibold text-white">Admin actions</h2>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">Review analytics to track event demand, bookings, and growth.</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">Approve or suspend host accounts from the users section above.</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">Manage listings and payments from the sidebar for full platform control.</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
