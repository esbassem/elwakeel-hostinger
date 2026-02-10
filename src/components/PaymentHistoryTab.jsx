import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  Loader2, 
  Banknote, 
  CheckCircle2, 
  ArrowDownLeft, 
  Plus,
  Wallet,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentHistoryTab = ({ financeId, currentUser, onRefresh }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Payment Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
     amount: '',
     date: new Date().toISOString().split('T')[0],
     note: ''
  });

  const { toast } = useToast();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_installment_payments')
        .select('*')
        .eq('finance_id', financeId)
        .order('payment_date', { ascending: false });
        
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "خطأ",
        description: "تعذر تحميل سجل المدفوعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (financeId) fetchPayments();
  }, [financeId]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) {
       toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
       return;
    }

    setIsSubmitting(true);
    try {
      // Insert Payment as a general payment (installment_id = NULL)
      const { error: paymentError } = await supabase
        .from('finance_installment_payments')
        .insert({
           finance_id: financeId,
           installment_id: null, // Always null for general payments
           paid_amount: formData.amount,
           payment_date: formData.date,
           note: formData.note,
           created_by: currentUser?.name || 'مستخدم'
        });

      if (paymentError) throw paymentError;

      toast({ 
        title: "تم بنجاح", 
        description: "تم تسجيل الدفعة بنجاح",
        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
      });
      
      setIsAddOpen(false);
      setFormData({ 
        amount: '', 
        date: new Date().toISOString().split('T')[0], 
        note: '' 
      });
      
      fetchPayments();
      if (onRefresh) onRefresh();

    } catch (error) {
       console.error(error);
       toast({ title: "خطأ", description: "فشل في تسجيل الدفعة", variant: "destructive" });
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 relative" dir="rtl">
       
       <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#f8f9fc] z-10 py-2 border-b border-dashed border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            سجل المدفوعات
          </h3>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
             <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-2 h-9 shadow-sm transition-all hover:shadow-md rounded-lg">
                   <Plus className="w-3.5 h-3.5" />
                   إضافة دفعة جديدة
                </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden rounded-xl" dir="rtl">
                <DialogHeader className="p-4 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                         <Wallet className="w-4 h-4" />
                      </div>
                      <DialogTitle className="text-slate-800 text-sm font-bold">تسجيل دفعة مالية</DialogTitle>
                   </div>
                </DialogHeader>
                
                <form onSubmit={handleAddPayment} className="p-5 space-y-5">
                   
                   <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 text-xs text-blue-700 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>سيتم تسجيل هذه الدفعة كدفعة عامة، وسيتم توزيع المبلغ تلقائياً على الأقساط المستحقة بالأقدمية.</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                         <Label htmlFor="amount" className="text-xs font-semibold text-slate-600">المبلغ المدفوع</Label>
                         <div className="relative">
                            <Input 
                               id="amount" 
                               type="number" 
                               placeholder="0.00"
                               className="pl-8 text-left font-mono font-bold text-slate-800 focus:ring-blue-500/20 focus:border-blue-500 h-10 transition-all"
                               value={formData.amount} 
                               onChange={e => setFormData({...formData, amount: e.target.value})}
                               autoFocus
                            />
                            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">د.ل</span>
                         </div>
                      </div>
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                         <Label htmlFor="date" className="text-xs font-semibold text-slate-600">تاريخ الدفع</Label>
                         <div className="relative">
                            <Input 
                               id="date" 
                               type="date" 
                               className="text-right font-mono text-slate-700 h-10 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                               value={formData.date} 
                               onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                            <CalendarDays className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label htmlFor="note" className="text-xs font-semibold text-slate-600">ملاحظات إضافية (اختياري)</Label>
                      <Textarea 
                         id="note" 
                         placeholder="أضف أي تفاصيل إضافية عن عملية الدفع..." 
                         className="min-h-[100px] resize-none focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                         value={formData.note}
                         onChange={e => setFormData({...formData, note: e.target.value})}
                      />
                   </div>

                   <DialogFooter className="pt-2 gap-2 sm:justify-start flex-row-reverse">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px] shadow-lg shadow-slate-200/50"
                      >
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                         تأكيد الدفع
                      </Button>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmitting} className="hover:bg-slate-50 text-slate-600">
                           إلغاء
                        </Button>
                      </DialogClose>
                   </DialogFooter>
                </form>
             </DialogContent>
          </Dialog>
       </div>

       {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
             <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-3" />
             <p className="text-slate-400 text-xs font-bold animate-pulse">جاري تحميل السجل...</p>
          </div>
       ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-100">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Banknote className="w-8 h-8 text-slate-300" />
             </div>
             <h4 className="text-slate-600 font-bold text-sm">لا توجد عمليات دفع مسجلة</h4>
             <p className="text-slate-400 text-xs mt-1 max-w-[250px] text-center">يمكنك إضافة دفعات جديدة باستخدام الزر في الأعلى</p>
          </div>
       ) : (
          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {payments.map((payment, index) => (
                <motion.div 
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                        <ArrowDownLeft className="w-6 h-6" />
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-800 tracking-tight">{Number(payment.paid_amount).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 rounded-md border border-slate-100">د.ل</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="font-mono pt-0.5">
                            {new Date(payment.payment_date).toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full sm:w-auto px-0 sm:px-6 py-2 sm:py-0 border-t sm:border-t-0 sm:border-r border-slate-50 sm:border-slate-100 border-dashed sm:border-solid">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                   <Wallet className="w-3 h-3" />
                                   دفعة عامة
                                </span>
                          </div>
                          {payment.note && (
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                               {payment.note}
                            </p>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-2 sm:gap-1 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-slate-50 sm:border-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50/80 px-2 py-1 rounded-full border border-slate-100">
                         <User className="w-3 h-3 text-slate-400" />
                         {payment.created_by || 'النظام'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         <span>مكتمل</span>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
       )}
    </div>
  );
};

export default PaymentHistoryTab;