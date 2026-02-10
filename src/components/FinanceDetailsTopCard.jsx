
import React, { useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useFinanceTotals } from '@/hooks/useFinanceTotals';

const FinanceDetailsTopCard = ({ finance }) => {
  const installments = finance?.finance_installments || [];
  const financeId = finance?.id;
  const initialTotal = finance?.total_amount || 0;

  // Use new hook for totals
  const { total, paid, remaining, loading } = useFinanceTotals(financeId, installments, initialTotal);

  // Calculate visual metrics locally (simplified) to replace old hook dependency
  const visualMetrics = useMemo(() => {
    if (!installments.length) return { redAmount: 0, redPct: 0, paidPct: 0, upcomingPct: 100, markers: [] };

    const sorted = [...installments].sort((a, b) => new Date(a.installment_date) - new Date(b.installment_date));
    
    // Calculate how much SHOULD be paid by now (Expected)
    const now = new Date();
    const expectedPaid = sorted.reduce((sum, inst) => {
        const d = new Date(inst.installment_date);
        d.setHours(0,0,0,0);
        if (d <= now) {
            return sum + (Number(inst.amount || inst.installment_amount) || 0);
        }
        return sum;
    }, 0);

    // Overdue is difference between what should be paid and what IS paid
    // But cannot be negative (if they paid ahead)
    const redAmount = Math.max(0, expectedPaid - paid);
    
    // Percentages
    const safeTotal = total || 1;
    const paidPct = Math.min(100, (paid / safeTotal) * 100);
    // Red percent is part of the remaining, specifically the overdue part
    const redPct = Math.min(100 - paidPct, (redAmount / safeTotal) * 100);
    const upcomingPct = 100 - paidPct - redPct;

    // Markers for bar
    let cumulative = 0;
    const markers = sorted.map((inst, idx) => {
        cumulative += Number(inst.amount || inst.installment_amount || 0);
        const endPct = (cumulative / safeTotal) * 100;
        
        return {
            index: idx,
            end: endPct,
            isCurrent: false 
        };
    });

    return { redAmount, redPct, paidPct, upcomingPct, markers, sorted };
  }, [installments, paid, total]);

  if (loading) {
     return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-center items-center">
           <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
     );
  }

  const { redAmount, redPct, paidPct, upcomingPct, markers, sorted } = visualMetrics;

  const firstInstallmentDate = sorted.length > 0 ? sorted[0].installment_date : null;
  const currentInstallmentNum = Math.min(sorted.length, Math.floor((paid / (total || 1)) * sorted.length) + 1); // Approximation

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative overflow-visible" dir="rtl">
      
      {/* Title & Date */}
      <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-500 leading-tight">
              {finance?.finance_name || 'تمويل بدون عنوان'}
          </h3>
          {finance?.finance_date && (
            <p className="text-xs text-slate-400 mt-1 font-mono">
              {new Date(finance.finance_date).toLocaleDateString('ar-LY')}
            </p>
          )}
      </div>

      {/* Amount Header */}
      <div className="flex justify-end items-end mb-1">
            <div className="flex items-baseline gap-2" dir="ltr">
            <span className="text-xl font-black text-slate-800">{total.toLocaleString()}</span>
            <span className="text-slate-300 font-light text-lg">/</span>
            <span className="text-xl font-black text-emerald-500">{paid.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400 self-start mt-1">د.ل</span>
        </div>
      </div>

      {/* Progress Bar Container with markers */}
      <div className="relative mb-3 pt-2">
        
        {/* The Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex relative z-10">
            {/* Paid Segment */}
            <div 
                style={{ width: `${paidPct}%` }} 
                className="bg-emerald-500 h-full transition-all duration-700 ease-out relative group"
            >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Overdue Segment */}
            <div 
                style={{ width: `${redPct}%` }} 
                className="bg-red-600 h-full transition-all duration-700 ease-out relative group"
            >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Future Segment */}
            <div 
                style={{ width: `${upcomingPct}%` }} 
                className="bg-slate-200 h-full transition-all duration-700 ease-out" 
            />

            {/* Installment Dividers */}
            <div className="absolute inset-0 w-full h-full pointer-events-none flex">
                {markers.map((m, i) => (
                    i < markers.length - 1 && (
                        <div 
                            key={i}
                            className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-20 shadow-[0_0_2px_rgba(0,0,0,0.1)]"
                            style={{ left: `${m.end}%` }}
                        />
                    )
                ))}
            </div>
        </div>

        {/* Bottom Ticks */}
         <div className="absolute top-full left-0 w-full h-3 mt-0 pointer-events-none">
            {markers.map((m, i) => (
                <div 
                    key={i}
                    className={`absolute top-0 w-[1px] transition-all h-1 bg-slate-300/60`}
                    style={{ left: `${m.end}%` }}
                />
            ))}
             <div className="absolute top-0 w-[1px] bg-slate-300 h-1 left-0" />
         </div>

      </div>

      {/* Details Row */}
      <div className="flex justify-between items-end mt-2">

         <div className="text-right">
             {firstInstallmentDate && (
                <div className="text-xs text-slate-400">
                   أول قسط: <span className="font-mono text-slate-500">{new Date(firstInstallmentDate).toLocaleDateString('ar-LY')}</span>
                </div>
             )}
         </div>

         <div className="text-xs text-slate-500 font-bold">
            القسط التقريبي {currentInstallmentNum} من {sorted.length}
         </div>

      </div>

      {/* Red Alert */}
      {redAmount > 0 && (
         <div className="flex justify-end mt-2">
            <div className="flex items-center gap-1 text-red-600 font-bold text-xs animate-in fade-in slide-in-from-bottom-1">
               <AlertCircle className="w-3.5 h-3.5" />
               <span>مستحق/متأخر: {redAmount.toLocaleString()} د.ل</span>
            </div>
         </div>
      )}

    </div>
  );
};

export default FinanceDetailsTopCard;
