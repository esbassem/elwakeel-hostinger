
import React from 'react';
import CollectionOfficerDashboard from '@/components/CollectionOfficerDashboard';
import { Helmet } from 'react-helmet';
import { LayoutGrid, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CustomerAccountsPage = ({ currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-stone-50 font-cairo text-stone-800" dir="rtl">
      <Helmet>
        <title>حسابات العملاء - أدوات التاجر</title>
      </Helmet>

      {/* Navigation for Customer Accountant */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50 shrink-0">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Right Side: Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold text-stone-800">أدوات التاجر</span>
                 <span className="text-xs text-stone-500 font-medium">لوحة حسابات العملاء</span>
              </div>
            </div>

            {/* Left Side: User Profile */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-stone-700">{currentUser?.name}</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      محاسب عملاء
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-blue-600 text-white border-blue-200 shadow-sm">
                   {currentUser?.name?.charAt(0) || 'U'}
                </div>
              </div>

              <div className="h-8 w-[1px] bg-stone-100 mx-1"></div>

              <Button
                onClick={onLogout}
                variant="ghost"
                size="icon"
                className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden min-h-[600px]">
             <CollectionOfficerDashboard currentUser={currentUser} />
         </div>
      </main>
    </div>
  );
};

export default CustomerAccountsPage;
