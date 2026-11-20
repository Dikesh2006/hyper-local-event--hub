import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import AuthContext, { getDashboardPath, normalizeUserRole } from '../context/AuthContext';
import AnimatedReveal from './AnimatedReveal';

const getNavLinksForRole = (role) => {
  const normRole = normalizeUserRole(role);
  if (!role) {
    return [
      { to: '/', label: 'Home' },
      { to: '/movies', label: 'Movies' },
      { to: '/events', label: 'Events' },
      { to: '/halls', label: 'Halls' },
      { to: '/hire', label: 'Event Managers' },
    ];
  }

  switch (normRole) {
    case 'admin':
      return [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/events', label: 'Events' },
        { to: '/admin/movies', label: 'Movies' },
        { to: '/admin/halls', label: 'Halls' },
        { to: '/admin/managers', label: 'Managers' },
        { to: '/admin/payments', label: 'Payments' },
      ];
    case 'organizer':
      return [
        { to: '/organizer/dashboard', label: 'Dashboard' },
        { to: '/organizer/events', label: 'My Events' },
        { to: '/user/dashboard', label: 'Profile' },
      ];
    case 'hall_owner':
      return [
        { to: '/hall-owner/dashboard', label: 'Dashboard' },
        { to: '/hall-owner/halls', label: 'My Halls' },
        { to: '/user/dashboard', label: 'Profile' },
      ];
    case 'theatre_owner':
      return [
        { to: '/theatre-owner/dashboard', label: 'Theater Dashboard' },
        { to: '/movies', label: 'Movie Catalog' },
        { to: '/user/dashboard', label: 'Profile' },
      ];
    case 'manager':
      return [
        { to: '/event-manager/dashboard', label: 'Dashboard' },
        { to: '/event-manager/bookings', label: 'Booking Requests' },
        { to: '/user/dashboard', label: 'Profile' },
      ];
    case 'user':
    default:
      return [
        { to: '/', label: 'Home' },
        { to: '/movies', label: 'Movies' },
        { to: '/events', label: 'Events' },
        { to: '/halls', label: 'Halls' },
        { to: '/hire', label: 'Event Managers' },
        { to: '/user/bookings', label: 'My Bookings' },
        { to: '/user/dashboard', label: 'Profile' },
      ];
  }
};

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();
  const dashboardPath = getDashboardPath(user?.role);
  const navLinks = getNavLinksForRole(user?.role);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/events?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <AnimatedReveal delay={0.02} duration={0.5} y={-12}>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Hyper Local
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 -mt-1">
                Event Hub
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 lg:flex bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Quick Search & Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {(!user || normalizeUserRole(user?.role) === 'user') && (
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-36 lg:w-44 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:w-56 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-300"
                />
                <button type="submit" aria-label="Search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to={dashboardPath}
                  className="rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  Dashboard
                </NavLink>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800 max-w-[110px] truncate leading-tight">{user.name}</span>
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider -mt-0.5">{user.role}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:text-indigo-600"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:shadow-indigo-600/30 hover:scale-[1.02]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pt-3 pb-6 md:hidden shadow-xl animate-in slide-in-from-top-2 duration-200">
            {(!user || normalizeUserRole(user?.role) === 'user') && (
              <form onSubmit={handleSearchSubmit} className="mb-4 relative">
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search movies, events, venues..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-none"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            )}

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2.5 text-sm font-medium rounded-xl transition ${
                      isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-xl bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700"
                  >
                    Dashboard ({user.name} - {user.role})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </AnimatedReveal>
  );
};

export default Navbar;


