
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import LoginPage from '@/components/LoginPage';
import MainDashboard from '@/components/MainDashboard';
import AccountPage from '@/components/AccountPage';
import FinanceDetailsPage from '@/components/FinanceDetailsPage';
import CustomerAccountsPage from '@/components/CustomerAccountsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Check for active session
    const savedAuth = localStorage.getItem('trader_tools_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setIsAuthenticated(true);
        setCurrentUser(authData);
      } catch (e) {
        localStorage.removeItem('trader_tools_auth');
      }
    }
    setLoadingAuth(false);
  }, []);

  const handleLogin = (user) => {
    // Save session with full user details
    const sessionData = { 
      username: user.username, 
      name: user.name, 
      role: user.role, 
      timestamp: new Date().toISOString() 
    };
    
    localStorage.setItem('trader_tools_auth', JSON.stringify(sessionData));
    setIsAuthenticated(true);
    setCurrentUser(sessionData);
  };

  const handleLogout = () => {
    localStorage.removeItem('trader_tools_auth');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (loadingAuth) return null;

  return (
    <AuthProvider>
      <Helmet>
        <title>أدوات التاجر - نظام الإدارة المبسط</title>
        <meta name="description" content="منصة أدوات التاجر لإدارة النقدية والفواتير والمخزون بسهولة ويسر" />
      </Helmet>
      
      <div className="min-h-screen bg-stone-50 font-cairo text-stone-800" dir="rtl">
        {!isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Main Dashboard - Protected for Admin, Employee, Collection Officer */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'employee', 'collection_officer']}
                  >
                    <MainDashboard user={currentUser} onLogout={handleLogout} />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/finances" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'employee', 'collection_officer']}
                  >
                    <MainDashboard user={currentUser} onLogout={handleLogout} />
                  </ProtectedRoute>
                } 
              />
              
              {/* Account Details - Protected */}
              <Route 
                path="/account/:id" 
                element={
                   <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'employee', 'collection_officer']}
                   >
                     <AccountPage currentUser={currentUser} />
                   </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/finance/:id" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'employee', 'collection_officer', 'customer_accountant']}
                  >
                    <FinanceDetailsPage currentUser={currentUser} />
                  </ProtectedRoute>
                } 
              />
              
              {/* Dedicated Customer Accountant Route */}
              <Route 
                path="/customer-accounts" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['customer_accountant', 'admin']} // Admin can also view for debugging
                  >
                    <CustomerAccountsPage currentUser={currentUser} onLogout={handleLogout} />
                  </ProtectedRoute>
                } 
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        )}
      </div>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
