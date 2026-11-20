import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminUsersPage = () => {
  const { token, authHeaders } = useContext(AuthContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users', authHeaders()).then((res) => setUsers(res.data)).catch(() => setUsers([]));
  }, [token]);

  return (
    <AdminLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage users</h2>
        <div className="mt-6 grid gap-4">
          {users.map((user) => (
            <div key={user._id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">{user.role}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
