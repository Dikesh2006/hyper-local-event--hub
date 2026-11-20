import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext, { getDashboardPath } from '../context/AuthContext';
import AnimatedReveal from '../components/AnimatedReveal';

const AuthPage = () => {
  const { login, register } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', role: 'user' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      let response;
      if (isRegister) {
        response = await register(form);
      } else {
        response = await login(form.email, form.password);
      }
      const role = response?.data?.user?.role;
      navigate(getDashboardPath(role));
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <AnimatedReveal delay={0.1} duration={0.8} y={24} className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white/85 p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold text-slate-900">{isRegister ? 'Create account' : 'Welcome back'}</h1>
        <p className="text-slate-600">{isRegister ? 'Register now to book events, halls and manage your local experiences.' : 'Login to access your bookings and dashboard.'}</p>
      </div>
      {error && <div className="mt-6 rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        {isRegister && (
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 outline-none" />
        )}
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 outline-none" />
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 outline-none" />
        {isRegister && (
          <>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 outline-none" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 outline-none">
              <option value="user">Customer</option>
              <option value="eventManager">Event Manager</option>
              <option value="hotelOwner">Hotel Owner</option>
              <option value="theatreOwner">Theatre Owner</option>
            </select>
          </>
        )}
        <button type="submit" className="rounded-full bg-indigo-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <div className="mt-6 flex items-center justify-center gap-2 text-slate-500">
        <span>{isRegister ? 'Already have an account?' : 'New to Hyper Local?'}</span>
        <button onClick={() => setIsRegister((prev) => !prev)} className="font-semibold text-indigo-600 hover:text-indigo-500">
          {isRegister ? 'Login here' : 'Register now'}
        </button>
      </div>
    </AnimatedReveal>
  );
};

export default AuthPage;
