
import React from 'react';
import { ChevronLeft, Phone, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceTotals } from '@/hooks/useFinanceTotals';

const CollectionCustomerCard = ({ customer, onClick, isSelected }) => {
  // Attempt to resolve finance details for the hook safely (handling null customer)
  // Assuming customer might be a flattened row with finance_id or has contracts array
  const financeId = customer?.finance_id || customer?.contracts?.[0]?.id || customer?.latest_finance_id || null;
  const installments = customer?.installments || customer?.contracts?.[0]?.installments || [];
  const initialTotal = customer?.total_amount || customer?.contracts?.[0]?.total_amount || 0;

  // Hook must be called unconditionally at the top level
  const { total, remaining, loading } = useFinanceTotals(financeId, installments, initialTotal);

  // Early return after hooks
  if (!customer) return null;

  const displayName = customer.nickname ? `${customer.nickname} (${customer.name})` : customer.name;
  
  // Keep existing overdue logic if available, or fallback to 0
  const overdueAmount = customer.totalOverdueAmount || 0;
  const phoneNumber = customer.phone || '---';

  return (
    <div 
      onClick={() => onClick(customer)}
      className={cn(
        "group bg-white rounded-xl p-3 cursor-pointer transition-all duration-200 border relative overflow-hidden",
        isSelected 
          ? "ring-1 ring-indigo-500 border-indigo-500 shadow-md z-10" 
          : "border-slate-100 hover:border-indigo-200 hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        
        {/* Right Side: Identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar / Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors",
            isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
          )}>
             {customer.nickname?.charAt(0) || <User className="w-5 h-5" />}
          </div>

          {/* Name & Phone */}
          <div className="flex flex-col min-w-0">
             <h3 className={cn(
               "font-bold text-sm truncate transition-colors",
               isSelected ? "text-indigo-900" : "text-slate-800"
             )}>
               {displayName}
             </h3>
             <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
               <Phone className="w-3 h-3 text-slate-400" />
               <span className="font-mono dir-ltr">{phoneNumber}</span>
             </div>
          </div>
        </div>

        {/* Left Side: Financials & Action */}
        <div className="flex items-center gap-3 shrink-0">
           
           {/* Amount Display */}
           <div className="text-left flex flex-col items-end">
              {/* Overdue (Immediate) */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] text-red-500 font-medium">مطلوب:</span>
                <span className={cn(
                   "font-bold font-mono text-sm",
                   overdueAmount > 0 ? "text-red-600" : "text-slate-700"
                 )}>
                   {overdueAmount.toLocaleString()}
                 </span>
              </div>

              {/* Total Remaining (Long term) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                 <span className="text-[9px]">المتبقي:</span>
                 {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                 ) : (
                    <span className="font-mono text-slate-500">
                       {remaining.toLocaleString()}
                    </span>
                 )}
              </div>
           </div>

           {/* Chevron */}
           <div className={cn(
             "w-6 h-6 rounded-full flex items-center justify-center transition-all",
             isSelected ? "bg-indigo-600 text-white" : "text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-[-2px]"
           )}>
             <ChevronLeft className="w-4 h-4" />
           </div>

        </div>

      </div>
      
      {/* Overdue Indicator Bar */}
      {overdueAmount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-100">
          <div 
            className="h-full bg-red-500" 
            style={{ width: '100%' }} 
          />
        </div>
      )}
    </div>
  );
};

export default CollectionCustomerCard;
