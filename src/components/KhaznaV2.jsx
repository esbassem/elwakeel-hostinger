import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowUp, ArrowDown, Plus, Minus, ArrowRight, ArrowLeft, Save, Trash2, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ReviewSheet from './ReviewSheet';
import TransactionHistorySheet from './TransactionHistorySheet';

const KhaznaV2 = ({ currentUser }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const amountInputRef = useRef(null);

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
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return ''
    }
    return value.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast({ title: "خطأ", description: "لم نتمكن من جلب الحركات المالية.", variant: "destructive" });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
          fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const pendingTransactions = useMemo(() => transactions.filter(t => t.status === 'pending'), [transactions]);

  const { balance, pendingAmount, projectedBalance } = useMemo(() => {
      const approved = transactions.filter(t => t.status === 'approved');
      const pending = transactions.filter(t => t.status === 'pending');
      const income = approved.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = approved.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const currentBalance = income - expenses;
      const pExpenses = pending.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const pIncomes = pending.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const finalProjectedBalance = currentBalance + pIncomes - pExpenses;
      return { balance: currentBalance, pendingAmount: pIncomes + pExpenses, projectedBalance: finalProjectedBalance };
  }, [transactions]);

  const visibleTransactions = useMemo(() => 
    transactions.filter(t => t.status !== 'rejected').slice(0, 15)
  , [transactions]);

  const reviewOperations = useMemo(() => {
    const currentOperation = {
      id: 'current',
      amount: parseFloat(amount) || 0,
      type: dialogType,
      note: description,
    };
    return [currentOperation, ...pendingOperations];
  }, [amount, description, dialogType, pendingOperations]);

  const totals = useMemo(() => {
    const income = reviewOperations
      .filter(op => op.type === 'income')
      .reduce((sum, op) => sum + (op.amount || 0), 0);

    const expense = reviewOperations
      .filter(op => op.type === 'expense')
      .reduce((sum, op) => sum + (op.amount || 0), 0);
      
    const validOps = reviewOperations.filter(op => op.amount > 0 && op.note && op.note.trim() && op.type);

    return {
      totalIncome: income,
      totalExpense: expense,
      net: income - expense,
      count: validOps.length,
    };
  }, [reviewOperations]);

  const handleUpdateStatus = async (ids, status, successMessage) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: status, approver: currentUser?.name || 'System' })
        .in('id', ids);

      if (error) throw error;

      toast({ 
        title: "نجاح", 
        description: `${successMessage} ${ids.length} عملية بنجاح.`,
        className: "bg-green-100 border-green-200"
      });

      setSelectedReview([]);
      if(pendingTransactions.length - ids.length === 0) {
        setIsReviewSheetOpen(false);
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشلت عملية تحديث الحالات.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = () => {
    handleUpdateStatus(selectedReview, 'approved', 'تمت الموافقة على');
  };

  const handleReject = () => {
    handleUpdateStatus(selectedReview, 'rejected', 'تم رفض');
  };

  const handleOpenSheet = () => {
    setStep(1);
    setDialogType(null); 
    setAmount('');
    setDescription('');
    setPendingOperations([]);
    setIsSheetOpen(true);
    setTimeout(() => amountInputRef.current?.focus(), 400); 
  };

  const changeStep = (newStep) => {
    setStep(newStep);
  };
  
  const handleProceedToReview = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "المبلغ مطلوب", description: "يرجى إدخال مبلغ صحيح.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "البيان مطلوب", description: "يرجى كتابة وصف للعملية.", variant: "destructive" });
      return;
    }
    if (!dialogType) {
      toast({ title: "النوع مطلوب", description: "يرجى تحديد مصروف أو إيراد أولاً.", variant: "destructive" });
      return;
    }
    changeStep(2);
  };

  const handleAddNewAndGoBack = () => {
    const newOperation = {
        id: Date.now(),
        amount: parseFloat(amount), 
        type: dialogType, 
        note: description.trim(),
        created_by: currentUser?.name || 'System'
    };
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
      toast({ title: "لا توجد عمليات للحفظ", description: "الرجاء إضافة عملية صحيحة واحدة على الأقل.", variant: "destructive" });
      return;
    }
    
    const saveDate = new Date().toISOString();
    const operationsToSave = validOperations.map(({ id, ...rest }) => ({
        ...rest,
        date: saveDate,
        created_by: rest.created_by || currentUser?.name || 'System',
        status: rest.type === 'income' ? 'approved' : 'pending'
    })).reverse();

    try {
        const { error } = await supabase.from('transactions').insert(operationsToSave);
        if (error) throw error;
        
        toast({ 
            title: "تم الحفظ بنجاح", 
            description: `تم تسجيل ${operationsToSave.length} عملية جديدة بنجاح.`,
            className: "bg-green-100 border-green-200" 
        });
        setIsSheetOpen(false);
    } catch (error) {
        toast({ title: "خطأ فادح", description: "لم نتمكن من حفظ الحركات في قاعدة البيانات.", variant: "destructive" });
    }
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const latinVal = val.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632);
    const numericValue = latinVal.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const formatNumber = (numStr) => {
    if (!numStr) return '';
    return Number(numStr).toLocaleString('en-US');
  };
  
  const stepVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className={cn("min-h-screen bg-slate-100 text-slate-900", (isSheetOpen || isReviewSheetOpen || isHistorySheetOpen) && "h-screen overflow-y-hidden")}>
      <header className="p-2 flex justify-end items-center sticky top-0 bg-slate-100/80 backdrop-blur-sm z-10">
         <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ChevronRight className="w-7 h-7 text-slate-600" />
         </Button>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div className="pt-6 pb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">الخزنة</h1>
            <div className="mt-6 relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
              <p className="text-sm text-blue-200">الرصيد المتاح</p>
              <p className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</p>
              <button 
                onClick={handleOpenSheet}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="إضافة عملية جديدة"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
             {pendingAmount > 0 && (
                <button 
                  onClick={() => setIsReviewSheetOpen(true)}
                  className="w-full mt-4 text-center text-xs text-slate-600 bg-amber-100/50 border border-amber-200/60 rounded-lg p-2 hover:bg-amber-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                    <span>قيد المراجعة: <span className="font-semibold text-amber-700">{formatCurrency(pendingAmount)}</span></span>
                    <span className='mx-2'>•</span>
                    <span>المتوقع: <span className="font-semibold text-slate-700">{formatCurrency(projectedBalance)}</span></span>
                </button>
            )}
        </div>

        <div className="mb-10 bg-white/80 rounded-xl border border-slate-200/50 shadow-sm">
            <div className="flex justify-between items-center p-3.5 border-b border-slate-200/70">
                <h3 className="text-base font-bold text-slate-800">آخر العمليات</h3>
                <Button variant="ghost" className="text-sm text-blue-600 h-auto py-1 px-2" onClick={() => setIsHistorySheetOpen(true)}>
                    جميع العمليات
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-10 flex justify-center">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin"/>
                </div>
            ) : visibleTransactions.length > 0 ? (
                <div className="divide-y divide-slate-200/70">
                {visibleTransactions.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-3.5">
                        <div className={cn('flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg', t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                            {t.type === 'income' ? <ArrowUp className="w-4 h-4"/> : <ArrowDown className="w-4 h-4"/>}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-slate-800 text-sm text-right" dir="rtl">{t.note}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{t.created_by}</p>
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
                    <p className="font-medium text-slate-500">لا توجد حركات لعرضها</p>
                    <p className="text-sm text-slate-400 mt-1">ابدأ بإضافة أول حركة مالية</p>
                </div>
            )}
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="left" className="bg-white p-0 w-full sm:max-w-md border-r overflow-hidden flex flex-col" hideCloseButton>
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={step}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="w-full h-full flex flex-col"
                >
                  {step === 1 && (
                      <>
                        <header className="flex-shrink-0 flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                            <div className='w-10' />
                            <h2 className="text-xl font-bold text-slate-800">إضافة عملية</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="rounded-full">
                               <X className="w-6 h-6 text-slate-600" />
                            </Button>
                        </header>
                        <main className="flex-grow p-6 overflow-y-auto">
                            <Input 
                                id="amount" 
                                type="tel"
                                ref={amountInputRef}
                                value={formatNumber(amount)}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="h-20 text-5xl text-center font-bold bg-slate-100 text-slate-800 border-2 border-transparent rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 mb-4"
                            />
                            <Textarea 
                              id="description" 
                              value={description} 
                              onChange={(e) => setDescription(e.target.value)} 
                              placeholder="اكتب هنا تفاصيل العملية..." 
                              className="w-full resize-none text-base bg-white border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 mb-4 text-right" 
                              rows={3}
                              dir="rtl"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setDialogType('expense')} className={cn('py-4 rounded-xl font-semibold transition-colors border-2 text-base flex items-center justify-center gap-2', dialogType === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-700 border-slate-200')}>
                                  <Minus className="w-5 h-5"/>
                                  مصروف
                                </button>
                                <button onClick={() => setDialogType('income')} className={cn('py-4 rounded-xl font-semibold transition-colors border-2 text-base flex items-center justify-center gap-2', dialogType === 'income' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-700 border-slate-200')}>
                                  <Plus className="w-5 h-5"/>
                                  إيراد
                                </button>
                            </div>
                        </main>
                        <footer className="flex-shrink-0 p-4 border-t bg-white border-slate-200">
                           <div className={cn("grid gap-3", pendingOperations.length > 0 ? "grid-cols-2" : "grid-cols-1")} dir="rtl">
                                {pendingOperations.length > 0 && (
                                    <Button variant="outline" onClick={() => changeStep(2)} className="h-12 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2">
                                        <span>الرجوع للمراجعة ({pendingOperations.length})</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                )}
                                <Button onClick={handleProceedToReview} className="h-12 text-base font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2">
                                    <span>متابعة</span>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                           </div>
                        </footer>
                      </>
                  )}
                  {step === 2 && (
                      <>
                        <header className="flex-shrink-0 flex items-center justify-end p-4 bg-slate-50 border-b border-slate-200" dir="rtl">
                            <Button variant="ghost" size="icon" onClick={() => changeStep(1)} className="rounded-full mr-4">
                               <ArrowRight className="w-6 h-6 text-slate-600" />
                            </Button>
                            <h2 className="flex-grow text-xl font-bold text-slate-800 text-right">مراجعة وحفظ</h2>
                        </header>
                        <main className="flex-grow flex flex-col min-h-0 bg-slate-50" dir="rtl">
                          <div className="p-4 bg-slate-100 border-b border-slate-200">
                            <div className="grid grid-cols-3 gap-3 text-center items-end">
                              <div>
                                <p className="text-sm text-slate-500">الإيرادات</p>
                                <p className="font-semibold text-green-500 text-lg opacity-90">{formatCurrency(totals.totalIncome)}</p>
                              </div>
                              <div className="pb-1">
                                <p className="text-base font-bold text-slate-800">الصافي</p>
                                <p className={cn("font-extrabold text-3xl tracking-tighter", totals.net >= 0 ? 'text-slate-900' : 'text-red-600')}>{formatCurrency(totals.net)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">المصروفات</p>
                                <p className="font-semibold text-red-500 text-lg opacity-90">{formatCurrency(totals.totalExpense)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex-grow overflow-y-auto p-4 space-y-2">
                            {reviewOperations.map((op) => (
                              <div
                                key={op.id}
                                className={cn(
                                  "flex items-center gap-3 bg-white p-2.5 rounded-lg border shadow-sm",
                                  op.id === 'current'
                                    ? "border-blue-500 border-2"
                                    : "border-slate-200"
                                )}
                              >
                                <div className={cn('flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg', op.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                                  {op.type === 'income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="font-medium text-slate-800 text-sm truncate text-right">{op.note}</p>
                                  <p className={cn("font-semibold text-xs text-right", op.type === 'income' ? 'text-green-600' : 'text-red-500')}>
                                    {formatCurrency(op.amount)}
                                  </p>
                                </div>
                                {op.id !== 'current' && (
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOperation(op.id)} className="text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-full w-8 h-8">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </main>
                        <footer className="flex-shrink-0 p-4 grid grid-cols-2 gap-3 border-t bg-white border-slate-200" dir="rtl">
                          <Button onClick={handleSaveAll} className="h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white" disabled={totals.count === 0}>
                            <Save className="w-5 h-5 ml-2" />
                            <span>حفظ ({totals.count})</span>
                          </Button>
                          <Button onClick={handleAddNewAndGoBack} className="h-12 text-base font-semibold bg-blue-500 hover:bg-blue-600 text-white">
                            <Plus className="w-5 h-5 ml-2" />
                            إضافة عملية جديدة
                          </Button>
                        </footer>
                      </>
                  )}
                </motion.div>
            </AnimatePresence>
        </SheetContent>
      </Sheet>

      <ReviewSheet 
        open={isReviewSheetOpen} 
        onOpenChange={setIsReviewSheetOpen}
        transactions={pendingTransactions}
        formatCurrency={formatCurrency}
        selected={selectedReview}
        onSelectedChange={setSelectedReview}
        onApprove={handleApprove}
        onReject={handleReject}
        isUpdating={isUpdating}
      />

      <TransactionHistorySheet 
        open={isHistorySheetOpen}
        onOpenChange={setIsHistorySheetOpen}
        transactions={transactions}
      />
    </div>
  );
};

export default KhaznaV2;
