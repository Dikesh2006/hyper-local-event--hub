import { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminManagersPage = () => {
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    api.get('/managers').then((res) => setManagers(res.data)).catch(() => setManagers([]));
  }, []);

  return (
    <AdminLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage managers and dealers</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {managers.map((manager) => (
            <div key={manager._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{manager.name}</p>
              <p className="mt-2 text-sm text-slate-400">{manager.expertise}</p>
              <p className="mt-2 text-sm text-indigo-300">{manager.city} • ₹{manager.pricePerEvent}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminManagersPage;
