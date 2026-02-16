
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFinanceCalculations } from '@/hooks/useFinanceCalculations';
import { usePaymentDistribution } from '@/hooks/usePaymentDistribution';

/**
 * FinanceInstallmentCard component - V27 - Swapped Single-Line Notification
 *
 * This version swaps the visual position of the elements to match the user's request
 * for an RTL layout: The notification should be on the right, and the financials on the left.
 * To do this, the order of elements in the flex container is reversed.
 */
const FinanceInstallmentCard = ({ finance, onClick, index = 0 }) => {
  // --- DATA & CALCULATION HOOKS ---
  const { calculateTotalInstallmentsAmount } = useFinanceCalculations();
  const { totalPaid: distributedTotalPaid } = usePaymentDistribution(finance.id, finance.finance_installments);

  const metrics = finance.metrics || {};
  const {
    overdueAmount = 0,
    paidCount = 0,
    overdueCountInst = 0,
    totalInstallmentsCount = 0,
    oldestOverdueDate, // Key data point for the new requirement
  } = metrics;

  // --- DERIVED STATE ---
  const totalFinanceAmount = calculateTotalInstallmentsAmount(finance.finance_installments || []);
  const totalPaid = distributedTotalPaid;
  const numericOverdueAmount = Number(overdueAmount) || 0;
  
  const isOverdue = numericOverdueAmount > 0;

  const formattedOldestOverdueDate = oldestOverdueDate
    ? new Date(oldestOverdueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '';

  const customerDisplay = finance.customerNickname 
    ? `${finance.customerNickname} (${finance.customerName})`
    : finance.customerName || 'عميل';

  // --- RENDER ---
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      onClick={onClick}
      className="group w-full bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all duration-300 cursor-pointer mb-3 shadow-sm hover:shadow-lg overflow-hidden flex flex-col"
    >
      <div className="p-3.5 space-y-2">

        {/* --- Top Section: Basic Info --- */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-700 transition-colors" title={finance.finance_name || 'عقد تمويل'}>
              {finance.finance_name || finance.financeName || 'عقد تمويل'}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5" title={customerDisplay}>
              {customerDisplay}
            </p>
          </div>
        </div>

        {/* --- Middle Section: Single-Line, Justified Financial Info (RTL ORDER) --- */}
        <div className="flex justify-between items-baseline gap-4">
          {/* Right Side (First in code for RTL): Conditional Overdue Info */}
          <div className="flex-grow min-w-0">
            {isOverdue && (
              <p className="text-xs font-semibold text-red-600 animate-pulse text-right truncate">
                مطلوب تحصيل {numericOverdueAmount.toLocaleString()} د.ل متأخر منذ {formattedOldestOverdueDate}
              </p>
            )}
          </div>
          
          {/* Left Side (Second in code for RTL): Main Financials */}
          <p className="font-mono font-bold text-xl text-slate-800 flex-shrink-0">
              <span className="text-slate-700">{totalFinanceAmount.toLocaleString()}</span>
              <span className="text-slate-400 mx-1">/</span>
              <span className="text-green-600">{totalPaid.toLocaleString()}</span>
          </p>
        </div>

        {/* --- Bottom Section: Progress Bar & De-emphasized Count --- */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-grow">
            <div className="flex gap-0.5 h-2.5 w-full rounded-full overflow-hidden bg-slate-200/70" dir="rtl">
              {Array.from({ length: totalInstallmentsCount }).map((_, i) => {
                let colorClass = "bg-slate-200/70";
                if (i < paidCount) {
                  colorClass = "bg-green-500";
                } else if (i < paidCount + overdueCountInst) {
                    colorClass = "bg-red-500";
                }
                return <div key={i} className={cn("flex-1", colorClass)} />;
              })}
            </div>
          </div>
          <div className="shrink-0">
            <p className="text-xs font-mono font-medium text-slate-400">
              {paidCount} / {totalInstallmentsCount}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default FinanceInstallmentCard;
