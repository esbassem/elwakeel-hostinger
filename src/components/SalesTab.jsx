
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShoppingCart, Plus, Search } from 'lucide-react';
import AddSale from '@/pages/AddSale';

// --- Mock Data ---
const salesData = [
    { id: 1, customer: 'محمد علي', product: 'هاتف ذكي', amount: 2500, time: '03:45 م', date: '2023-10-26' },
    { id: 2, customer: 'فاطمة حسين', product: 'شاشة تلفزيون', amount: 4800, time: '11:20 ص', date: '2023-10-26' },
    { id: 3, customer: 'عبدالله خالد', product: 'سماعات لاسلكية', amount: 550, time: '09:15 م', date: '2023-10-25' },
    { id: 4, customer: 'نورة سعد', product: 'جهاز لوحي', amount: 1800, time: '01:30 م', date: '2023-09-15' },
    { id: 5, customer: 'خالد الفيصل', product: 'طابعة مكتبية', amount: 1200, time: '04:00 م', date: '2023-09-15' },
    { id: 6, customer: 'سارة إبراهيم', product: 'لابتوب محمول', amount: 6500, time: '10:00 ص', date: '2023-09-12' },
    { id: 7, customer: 'أحمد منصور', product: 'كاميرا رقمية', amount: 3200, time: '08:55 ص', date: '2023-09-12' },
    { id: 8, customer: 'ريم عبدالله', product: 'ساعة ذكية', amount: 950, time: '07:30 م', date: '2023-08-30' },
    { id: 9, customer: 'يوسف حمد', product: 'مكيف هواء', amount: 3500, time: '12:10 م', date: '2023-08-28' },
    { id: 10, customer: 'لمى رياض', product: 'غسالة ملابس', amount: 2800, time: '02:00 م', date: '2023-08-25' },
    { id: 11, customer: 'بدر سلطان', product: 'جهاز عرض بروجكتر', amount: 2100, time: '06:45 م', date: '2023-08-22' },
    { id: 12, customer: 'هند فهد', product: 'مكنسة كهربائية', amount: 800, time: '09:00 ص', date: '2023-08-20' },
];
const customerDebt = 12500;

// --- Helper Functions ---
const formatCurrency = (amount) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
const todaySalesTotal = salesData.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((sum, sale) => sum + sale.amount, 0);

// --- Main Component ---
const Sales = ({ onBack }) => {
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const groupedAndFilteredSales = useMemo(() => {
    const filtered = searchTerm
      ? salesData.filter(sale =>
          sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.product.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : salesData;

    return filtered.reduce((acc, sale) => {
        const saleDate = new Date(sale.date);
        const monthYear = new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(saleDate);

        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(sale);
        return acc;
      }, {});
  }, [searchTerm]);

  if (view === 'add') {
    return <AddSale onBack={() => setView('list')} />;
  }

  return (
    <div dir="rtl" className="bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col" style={{height: '100%'}}>
      {/* Header */}
      <header className="px-4 sm:px-6 pt-10 pb-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-10 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-3xl font-bold">المبيعات</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setView('add')} className="rounded-full w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 pb-24 space-y-6">
          {/* Stats */}
          <div className="flex items-center justify-around py-2">
            <StatItem title="مبيعات اليوم" value={formatCurrency(todaySalesTotal)} />
            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"></div>
            <StatItem title="ديون العملاء" value={formatCurrency(customerDebt)} isButton />
          </div>

          {/* Search Pill */}
          <div className="relative shrink-0">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-full text-base pr-12 pl-5 py-3 outline-none transition-colors duration-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sales List */}
          <AnimatePresence>
            {Object.keys(groupedAndFilteredSales).length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
                {Object.entries(groupedAndFilteredSales).map(([month, sales]) => (
                    <div key={month} className="space-y-1">
                      <h2 className="font-semibold text-base text-gray-500 dark:text-gray-400 px-3 pt-2 pb-1">
                          {month}
                      </h2>
                      {sales.map((sale) => (
                          <SaleItem key={sale.id} sale={sale} />
                      ))}
                    </div>
                ))}
                </motion.div>
            ) : (
                <div className="text-center pt-16 text-gray-500">
                  <p>لا توجد فواتير مطابقة للبحث</p>
                </div>
            )}
          </AnimatePresence>
      </main>
    </div>
  );
};

// --- Sub-components ---
const StatItem = ({ title, value, isButton = false }) => {
  const Tag = isButton ? 'button' : 'div';
  return (
    <Tag className={`w-full text-center px-3 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800`}>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </Tag>
  );
};

const SaleItem = ({ sale }) => (
    <div className="flex items-center p-3 cursor-pointer rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/70">
        <div className="ml-4 flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-grow min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{sale.product}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{sale.customer}</p>
        </div>
        <div className="text-left shrink-0 pr-1 space-y-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(sale.amount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{sale.time}</p>
        </div>
    </div>
);

export default Sales;
