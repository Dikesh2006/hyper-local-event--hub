import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/managers', label: 'Managers' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/movies', label: 'Movies' },
  { to: '/admin/halls', label: 'Halls' },
  { to: '/admin/payments', label: 'Payments' },
];

const AdminLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col gap-6 lg:flex-row">
      <aside className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-glass lg:w-72">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Admin Console</p>
          <h2 className="text-2xl font-semibold text-white">{user?.name || 'Admin'}</h2>
          <p className="text-sm text-slate-400">Operations and analytics</p>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-emerald-500/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
          <Link to="/" className="block rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            Public Site
          </Link>
          <button onClick={handleLogout} className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
            Logout
          </button>
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-glass sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Command center</p>
              <h1 className="text-2xl font-semibold text-white">Admin dashboard</h1>
            </div>
            <Link to="/events" className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">
              Review Platform
            </Link>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
};

export default AdminLayout;
