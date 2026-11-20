import { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminHallsPage = () => {
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    api.get('/halls').then((res) => setHalls(Array.isArray(res.data) ? res.data : [])).catch(() => setHalls([]));
  }, []);

  return (
    <AdminLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage halls</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {halls.map((hall) => (
            <div key={hall._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">{hall.name}</p>
              <p className="mt-2 text-sm text-slate-400">{hall.address}</p>
              <p className="mt-2 text-sm text-amber-300">Capacity: {hall.capacity}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHallsPage;
