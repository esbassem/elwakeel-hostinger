
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileText, User } from 'lucide-react';
import { useFinanceTotals } from '@/hooks/useFinanceTotals';
import { Skeleton } from '@/components/ui/skeleton';

const FinanceAccountCard = ({ contract, onClick }) => {
  const {
    id,
    financeName,
    customerName,
    metrics,
    installments,
    totalAmount
  } = contract;

  const { totalOverdue, paidCount, totalCount, overdueCount } = metrics || {};
  
  // Use new hook for totals and calculations
  const { total, remaining, loading } = useFinanceTotals(id, installments, totalAmount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, shadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 cursor-pointer relative overflow-hidden group h-full flex flex-col justify-between transition-all hover:border-indigo-100"
      onClick={() => onClick && onClick(contract)}
    >
      {/* Overdue Status Indicator Line */}
      <div className={cn(
        "absolute top-0 right-0 bottom-0 w-1 transition-colors",
        (totalOverdue > 0) ? "bg-red-500" : "bg-emerald-500"
      )} />

      {/* Header */}
      <div className="flex justify-between items-start mb-3 pr-3">
        <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md shrink-0">
                <FileText className="w-4 h-4" />
             </div>
             <h3 className="font-bold text-slate-800 text-sm line-clamp-1 truncate" title={financeName}>
               {financeName}
             </h3>
           </div>
           
           <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
             <User className="w-3 h-3 shrink-0" />
             <span className="truncate max-w-[180px]" title={customerName}>{customerName}</span>
           </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-4 pr-3">
         
         {/* Tick Bar */}
         <div className="flex gap-[2px] h-2 w-full" dir="rtl">
             {Array.from({ length: Math.min(totalCount || 0, 60) }).map((_, i) => {
                 let colorClass = "bg-slate-100"; // Future
                 
                 if (i < (paidCount || 0)) {
                   colorClass = "bg-emerald-400"; // Paid
                 } else if (i < (paidCount || 0) + (overdueCount || 0)) {
                   colorClass = "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)] animate-pulse z-10"; // Overdue
                 }
                 
                 return (
                   <div 
                     key={i}
                     className={cn(
                       "flex-1 h-full rounded-[1px] transition-all",
                       colorClass
                     )}
                   />
                 );
             })}
         </div>

         {/* Stats Row - Amounts */}
         <div className="flex items-center justify-between bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
             <span className="text-xs font-medium text-slate-500">المطلوب من الإجمالي</span>
             
             <div className="flex items-baseline gap-1.5" dir="rtl">
               {loading ? (
                  <Skeleton className="h-5 w-24 bg-slate-200" />
               ) : (
                  <>
                    <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">
                        {remaining.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium px-0.5">من</span>
                    <span className="text-xs text-slate-600 font-mono font-semibold">
                        {total.toLocaleString()}
                    </span>
                  </>
               )}
             </div>
         </div>
      </div>

    </motion.div>
  );
};

export default FinanceAccountCard;
