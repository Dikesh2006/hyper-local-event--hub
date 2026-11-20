import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import api from '../../api/api';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminPaymentsPage = () => {
  const { token, authHeaders } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/payments', authHeaders()).then((res) => setPayments(res.data)).catch(() => setPayments([]));
  }, [token]);

  return (
    <AdminLayout>
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glass">
        <h2 className="text-xl font-semibold text-white">Manage payments</h2>
        <div className="mt-6 grid gap-4">
          {payments.map((payment) => (
            <div key={payment._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="font-medium text-white">Payment ID: {payment.paymentId}</p>
              <p className="mt-2 text-sm text-slate-400">Amount: ₹{payment.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentsPage;
