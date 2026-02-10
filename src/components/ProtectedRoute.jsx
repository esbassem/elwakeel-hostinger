
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ user, children, allowedRoles = [] }) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // If user has a role that is NOT in the allowedRoles list, redirect them
  // This logic is mostly for preventing customer_accountant from accessing standard routes
  // and preventing standard users from accessing customer_accountant routes if restricted (though normally open is fine)
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
     // If user is customer_accountant trying to access main routes
     if (user.role === 'customer_accountant') {
        return <Navigate to="/customer-accounts" replace />;
     }
     
     // If normal user trying to access restricted routes (like /customer-accounts)
     // For now, we might redirect them to home
     return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
