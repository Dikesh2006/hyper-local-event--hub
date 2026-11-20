import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext, { getDashboardPath } from '../context/AuthContext';
import AnimatedReveal from '../components/AnimatedReveal';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await login(form.email, form.password);
      if (response?.data?.message) {
        setMessage(response.data.message);
      }
      const role = response?.data?.user?.role;
      navigate(getDashboardPath(role));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <AnimatedReveal delay={0.1} duration={0.8} y={24} className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <h1 className="mb-4 text-3xl font-semibold text-slate-900">Login to your account</h1>
      {message && <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-emerald-700">{message}</div>}
      {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <button
          type="submit"
          className="w-full rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Login
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Create an account
        </Link>
      </p>
    </AnimatedReveal>
  );
};

export default LoginPage;
