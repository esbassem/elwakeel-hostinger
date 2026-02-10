
import React from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar,
  Layers,
  Banknote,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FinanceItemCard from './FinanceItemCard';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceListCard = ({ 
  currentMonthData, 
  onNextMonth, 
  onPrevMonth, 
  isNextDisabled, 
  isPrevDisabled, 
  loading,
  onFinanceClick
}) => {
  const finances = currentMonthData?.finances || [];
  const stats = currentMonthData?.stats || { total: 0, count: 0 };
  
  return (
    <div className="bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* 1. Header - Compact */}
      <div className="px-4 py-4 md:px-5 bg-slate-900 text-white flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
               <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {currentMonthData?.monthName || '...'}
              </h3>
              <p className="text-slate-400 text-xs font-medium">سجل المعاملات</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevMonth} 
              disabled={isPrevDisabled}
              className="h-7 w-7 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              disabled={isNextDisabled}
              className="h-7 w-7 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
      </div>

      {/* 2. Summary Section - Compact Grid */}
      <div className="px-4 py-4 bg-slate-50/80 border-b border-slate-100 grid grid-cols-2 gap-3">
         <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
               <FileText className="w-4 h-4" />
             </div>
             <div className="flex flex-col min-w-0">
               <span className="text-slate-500 text-[10px] font-bold mb-0.5">عدد العقود</span>
               <span className="text-slate-900 font-bold text-base truncate">{stats.count}</span>
             </div>
         </div>
         <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
               <Banknote className="w-4 h-4" />
             </div>
             <div className="flex flex-col min-w-0">
               <span className="text-slate-500 text-[10px] font-bold mb-0.5">إجمالي القيمة</span>
               <span className="text-slate-900 font-bold text-base font-mono truncate">
                 {Number(stats.total).toLocaleString()}
               </span>
             </div>
         </div>
      </div>

      {/* 3. List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-3 md:p-4">
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 rounded-full border-t-blue-500 animate-spin"></div>
              <span className="text-xs font-bold text-slate-500">جاري التحميل...</span>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {finances.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {finances.map((finance, index) => (
                    <motion.div
                      key={finance.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                    >
                      <FinanceItemCard 
                        finance={finance} 
                        onClick={() => onFinanceClick(finance)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                     <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-slate-600 font-bold text-sm mb-1">لا توجد عقود</h4>
                  <p className="text-xs text-slate-400">لا توجد بيانات لهذا الشهر</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceListCard;
