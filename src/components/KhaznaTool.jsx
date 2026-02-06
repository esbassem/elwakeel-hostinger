import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, TrendingDown, Plus, Minus, Search, Clock, CheckCircle, Calendar, ClipboardList, ShieldCheck, ShieldAlert, AlertTriangle, Trash2, History, Shield, MoreHorizontal, FileText, User, Activity, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import KhaznaAudit from './KhaznaAudit';
import AuditDetailsDialog from './AuditDetailsDialog';

// --- Sub-components ---

const MonthlyStats = ({
  income,
  expense
}) => <div className="flex items-center gap-3 mr-auto" dir="ltr">
    <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
      <TrendingDown className="w-3 h-3" />
      <span className="text-xs font-bold">{expense.toLocaleString()}</span>
    </div>
    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
      <TrendingUp className="w-3 h-3" />
      <span className="text-xs font-bold">{income.toLocaleString()}</span>
    </div>
  </div>;
const TransactionItem = ({
  t,
  isAdmin,
  onDelete,
  onApprove
}) => <div className={`group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:bg-white hover:shadow-sm hover:border-stone-100 transition-all ${t.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${t.status === 'pending' ? 'bg-amber-100 text-amber-600' : t.type === 'income' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
        {t.status === 'pending' ? <Clock className="w-4 h-4" /> : t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          {t.ref_id && <span className="font-mono text-[9px] font-bold text-stone-500 bg-stone-100 px-1 py-0.5 rounded border border-stone-200 leading-none">
              #{t.ref_id}
            </span>}
          <p className={`text-xs font-bold leading-tight ${t.status === 'pending' ? 'text-stone-500' : 'text-stone-800'}`}>
            {t.note || (t.type === 'income' ? 'إيراد' : 'مصروف')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-stone-400 font-medium">
          <span>
            {new Date(t.date).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
          })}
          </span>
          <span>•</span>
          <span>{t.created_by}</span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-3 pl-1">
      <span className={`text-xs font-black dir-ltr ${t.status === 'pending' ? 'text-stone-400' : t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
      </span>
      
      {isAdmin && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {t.status === 'pending' && <button onClick={() => onApprove(t.id)} className="p-1 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"><CheckCircle className="w-3 h-3" /></button>}
          <button onClick={() => onDelete(t.id)} className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
        </div>}
    </div>
  </div>;
const AuditItem = ({
  audit,
  onClick,
  onDelete,
  isAdmin
}) => {
  const isDiff = Math.abs(audit.difference) > 0.01;
  const time = new Date(audit.completed_at || audit.requested_at).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const date = new Date(audit.completed_at || audit.requested_at).toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'short'
  });
  return <div className="group relative my-6">
      <div onClick={() => onClick(audit)} className="relative overflow-hidden rounded-[2rem] bg-amber-50 border border-amber-200 transition-all cursor-pointer hover:-translate-y-1 shadow-md hover:shadow-xl">
        {/* Header - Status and Date */}
        <div className={`px-6 py-4 flex justify-between items-center border-b border-amber-100/50 bg-amber-100/30`}>
           <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isDiff ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isDiff ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
              <span className={`font-bold text-sm tracking-wide ${isDiff ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isDiff ? 'تقرير عجز/زيادة' : 'تقرير جرد مطابق'}
              </span>
           </div>
           <span className="text-amber-600 text-xs font-mono font-bold">{date} • {time}</span>
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col items-center justify-center">
          {/* Audit ID - Large and Prominent */}
          <div className="mb-6">
            <span className="text-4xl font-black text-amber-900/20 tracking-widest font-mono">
              #{audit.id.slice(0, 6)}
            </span>
          </div>

           <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
              
              {/* Context (Completed By) */}
              <div className="flex items-center gap-3 justify-center sm:justify-start flex-1 bg-white/50 p-3 rounded-2xl border border-amber-100">
                 <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200">
                    <User className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] text-amber-500 font-bold uppercase mb-0.5">الموظف</p>
                    <p className="text-sm font-bold text-amber-900">{audit.completed_by || 'Unknown'}</p>
                 </div>
              </div>

              {/* Key Metrics */}
              <div className="flex items-center gap-8 justify-center flex-[2]">
                 <div className="text-center">
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">المتوقع</p>
                    <p className="text-lg font-mono font-bold text-amber-800">{Number(audit.system_balance).toLocaleString()}</p>
                 </div>
                 
                 <div className="w-px h-10 bg-amber-200"></div>

                 <div className="text-center relative">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDiff ? 'text-rose-500' : 'text-emerald-500'}`}>
                      الفعلي
                    </p>
                    <p className={`text-2xl font-mono font-black ${isDiff ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {Number(audit.total_counted).toLocaleString()}
                    </p>
                    {isDiff && <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full dir-ltr border border-rose-200">
                             {audit.difference > 0 ? '+' : ''}{Number(audit.difference).toLocaleString()}
                          </span>
                       </div>}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Delete Action (Hover only) */}
      {isAdmin && <button onClick={e => onDelete(e, audit.id)} className="absolute -top-3 -left-3 bg-white text-stone-400 hover:text-rose-500 p-2.5 rounded-xl shadow-lg border border-stone-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10">
          <Trash2 className="w-4 h-4" />
        </button>}
    </div>;
};

// --- Main Component ---

const KhaznaTool = ({
  currentUser
}) => {
  const [transactions, setTransactions] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('income');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    note: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Audit Flow State
  const [pendingAudit, setPendingAudit] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const {
    toast
  } = useToast();
  const isAdmin = currentUser?.role === 'admin';

  // --- Data Fetching ---

  const fetchData = useCallback(async () => {
    try {
      const {
        data: txnData,
        error: txnError
      } = await supabase.from('transactions').select('*').order('date', {
        ascending: false
      });
      if (txnError) throw txnError;
      const {
        data: auditData,
        error: auditError
      } = await supabase.from('audit_requests').select('*').order('requested_at', {
        ascending: false
      });
      if (auditError) throw auditError;
      setTransactions(txnData || []);
      setAudits(auditData || []);
      const pending = auditData?.find(a => a.status === 'pending');
      setPendingAudit(pending || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ",
        description: "تعذر تحديث البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchData();
    const sub1 = supabase.channel('t_updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'transactions'
    }, fetchData).subscribe();
    const sub2 = supabase.channel('a_updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'audit_requests'
    }, fetchData).subscribe();
    return () => {
      supabase.removeChannel(sub1);
      supabase.removeChannel(sub2);
    };
  }, [fetchData]);

  // --- Actions ---

  const handleAddTransaction = async e => {
    e.preventDefault();
    if (!newTransaction.amount) return;
    const isExpense = transactionType === 'expense';
    const status = isExpense && !isAdmin ? 'pending' : 'approved';
    try {
      const {
        error
      } = await supabase.from('transactions').insert([{
        amount: parseFloat(newTransaction.amount),
        type: transactionType,
        note: newTransaction.note,
        date: new Date().toISOString(),
        created_by: currentUser?.name || 'Unknown',
        status
      }]);
      if (error) throw error;
      fetchData();
      setIsDialogOpen(false);
      setNewTransaction({
        amount: '',
        note: ''
      });
      setSelectedMonth(new Date().toISOString().slice(0, 7));
      toast({
        title: status === 'pending' ? "تم الإرسال للموافقة" : "تم الحفظ بنجاح",
        className: status === 'pending' ? "bg-amber-50" : "bg-white"
      });
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل الحفظ",
        variant: "destructive"
      });
    }
  };
  const handleDeleteTransaction = async id => {
    if (!isAdmin) return;
    try {
      await supabase.from('transactions').delete().eq('id', id);
      fetchData();
      toast({
        title: "تم الحذف",
        description: "تم حذف العملية بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    }
  };
  const handleApproveTransaction = async id => {
    if (!isAdmin) return;
    try {
      await supabase.from('transactions').update({
        status: 'approved'
      }).eq('id', id);
      fetchData();
      toast({
        title: "تم الاعتماد",
        description: "تم اعتماد المصروف"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل التحديث",
        variant: "destructive"
      });
    }
  };
  const handleRequestAudit = async () => {
    if (!isAdmin) return;
    if (pendingAudit) return;
    try {
      const {
        error
      } = await supabase.from('audit_requests').insert([{
        status: 'pending'
      }]);
      if (error) throw error;
      fetchData();
      toast({
        title: "تم",
        description: "تم إرسال طلب الجرد للموظفين"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل إرسال الطلب",
        variant: "destructive"
      });
    }
  };
  const handleDeleteAudit = async (e, id) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا الجرد؟')) return;
    try {
      const {
        error
      } = await supabase.from('audit_requests').delete().eq('id', id);
      if (error) throw error;
      fetchData();
      toast({
        title: "تم الحذف",
        description: "تم حذف سجل الجرد بنجاح"
      });
    } catch (err) {
      toast({
        title: "خطأ",
        variant: "destructive",
        description: "فشل حذف الجرد"
      });
    }
  };

  // --- Data Processing for View ---

  const balance = transactions.filter(t => t.status === 'approved').reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  // Merge and Filter List
  const combinedList = useMemo(() => {
    const txnList = transactions.map(t => ({
      ...t,
      itemType: 'transaction',
      sortDate: t.date
    }));
    const auditList = audits.filter(a => a.status !== 'pending').map(a => ({
      ...a,
      itemType: 'audit',
      sortDate: a.completed_at || a.requested_at
    }));
    let all = [...txnList, ...auditList].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
    return all.filter(item => {
      const d = item.sortDate;
      if (!d) return false;
      const matchesMonth = d.startsWith(selectedMonth);
      let matchesSearch = true;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (item.itemType === 'transaction') {
          matchesSearch = (item.note || '').toLowerCase().includes(q) || item.amount.toString().includes(q);
          if (item.ref_id && item.ref_id.toString().includes(q)) matchesSearch = true;
        } else {
          matchesSearch = item.id.includes(q) || (item.completed_by || '').toLowerCase().includes(q);
        }
      }
      return matchesMonth && matchesSearch;
    });
  }, [transactions, audits, selectedMonth, searchQuery]);

  // Updated Grouping Logic:
  const timelineItems = useMemo(() => {
    const items = [];
    let currentDayGroup = {
      type: 'day',
      date: null,
      transactions: []
    };
    combinedList.forEach(item => {
      if (item.itemType === 'audit') {
        if (currentDayGroup.transactions.length > 0) {
          items.push({
            ...currentDayGroup
          });
          currentDayGroup = {
            type: 'day',
            date: null,
            transactions: []
          };
        }
        items.push({
          type: 'audit',
          data: item
        });
      } else {
        const itemDay = item.sortDate.split('T')[0];
        if (!currentDayGroup.date) {
          currentDayGroup.date = itemDay;
          currentDayGroup.transactions.push(item);
        } else if (currentDayGroup.date === itemDay) {
          currentDayGroup.transactions.push(item);
        } else {
          items.push({
            ...currentDayGroup
          });
          currentDayGroup = {
            type: 'day',
            date: itemDay,
            transactions: [item]
          };
        }
      }
    });
    if (currentDayGroup.transactions.length > 0) {
      items.push({
        ...currentDayGroup
      });
    }
    return items;
  }, [combinedList]);

  // Monthly Stats
  const monthStats = useMemo(() => {
    const monthTxns = transactions.filter(t => t.date.startsWith(selectedMonth) && t.status === 'approved');
    return {
      income: monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    };
  }, [transactions, selectedMonth]);

  // Calculate Daily Stats Helper
  const getDayStats = dayDate => {
    const dayTxns = transactions.filter(t => t.date.startsWith(dayDate) && t.status === 'approved');
    const income = dayTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum - t.amount, 0);
    const net = income + expense;
    const allPriorTxns = transactions.filter(t => new Date(t.date) <= new Date(dayDate + 'T23:59:59') && t.status === 'approved');
    const closingBalance = allPriorTxns.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    return {
      net,
      closingBalance
    };
  };
  const getDayLabel = dateStr => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'اليوم';
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    if (d.getTime() === yest.getTime()) return 'أمس';
    return d.toLocaleDateString('ar-SA', {
      weekday: 'long'
    });
  };
  const getDayDate = dateStr => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'short'
    });
  };
  const months = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        val: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('ar-SA', {
          month: 'short',
          year: '2-digit'
        })
      });
    }
    return list;
  }, []);
  return <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <KhaznaAudit isOpen={!!pendingAudit && !isAdmin} auditRequest={pendingAudit} currentBalance={balance} currentUser={currentUser} onComplete={fetchData} />

      <AuditDetailsDialog isOpen={!!selectedAudit} audit={selectedAudit} onClose={() => setSelectedAudit(null)} onResolve={fetchData} />

      {/* Hero Balance Card */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-8 py-2">
          <div className="bg-white/10 px-5 py-2 rounded-full text-xs font-medium border border-white/10 backdrop-blur-md flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>الرصيد الحالي</span>
          </div>
          <div className="flex items-baseline gap-1" dir="ltr">
             <span className="text-4xl font-light text-indigo-200 opacity-60">$</span>
             <h1 className="text-7xl font-bold tracking-tighter">{balance.toLocaleString()}</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <button onClick={() => {
            setTransactionType('income');
            setIsDialogOpen(true);
          }} className="bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-1">
               <div className="bg-white/20 p-1 rounded-lg"><Plus className="w-4 h-4" /></div> إيراد
            </button>
            <button onClick={() => {
            setTransactionType('expense');
            setIsDialogOpen(true);
          }} className="bg-rose-500 hover:bg-rose-400 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-rose-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-1">
               <div className="bg-white/20 p-1 rounded-lg"><Minus className="w-4 h-4" /></div> مصروف
            </button>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-stone-100 flex flex-col gap-3">
        <div className="flex items-center gap-2 p-1">
          <div className="relative flex-1 bg-stone-50 rounded-xl overflow-hidden group border border-transparent focus-within:border-stone-200 focus-within:bg-white transition-all">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-600" />
            <input type="text" placeholder="بحث في العمليات..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-transparent p-3 pr-10 text-sm font-bold outline-none placeholder:text-stone-400" />
          </div>
          {isAdmin && <Button onClick={handleRequestAudit} disabled={!!pendingAudit} variant={pendingAudit ? "secondary" : "outline"} className={`rounded-xl border-dashed border-2 px-4 h-11 gap-2 shrink-0 ${pendingAudit ? 'border-amber-400 text-amber-600 bg-amber-50 opacity-70 cursor-not-allowed' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`} title={pendingAudit ? "يوجد طلب جرد معلق" : "طلب جرد"}>
               <ClipboardList className="w-4 h-4" />
               <span className="hidden sm:inline text-xs font-bold">{pendingAudit ? "تم طلب الجرد" : "طلب جرد"}</span>
             </Button>}
        </div>
        <div className="flex items-center justify-between px-1 gap-4 overflow-hidden">
           <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar flex-1 mask-linear-fade">
              {months.map(m => <button key={m.val} onClick={() => setSelectedMonth(m.val)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedMonth === m.val ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}>
                  {m.label}
                </button>)}
           </div>
           <div className="shrink-0 pl-1 border-l border-stone-100">
              <MonthlyStats income={monthStats.income} expense={monthStats.expense} />
           </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="space-y-8">
        {loading ? <div className="text-center py-10 text-stone-400 text-sm">جاري التحميل...</div> : timelineItems.length === 0 ? <div className="text-center py-16 bg-white rounded-[2rem] border border-stone-100 shadow-sm">
             <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300 mb-4"><History className="w-8 h-8" /></div>
             <p className="text-stone-500 font-bold">لا توجد عمليات في هذا الشهر</p>
          </div> : timelineItems.map((item, idx) => {
        if (item.type === 'audit') {
          return <AuditItem key={item.data.id} audit={item.data} isAdmin={isAdmin} onDelete={handleDeleteAudit} onClick={() => isAdmin && setSelectedAudit(item.data)} />;
        } else {
          // Day Card with Transactions
          const stats = getDayStats(item.date);
          const incomeTxns = item.transactions.filter(t => t.type === 'income');
          const expenseTxns = item.transactions.filter(t => t.type === 'expense');
          return <div key={`${item.date}-${idx}`} className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden mb-8">
                   
                   {/* Redesigned High Contrast Header */}
                   <div className="bg-slate-900 p-6 flex items-center justify-between relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-indigo-900/20 to-transparent pointer-events-none" />
                       
                       {/* Date Block: Visually Right in RTL (now with calendar on right) */}
                       <div className="flex items-center gap-4 relative z-10">
                          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-lg">
                             <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-right">
                             <h3 className="text-2xl font-black text-white leading-none mb-1.5 tracking-tight">{getDayLabel(item.date)}</h3>
                             <div className="flex items-center justify-end gap-2 text-slate-400 text-sm font-bold font-mono">
                                <span>{getDayDate(item.date)}</span> {/* Date first */}
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span>{item.transactions.length} عملية</span> {/* Operations count second */}
                             </div>
                          </div>
                       </div>
                       
                       {/* Stats Block: Visually Left in RTL */}
                       <div className="flex items-center gap-6 relative z-10">
                          <div className="flex flex-col items-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">الصافي</span>
                              <span className={`text-xl font-mono font-bold tracking-tight ${stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {stats.net > 0 ? '+' : ''}{stats.net.toLocaleString()}
                              </span>
                          </div>
                          <div className="w-px h-8 bg-slate-800"></div>
                          <div className="flex flex-col items-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">الإغلاق</span>
                              <span className="text-xl font-mono font-bold tracking-tight text-white">
                                 {stats.closingBalance.toLocaleString()}
                              </span>
                          </div>
                       </div>

                   </div>
                   
                   {/* Split Transactions List */}
                   <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-stone-100">
                      {/* Income Section (Right in RTL) */}
                      <div className="flex-1 p-3 sm:p-5 space-y-2 bg-emerald-50/5">
                         {incomeTxns.length > 0 ? incomeTxns.map(t => <TransactionItem key={t.id} t={t} isAdmin={isAdmin} onDelete={handleDeleteTransaction} onApprove={handleApproveTransaction} />) : <div className="text-center py-8 border-2 border-dashed border-emerald-100/50 rounded-2xl bg-emerald-50/10">
                               <p className="text-emerald-300 text-xs font-bold">لا توجد إيرادات مسجلة</p>
                            </div>}
                      </div>

                      {/* Expense Section (Left in RTL) */}
                      <div className="flex-1 p-3 sm:p-5 space-y-2 bg-rose-50/5">
                         {expenseTxns.length > 0 ? expenseTxns.map(t => <TransactionItem key={t.id} t={t} isAdmin={isAdmin} onDelete={handleDeleteTransaction} onApprove={handleApproveTransaction} />) : <div className="text-center py-8 border-2 border-dashed border-rose-100/50 rounded-2xl bg-rose-50/10">
                                <p className="text-rose-300 text-xs font-bold">لا توجد مصروفات مسجلة</p>
                            </div>}
                      </div>
                   </div>
                </div>;
        }
      })}
      </div>

      {/* Add Transaction Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xs bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
          <div className={`p-6 ${transactionType === 'income' ? 'bg-emerald-600' : 'bg-rose-600'} transition-colors`}>
            <DialogHeader><DialogTitle className="text-white flex items-center gap-2 text-lg">{transactionType === 'income' ? 'إيراد جديد' : 'مصروف جديد'}</DialogTitle></DialogHeader>
          </div>
          <form onSubmit={handleAddTransaction} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 mb-2 block">المبلغ</label>
                <div className="relative group">
                  <input type="number" step="0.01" required autoFocus className="w-full text-4xl p-4 pl-12 bg-stone-50 rounded-2xl font-bold text-stone-800 outline-none focus:ring-2 focus:ring-stone-200 transition-all" value={newTransaction.amount} onChange={e => setNewTransaction({
                  ...newTransaction,
                  amount: e.target.value
                })} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 font-bold text-xl">$</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 mb-2 block">ملاحظات</label>
                <textarea rows="3" className="w-full p-4 bg-stone-50 rounded-2xl resize-none font-medium outline-none focus:ring-2 focus:ring-stone-200 transition-all" value={newTransaction.note} onChange={e => setNewTransaction({
                ...newTransaction,
                note: e.target.value
              })} placeholder="وصف للعملية..." />
              </div>
            </div>
            <Button type="submit" className={`w-full py-7 text-lg font-bold rounded-2xl shadow-lg transition-transform active:scale-95 ${transactionType === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-200'}`}>حفظ العملية</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
};
export default KhaznaTool;