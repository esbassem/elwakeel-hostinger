import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';

const OverdueAmountsSummary = ({ viewMode = 'customers', customers = [], contracts = [] }) => {
  const [paymentsMap, setPaymentsMap] = useState({});
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // 1) في وضع حسابات التمويل: هات إجمالي المدفوع لكل عقد من finance_installment_payments
  useEffect(() => {
    const run = async () => {
      if (viewMode !== 'finance_accounts') return;

      const ids = (contracts || []).map(c => c.id).filter(Boolean);
      if (ids.length === 0) {
        setPaymentsMap({});
        return;
      }

      setPaymentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('finance_installment_payments')
          .select('finance_id, paid_amount')
          .in('finance_id', ids);

        if (error) throw error;

        const map = {};
        for (const row of (data || [])) {
          const fid = row.finance_id;
          const amt = Number(row.paid_amount) || 0;
          map[fid] = (map[fid] || 0) + amt;
        }
        setPaymentsMap(map);
      } catch (e) {
        console.error('Failed to fetch payments totals:', e);
        setPaymentsMap({});
      } finally {
        setPaymentsLoading(false);
      }
    };

    run();
  }, [viewMode, contracts]);

  // 2) حساب إجمالي المطلوب
  const installmentsOverdue = useMemo(() => {
    if (viewMode === 'finance_accounts') {
      // هنا هنحسب "المتبقي من إجمالي العقود" بنفس منطق المدفوعات الحقيقي
      return (contracts || []).reduce((sum, c) => {
        const total = Number(c?.totalAmount) || 0;
        const paid = Number(paymentsMap?.[c?.id]) || 0;
        const remaining = Math.max(0, total - paid);
        return sum + remaining;
      }, 0);
    }

    // وضع العملاء: زي ما كان
    return (customers || []).reduce((sum, c) => sum + (Number(c?.totalOverdueAmount) || 0), 0);
  }, [viewMode, customers, contracts, paymentsMap]);

  // placeholders
  const invoicesOverdue = 0;
  const otherOverdue = 0;
  const totalOverdue = installmentsOverdue + invoicesOverdue + otherOverdue;

  const totalForCalc = totalOverdue > 0 ? totalOverdue : 1;
  const installPct = (installmentsOverdue / totalForCalc) * 100;
  const invoicePct = (invoicesOverdue / totalForCalc) * 100;
  const otherPct = (otherOverdue / totalForCalc) * 100;

  const title =
    viewMode === 'finance_accounts'
      ? 'إجمالي المتبقي من إجمالي العقود'
      : 'إجمالي المطلوب سداده الآن';

  return (
    <div className="w-full">
      <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-none shadow-lg text-white p-4 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Wallet className="w-40 h-40 transform -rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col h-full space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 opacity-90">
              <div className="p-1.5 bg-red-500/20 rounded-lg backdrop-blur-sm ring-1 ring-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                {title}
                {viewMode === 'finance_accounts' && paymentsLoading ? ' ...' : ''}
              </h3>
            </div>

            <div className="flex items-baseline gap-2 direction-rtl pr-1">
              <span className="text-4xl font-bold tracking-tight font-mono text-white drop-shadow-sm">
                {totalOverdue.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                جنيه مصري
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-slate-700/50 rounded-full flex overflow-hidden">
            <div style={{ width: `${installPct}%` }} className="h-full bg-red-500 transition-all duration-500" />
            <div style={{ width: `${invoicePct}%` }} className="h-full bg-blue-500 transition-all duration-500" />
            <div style={{ width: `${otherPct}%` }} className="h-full bg-yellow-500 transition-all duration-500" />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                أقساط
              </div>
              <span className="text-sm font-bold font-mono text-slate-200">
                {installmentsOverdue.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                فواتير
              </div>
              <span className="text-sm font-bold font-mono text-slate-200">
                {invoicesOverdue.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-60">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                أخرى
              </div>
              <span className="text-sm font-bold font-mono text-slate-200">
                {otherOverdue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OverdueAmountsSummary;
