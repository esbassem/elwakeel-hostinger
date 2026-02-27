import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import LoginPage from '@/components/LoginPage';
import MainDashboard from '@/components/MainDashboard';
import AccountPage from '@/components/AccountPage';
import FinanceDetailsPage from '@/components/FinanceDetailsPage';
import CustomerAccountsPage from '@/components/CustomerAccountsPage';
import NewFinancePage from '@/pages/NewFinancePage';
import KhaznaV2 from '@/components/KhaznaV2';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
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
      
      {/* The font-cairo class is removed, the font is now globally set in index.css */}
      <div className="min-h-screen bg-stone-50 text-stone-800" dir="rtl">
        {!isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route 
                path="/"
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'collection_officer', 'employee']}
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
                    allowedRoles={['admin', 'collection_officer', 'employee']}
                  >
                    <MainDashboard user={currentUser} onLogout={handleLogout} />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/account/:id" 
                element={
                   <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'collection_officer']}
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
                    allowedRoles={['admin', 'collection_officer', 'customer_accountant']}
                  >
                    <FinanceDetailsPage currentUser={currentUser} />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/new-finance" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'collection_officer']}
                  >
                    <NewFinancePage currentUser={currentUser} />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/customer-accounts" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['customer_accountant', 'admin']}
                  >
                    <CustomerAccountsPage currentUser={currentUser} onLogout={handleLogout} />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/khazna-v2" 
                element={
                  <ProtectedRoute 
                    user={currentUser} 
                    allowedRoles={['admin', 'employee']}
                  >
                    <KhaznaV2 currentUser={currentUser} />
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
