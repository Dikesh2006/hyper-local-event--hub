import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext, { getDashboardPath, normalizeUserRole } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length) {
    const normUserRole = normalizeUserRole(user.role);
    const normAllowedRoles = allowedRoles.map(r => normalizeUserRole(r));

    const hasAccess = normAllowedRoles.includes(normUserRole) || user.role === 'admin';
    if (!hasAccess) {
      return <Navigate to={getDashboardPath(user.role)} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

