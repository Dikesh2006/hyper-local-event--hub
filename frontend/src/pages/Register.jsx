import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext, { getDashboardPath } from '../context/AuthContext';
import AnimatedReveal from '../components/AnimatedReveal';

const RegisterPage = () => {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', role: 'user' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await register(form);
      setMessage(response.data.message || 'Registration successful');
      const role = response?.data?.user?.role;
      navigate(getDashboardPath(role));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register.');
    }
  };

  return (
    <AnimatedReveal delay={0.1} duration={0.8} y={24} className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <h1 className="mb-4 text-3xl font-semibold text-slate-900">Create an account</h1>
      {message && <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-emerald-700">{message}</div>}
      {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Full name"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email address"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
          required
        />
        <input
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="City"
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
        >
          <option value="user">Customer / User</option>
          <option value="theatreOwner">Movie Theatre Owner / Admin</option>
          <option value="organizer">Event Organizer</option>
          <option value="hall_owner">Hall / Venue Owner</option>
          <option value="manager">Event Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Register
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </AnimatedReveal>
  );
};

export default RegisterPage;
