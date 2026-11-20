import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedReveal from './components/AnimatedReveal';
import HomePage from './pages/HomePage';
import MovieBookingPage from './pages/MovieBookingPage';
import EventsPage from './pages/EventsPage';
import HallBookingPage from './pages/HallBookingPage';
import HireManagerPage from './pages/HireManagerPage';
import PaymentPage from './pages/PaymentPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Customer Pages
import UserDashboardPage from './pages/user/UserDashboardPage';
import UserBookingsPage from './pages/user/UserBookingsPage';
import UserEventsPage from './pages/user/UserEventsPage';
import UserReviewsPage from './pages/user/UserReviewsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminManagersPage from './pages/admin/AdminManagersPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminMoviesPage from './pages/admin/AdminMoviesPage';
import AdminHallsPage from './pages/admin/AdminHallsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';

// Role Dashboards
import OrganizerDashboardPage from './pages/organizer/OrganizerDashboardPage';
import HallOwnerDashboardPage from './pages/hall/HallOwnerDashboardPage';
import TheatreOwnerDashboardPage from './pages/theatre/TheatreOwnerDashboardPage';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import ManagerBookingsPage from './pages/manager/ManagerBookingsPage';

import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.16),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_60%,_#f8fafc_100%)] text-slate-800 flex flex-col justify-between">
        <div>
          <Navbar />
          <main className="px-4 py-6 md:px-8 lg:px-16">
            <AnimatedReveal delay={0.05} duration={0.6} y={16} className="mx-auto max-w-7xl">
              <Routes>
                {/* Public Browsing Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/movies" element={<MovieBookingPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/halls" element={<HallBookingPage />} />
                <Route path="/hire" element={<HireManagerPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />

                {/* Customer (User) Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['user', 'customer']} />}>
                  <Route path="/user/dashboard" element={<UserDashboardPage />} />
                  <Route path="/user/bookings" element={<UserBookingsPage />} />
                  <Route path="/user/events" element={<UserEventsPage />} />
                  <Route path="/user/reviews" element={<UserReviewsPage />} />
                </Route>

                {/* Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/managers" element={<AdminManagersPage />} />
                  <Route path="/admin/events" element={<AdminEventsPage />} />
                  <Route path="/admin/movies" element={<AdminMoviesPage />} />
                  <Route path="/admin/halls" element={<AdminHallsPage />} />
                  <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                </Route>

                {/* Organizer Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['organizer']} />}>
                  <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
                  <Route path="/organizer/events" element={<OrganizerDashboardPage />} />
                </Route>

                {/* Hall Owner Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['hall_owner', 'hallOwner', 'hotelOwner']} />}>
                  <Route path="/hall-owner/dashboard" element={<HallOwnerDashboardPage />} />
                  <Route path="/hall-owner/halls" element={<HallOwnerDashboardPage />} />
                  <Route path="/hotel-owner/dashboard" element={<HallOwnerDashboardPage />} />
                </Route>

                {/* Theatre Owner Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['theatreOwner', 'theatre_owner', 'admin']} />}>
                  <Route path="/theatre-owner/dashboard" element={<TheatreOwnerDashboardPage />} />
                  <Route path="/theatre/dashboard" element={<TheatreOwnerDashboardPage />} />
                </Route>

                {/* Event Manager Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['manager', 'eventManager']} />}>
                  <Route path="/event-manager/dashboard" element={<ManagerDashboardPage />} />
                  <Route path="/event-manager/bookings" element={<ManagerBookingsPage />} />
                  <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatedReveal>
          </main>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
