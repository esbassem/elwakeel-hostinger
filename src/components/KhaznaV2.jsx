
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Plus, Minus, ArrowRight, ArrowLeft, Save, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ReviewSheet from './ReviewSheet';
import TransactionHistorySheet from './TransactionHistorySheet';

const Khazna = ({ currentUser, onBack }) => {
  const { toast } = useToast();
  const amountInputRef = useRef(null);
  const scrollRef = useRef(null);

  // State for scroll-based animations
  const [isScrolled, setIsScrolled] = useState(false);

  // States for sheets and dialogs
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [step, setStep] = useState(1);
  const [dialogType, setDialogType] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pendingOperations, setPendingOperations] = useState([]);
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Scroll Handler ---
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop } = scrollRef.current;
        setIsScrolled(scrollTop > 50); // Adjust threshold as needed
      }
    };
    const scrollableElement = scrollRef.current;
    scrollableElement?.addEventListener('scroll', handleScroll);
    return () => scrollableElement?.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Helper Functions ---
  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '0'
    }
    return value.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // --- Data Fetching with Pagination ---
  const fetchData = useCallback(async () => {
    try {
      let allTransactions = [];
      let page = 0;
      const pageSize = 1000; // Default Supabase page size
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('id', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allTransactions = [...allTransactions, ...data];
          page++;
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      setTransactions(allTransactions);
    } catch (error) {
      toast({ title: "خطأ فادح", description: "لم نتمكن من جلب جميع الحركات المالية.", variant: "destructive" });
    }
  }, [toast]);


  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    }
    loadInitialData();
    const channel = supabase.channel('khazna-v2-features-multi-approve')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  // --- Memoized Calculations ---
  const pendingTransactions = useMemo(() => transactions.filter(t => t.status === 'pending'), [transactions]);

  const { balance, pendingAmount, projectedBalance } = useMemo(() => {
    const approved = transactions.filter(t => t.status === 'approved');
    const income = approved.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = approved.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = income - expenses;

    const pending = transactions.filter(t => t.status === 'pending');
    const pExpenses = pending.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const pIncomes = pending.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const finalProjectedBalance = currentBalance + pIncomes - pExpenses;
    
    return { balance: currentBalance, pendingAmount: pIncomes + pExpenses, projectedBalance: finalProjectedBalance };
  }, [transactions]);

  const { monthlyTotal, filteredTransactions } = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const filtered = transactions
      .filter(d => {
        const saleDate = new Date(d.date);
        return saleDate.getMonth() === month && saleDate.getFullYear() === year;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    return { monthlyTotal: total, filteredTransactions: filtered };
  }, [currentDate, transactions]);

  const monthName = currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  }, [currentDate]);

  // --- Month Switcher Logic ---
  const handleMonthChange = (increment) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  // --- CRUD Handlers ---
  const handleUpdateStatus = async (ids, status, successMessage) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('transactions').update({ status: status, approver: currentUser?.name || 'System' }).in('id', ids);
      if (error) throw error;
      toast({ title: "نجاح", description: `${successMessage} ${ids.length} عملية بنجاح.`, className: "bg-green-100 border-green-200" });
      setSelectedReview([]);
      if(pendingTransactions.length - ids.length === 0) setIsReviewSheetOpen(false);
    } catch (error) {
      toast({ title: "خطأ", description: "فشلت عملية تحديث الحالات.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };
  const handleApprove = () => handleUpdateStatus(selectedReview, 'approved', 'تمت الموافقة على');
  const handleReject = () => handleUpdateStatus(selectedReview, 'rejected', 'تم رفض');

  // --- Sheet Opening/Closing ---
  const handleOpenSheet = () => {
    setStep(1);
    setDialogType(null); 
    setAmount('');
    setDescription('');
    setPendingOperations([]);
    setIsSheetOpen(true);
    setTimeout(() => amountInputRef.current?.focus(), 400); 
  };

  // --- Multi-Step Form Logic (inside sheet) ---
  const reviewOperations = useMemo(() => {
    const currentOperation = { id: 'current', amount: parseFloat(amount) || 0, type: dialogType, note: description };
    return [currentOperation, ...pendingOperations];
  }, [amount, description, dialogType, pendingOperations]);

  const totals = useMemo(() => {
    const income = reviewOperations.filter(op => op.type === 'income').reduce((sum, op) => sum + (op.amount || 0), 0);
    const expense = reviewOperations.filter(op => op.type === 'expense').reduce((sum, op) => sum + (op.amount || 0), 0);
    const validOps = reviewOperations.filter(op => op.amount > 0 && op.note && op.note.trim() && op.type);
    return { totalIncome: income, totalExpense: expense, net: income - expense, count: validOps.length };
  }, [reviewOperations]);

  const changeStep = (newStep) => setStep(newStep);
  
  const handleProceedToReview = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "المبلغ مطلوب", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "البيان مطلوب", variant: "destructive" });
      return;
    }
    if (!dialogType) {
      toast({ title: "النوع مطلوب", variant: "destructive" });
      return;
    }
    changeStep(2);
  };

  const handleAddNewAndGoBack = () => {
    const newOperation = { id: Date.now(), amount: parseFloat(amount), type: dialogType, note: description.trim(), created_by: currentUser?.name || 'System' };
    setPendingOperations(prev => [newOperation, ...prev]);
    setAmount('');
    setDescription('');
    setDialogType(null);
    changeStep(1);
    setTimeout(() => amountInputRef.current?.focus(), 400);
  };

  const handleRemoveOperation = (idToRemove) => {
    setPendingOperations(prev => prev.filter(op => op.id !== idToRemove));
  };

  const handleSaveAll = async () => {
    const validOperations = reviewOperations.filter(op => op.amount > 0 && op.note && op.note.trim() && op.type);
    if (validOperations.length === 0) {
      toast({ title: "لا توجد عمليات للحفظ", variant: "destructive" });
      return;
    }
    const saveDate = new Date().toISOString();
    const operationsToSave = validOperations.map(({ id, ...rest }) => ({ ...rest, date: saveDate, created_by: rest.created_by || currentUser?.name || 'System', status: rest.type === 'income' ? 'approved' : 'pending' })).reverse();
    try {
      const { error } = await supabase.from('transactions').insert(operationsToSave);
      if (error) throw error;
      toast({ title: "تم الحفظ بنجاح", description: `تم تسجيل ${operationsToSave.length} عملية جديدة.`, className: "bg-green-100 border-green-200" });
      setIsSheetOpen(false);
    } catch (error) {
      toast({ title: "خطأ فادح", description: "لم نتمكن من حفظ الحركات.", variant: "destructive" });
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632);
    setAmount(val.replace(/[^0-9]/g, ''));
  };

  const formatNumber = (numStr) => !numStr ? '' : Number(numStr).toLocaleString('en-US');
  const stepVariants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto bg-charcoal-blue">
      {/* --- Sticky Header --- */}
      <motion.header 
        className="sticky top-0 z-20 flex items-center justify-between p-2.5 bg-charcoal-blue/80 backdrop-blur-sm"
        initial={false}
        animate={{ opacity: isScrolled ? 1 : 0, y: isScrolled ? 0 : -20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-white hover:bg-white/10 hover:text-white">
            <ChevronRight className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold text-white">الخزنة</h2>
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* Main Balance Display */}
        <motion.div 
          className="text-center text-white pt-2 pb-8"
          initial={false}
          animate={{ scale: isScrolled ? 0.9 : 1, opacity: isScrolled ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm text-slate-300">الرصيد المتاح</p>
          <p className="text-5xl font-extrabold tracking-tighter">{formatCurrency(balance)}</p>
          {pendingAmount > 0 && (
            <button onClick={() => setIsReviewSheetOpen(true)} className="mt-3 text-xs text-slate-200 bg-white/5 rounded-full px-3 py-1 hover:bg-white/10">
              <span>قيد المراجعة: <span className="font-semibold text-amber-300">{formatCurrency(pendingAmount)}</span></span>
              <span className='mx-1.5 opacity-50'>•</span>
              <span>المتوقع: <span className="font-semibold text-white">{formatCurrency(projectedBalance)}</span></span>
            </button>
          )}
        </motion.div>

        {/* White Content Card */}
        <div className="bg-white rounded-t-[2rem] shadow-lg p-4 sm:p-6 w-full min-h-[calc(100vh-150px)]">
          <div className="w-full max-w-3xl mx-auto">
            {/* Month Switcher & Add Button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Button onClick={() => handleMonthChange(1)} variant="secondary" size="icon" className="rounded-full h-8 w-8" disabled={isCurrentMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="text-sm font-bold text-slate-800 w-28 text-center tabular-nums">{monthName}</h2>
                <Button onClick={() => handleMonthChange(-1)} variant="secondary" size="icon" className="rounded-full h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleOpenSheet} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-9">
                <Plus className="ml-2 h-4 w-4" />
                إضافة عملية
              </Button>
            </div>

            {/* Transactions List */}
            <div className="border-t border-slate-200">
              {loading ? (
                  <div className="text-center py-10 flex justify-center"><Loader2 className="w-8 h-8 text-slate-400 animate-spin"/></div>
              ) : filteredTransactions.length > 0 ? (
                  <div className="divide-y divide-slate-200/80">
                    {filteredTransactions.map(t => (
                        <div key={t.id} className="flex items-center gap-3 py-4 px-1">
                            <div className={cn('flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg', t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                                {t.type === 'income' ? <ArrowUp className="w-4 h-4"/> : <ArrowDown className="w-4 h-4"/>}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 text-sm text-right" dir="rtl">{t.note}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{new Date(t.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} - {t.created_by}</p>
                            </div>
                            <div className={cn("font-bold text-sm text-left font-mono", t.type === 'income' ? 'text-green-600' : 'text-red-500')}>
                                {t.status !== 'approved' && <span className="text-xs text-amber-500 font-sans mr-1">(معلق)</span>}
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <div className="text-center py-16">
                      <p className="font-medium text-slate-600">لا توجد حركات لهذا الشهر</p>
                      <p className="text-sm text-slate-400 mt-1">جرّب تغيير الشهر أو أضف حركة جديدة</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- ALL THE SHEETS --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="left" className="bg-white p-0 w-full sm:max-w-md border-r overflow-hidden flex flex-col" hideCloseButton>
            <AnimatePresence initial={false} mode="wait">
                <motion.div key={step} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }} className="w-full h-full flex flex-col">
                  {step === 1 && (
                      <>
                        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                            <div className='w-10' /><h2 className="text-xl font-bold text-slate-800">إضافة عملية</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="rounded-full"><X className="w-6 h-6 text-slate-600" /></Button>
                        </header>
                        <main className="flex-grow p-6 overflow-y-auto">
                            <Input id="amount" type="tel" ref={amountInputRef} value={formatNumber(amount)} onChange={handleAmountChange} placeholder="0" className="h-20 text-5xl text-center font-bold bg-slate-100 text-slate-800 border-2 border-transparent rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 mb-4" />
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اكتب هنا تفاصيل العملية..." className="w-full resize-none text-base bg-white border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 mb-4 text-right" rows={3} dir="rtl" />
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setDialogType('expense')} className={cn('py-4 rounded-xl font-semibold transition-colors border-2 text-base flex items-center justify-center gap-2', dialogType === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-700 border-slate-200')}><Minus className="w-5 h-5"/>مصروف</button>
                                <button onClick={() => setDialogType('income')} className={cn('py-4 rounded-xl font-semibold transition-colors border-2 text-base flex items-center justify-center gap-2', dialogType === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-700 border-slate-200')}><Plus className="w-5 h-5"/>إيراد</button>
                            </div>
                        </main>
                        <footer className="flex-shrink-0 p-4 border-t bg-white border-slate-200"><div className={cn("grid gap-3", pendingOperations.length > 0 ? "grid-cols-2" : "grid-cols-1")} dir="rtl">{pendingOperations.length > 0 && (<Button variant="outline" onClick={() => changeStep(2)} className="h-12 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2"><span>الرجوع للمراجعة ({pendingOperations.length})</span><ArrowRight className="w-5 h-5" /></Button>)}<Button onClick={handleProceedToReview} className="h-12 text-base font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2"><span>متابعة</span><ArrowLeft className="w-5 h-5" /></Button></div></footer>
                      </>
                  )}
                  {step === 2 && (
                      <>
                        <header className="flex-shrink-0 flex items-center justify-end p-4 bg-slate-50 border-b border-slate-200" dir="rtl">
                            <Button variant="ghost" size="icon" onClick={() => changeStep(1)} className="rounded-full mr-4"><ArrowRight className="w-6 h-6 text-slate-600" /></Button>
                            <h2 className="flex-grow text-xl font-bold text-slate-800 text-right">مراجعة وحفظ</h2>
                        </header>
                        <main className="flex-grow flex flex-col min-h-0 bg-slate-50" dir="rtl"><div className="p-4 bg-slate-100 border-b border-slate-200"><div className="grid grid-cols-3 gap-3 text-center items-end"><div><p className="text-sm text-slate-500">الإيرادات</p><p className="font-semibold text-green-500 text-lg opacity-90">{formatCurrency(totals.totalIncome)}</p></div><div className="pb-1"><p className="text-base font-bold text-slate-800">الصافي</p><p className={cn("font-extrabold text-3xl tracking-tighter", totals.net >= 0 ? 'text-slate-900' : 'text-red-600')}>{formatCurrency(totals.net)}</p></div><div><p className="text-sm text-slate-500">المصروفات</p><p className="font-semibold text-red-500 text-lg opacity-90">{formatCurrency(totals.totalExpense)}</p></div></div></div>
                          <div className="flex-grow overflow-y-auto p-4 space-y-2">{reviewOperations.map((op) => (<div key={op.id} className={cn("flex items-center gap-3 bg-white p-2.5 rounded-lg border shadow-sm", op.id === 'current' ? "border-blue-500 border-2" : "border-slate-200")}><div className={cn('flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg', op.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>{op.type === 'income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}</div><div className="flex-1 overflow-hidden"><p className="font-medium text-slate-800 text-sm truncate text-right">{op.note}</p><p className={cn("font-semibold text-xs text-right", op.type === 'income' ? 'text-green-600' : 'text-red-500')}>{formatCurrency(op.amount)}</p></div>{op.id !== 'current' && (<Button variant="ghost" size="icon" onClick={() => handleRemoveOperation(op.id)} className="text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-full w-8 h-8"><Trash2 className="w-4 h-4" /></Button>)}</div>))}
                          </div>
                        </main>
                        <footer className="flex-shrink-0 p-4 grid grid-cols-2 gap-3 border-t bg-white border-slate-200" dir="rtl"><Button onClick={handleSaveAll} className="h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white" disabled={totals.count === 0}><Save className="w-5 h-5 ml-2" /><span>حفظ ({totals.count})</span></Button><Button onClick={handleAddNewAndGoBack} className="h-12 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white"><Plus className="w-5 h-5 ml-2" />إضافة عملية جديدة</Button></footer>
                      </>
                  )}
                </motion.div>
            </AnimatePresence>
        </SheetContent>
      </Sheet>

      <ReviewSheet open={isReviewSheetOpen} onOpenChange={setIsReviewSheetOpen} transactions={pendingTransactions} formatCurrency={formatCurrency} selected={selectedReview} onSelectedChange={setSelectedReview} onApprove={handleApprove} onReject={handleReject} isUpdating={isUpdating} />
      <TransactionHistorySheet open={isHistorySheetOpen} onOpenChange={setIsHistorySheetOpen} transactions={transactions} />
    </div>
  );
};

export default Khazna;
