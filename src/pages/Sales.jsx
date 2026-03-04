
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// --- Mock Data ---
const salesInvoices = [
  // August 2024
  { id: 1, customer: 'محمد علي', amount: 5000, date: '2024-08-25', status: 'مدفوع' },
  { id: 2, customer: 'فاطمة حسين', amount: 12000, date: '2024-08-21', status: 'قيد الانتظار' },
  { id: 3, customer: 'أحمد محمود', amount: 8500, date: '2024-08-18', status: 'متأخر' },
  { id: 4, customer: 'سارة إبراهيم', amount: 3200, date: '2024-08-10', status: 'مدفوع' },
  { id: 5, customer: 'خالد يوسف', amount: 7800, date: '2024-08-05', status: 'مدفوع' },
  
  // July 2024
  { id: 6, customer: 'علي حسن', amount: 4500, date: '2024-07-28', status: 'مدفوع' },
  { id: 7, customer: 'منى سعيد', amount: 9500, date: '2024-07-22', status: 'مدفوع' },
  { id: 8, customer: 'ياسر أمين', amount: 15000, date: '2024-07-15', status: 'قيد الانتظار' },
  { id: 9, customer: 'هند رضا', amount: 2000, date: '2024-07-09', status: 'متأخر' },
];

const Sales = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2024-08-01'));

  const handleMonthChange = (increment) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  const { monthlyTotal, filteredInvoices } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const filtered = salesInvoices.filter(d => {
      const saleDate = new Date(d.date);
      return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });

    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    
    return { monthlyTotal: total, filteredInvoices: filtered };
  }, [currentDate]);
  
  const monthName = currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

  const getStatusClass = (status) => {
    switch (status) {
      case 'مدفوع': return 'text-green-600';
      case 'قيد الانتظار': return 'text-yellow-600';
      case 'متأخر': return 'text-red-600';
      default: return 'text-slate-500';
    }
  };

  const getStatusDotClass = (status) => {
    switch (status) {
      case 'مدفوع': return 'bg-green-500';
      case 'قيد الانتظار': return 'bg-yellow-500';
      case 'متأخر': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900">
      <header className="bg-slate-50 sticky top-0 z-10 px-4 pt-4 pb-2">
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-slate-200">
          <ArrowRight className="h-6 w-6 text-slate-700" />
        </Button>
      </header>

      <header className="bg-slate-50 px-6 pb-4">
        <h1 className="text-5xl font-bold text-slate-900">المبيعات</h1>
      </header>
      
      <main className="flex-grow px-4 pb-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
                <Button onClick={() => handleMonthChange(1)} variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <ChevronLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <h2 className="text-lg font-bold text-slate-800 w-32 text-center">{monthName}</h2>
                <Button onClick={() => handleMonthChange(-1)} variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                </Button>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                <Plus className="ml-2 h-5 w-5" />
                إضافة فاتورة
            </Button>
          </div>

          <div className="text-right mb-8">
            <p className="text-base text-slate-500">إجمالي مبيعات الشهر</p>
            <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {monthlyTotal.toLocaleString('ar-EG')} جنيه
            </p>
          </div>

          {/* Invoices List */}
          <div className="border-t border-slate-200">
            <div className="divide-y divide-slate-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-5">
                    <div className="mr-4">
                      <p className="text-base font-semibold text-slate-900">{item.customer}</p>
                      <p className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-slate-900">{item.amount.toLocaleString('ar-EG')} جنيه</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <p className={`text-sm font-semibold ${getStatusClass(item.status)}`}>{item.status}</p>
                        <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(item.status)}`}></span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-500">لا توجد فواتير لهذا الشهر.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sales;
