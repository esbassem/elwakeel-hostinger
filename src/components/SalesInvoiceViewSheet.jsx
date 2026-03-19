
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, X, Printer, ShoppingCart, Landmark, FileText, ArrowRight, CheckCircle, PlusCircle, Wallet, CreditCard, ChevronLeft, UserPlus, ExternalLink, Camera, Tractor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccountMoves } from '@/hooks/useAccountMoves';

const useInvoiceDetails = (invoiceId) => {
    const [data, setData] = useState({ invoice: null, payments: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDetails = useCallback(async () => {
        if (!invoiceId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await new Promise(res => setTimeout(res, 500));
            const { data: arAccount, error: accError } = await supabase.from('account_accounts').select('id').eq('name', 'ذمم مدينة عملاء').single();
            if (accError || !arAccount) throw new Error('فشل تحديد حساب الذمم المدينة.');
            const { data: moveData, error: moveError } = await supabase.from('account_moves').select(`id, name, invoice_date, notes, amount_total, partner:partner_id(id, name, nickname, phone1, phone2, address, job, job_address, id_card_front, id_card_back), lines:account_move_lines(*, vehicle:vehicles(product_name, chassis_no))`).eq('id', invoiceId).single();
            if (moveError || !moveData) throw new Error('تعذر العثور على الفاتورة.');
            const receivableLine = moveData.lines.find(l => l.debit > 0 && l.account_id === arAccount.id);
            if (!receivableLine) throw new Error('سطر ذمم العميل غير موجود لهذه الفاتورة.');
            const { data: allocsAndLines, error: allocsError } = await supabase.from('payment_allocations').select(`allocated_amount, payment_line:account_move_lines!payment_move_line_id(id, move_id)`).eq('invoice_move_line_id', receivableLine.id);
            if (allocsError) throw new Error(`فشل جلب الدفعات المرتبطة: ${allocsError.message}`);
            let finalAllocsData = [];
            if (allocsAndLines && allocsAndLines.length > 0) {
                const moveIds = [...new Set(allocsAndLines.map(a => a.payment_line.move_id).filter(Boolean))];
                if (moveIds.length > 0) {
                    const { data: movesData, error: movesError } = await supabase.from('account_moves').select('id, pay_method, notes, date').in('id', moveIds);
                    if (movesError) throw new Error(`فشل جلب قيود الدفعات: ${movesError.message}`);
                    const movesMap = new Map(movesData.map(m => [m.id, m]));
                    finalAllocsData = allocsAndLines.map(alloc => ({ ...alloc, payment_line: { ...alloc.payment_line, move: movesMap.get(alloc.payment_line.move_id) } }));
                }
            }
            finalAllocsData.sort((a, b) => new Date(b.payment_line?.move?.date) - new Date(a.payment_line?.move?.date));
            const paidAmount = finalAllocsData.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
            setData({ invoice: { ...moveData, paid_amount: paidAmount, remaining_amount: moveData.amount_total - paidAmount }, payments: finalAllocsData });
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, [invoiceId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { ...data, loading, error, refetch: fetchDetails };
};

const CustomerDetailsView = ({ customer, onBack }) => {

    const DetailItem = ({ label, value, className }) => (
        <div className={className}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-base font-semibold text-slate-800">{value || '---'}</p>
        </div>
    );

    const ImagePreview = ({ url }) => (
        <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center border">
            {url ? (
                 <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full">
                    <img src={url} alt="مستند هوية" className="w-full h-full rounded-md object-contain" />
                 </a>
            ) : (
                <p className="text-slate-400">لا توجد صورة</p>
            )}
        </div>
    );

    return (
        <motion.div 
            key="customer-details-view" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col bg-slate-50"
        >
             <header className="flex-shrink-0 bg-white border-b border-slate-200 p-4">
                <div className="flex items-center">
                    <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full h-9 w-9 ml-2"><ArrowRight className="h-5 w-5 text-slate-600" /></Button>
                    {customer && (
                         <p className="text-lg font-bold text-slate-800">{customer.nickname || customer.name || 'تفاصيل العميل'}</p>
                    )}
                </div>
            </header>
            <main className="flex-grow p-4 md:p-6 overflow-y-auto">
                {customer ? (
                    <div className="space-y-6">
                        <div className="space-y-5">
                            <DetailItem label="الاسم الكامل" value={customer.name} />
                            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                               <DetailItem label="هاتف 1" value={customer.phone1} />
                               <DetailItem label="هاتف 2" value={customer.phone2} />
                            </div>
                            <DetailItem label="عنوان السكن" value={customer.address} />
                            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                               <DetailItem label="الوظيفة" value={customer.job} />
                               <DetailItem label="عنوان العمل" value={customer.job_address} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ImagePreview url={customer.id_card_front} />
                            <ImagePreview url={customer.id_card_back} />
                        </div>
                    </div>
                ) : (
                     <div className="text-center py-10 text-slate-500">
                        <p>لا يمكن تحميل بيانات العميل.</p>
                     </div>
                )}
            </main>
        </motion.div>
    );
};


const SimpleInput = ({ label, name, ...props }) => (
    <div className="space-y-1.5">
        <Label htmlFor={name} className="font-semibold px-1 text-slate-800">{label}</Label>
        <Input id={name} name={name} {...props} className="h-12 bg-slate-100 border-slate-200 shadow-sm text-base" />
    </div>
);

const SimpleSelect = ({ label, name, value, onChange, children, className }) => (
    <div className="space-y-1.5 w-full">
        <Label htmlFor={name} className="font-semibold px-1 text-slate-800">{label}</Label>
        <div className="relative">
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={cn(
                    "appearance-none w-full h-14 rounded-md border border-slate-200 bg-slate-50 px-3 pr-8 text-base ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>
    </div>
);

const FileUploadInput = ({ id, label, icon: Icon, fileName, onFileChange }) => {
    const inputRef = useRef(null);
    return (
        <div
            className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all bg-slate-50 h-32 cursor-pointer relative"
            onClick={() => inputRef.current?.click()}
        >
            <input type="file" id={id} name={id} ref={inputRef} onChange={onFileChange} className="hidden" accept="image/*" />
            {fileName ? (
                <div className="text-center p-2">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700 break-all">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">اضغط للتغيير</p>
                </div>
            ) : (
                <div className="text-center text-slate-500 group-hover:text-blue-600 transition-colors">
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">{label}</p>
                </div>
            )}
        </div>
    );
};


const AddCashPaymentSheet = ({ isOpen, onClose, onSave, remainingAmount }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const { toast } = useToast();

    const handleSave = () => {
        if (!amount || Number(amount) <= 0) {
            toast({ title: "مبلغ غير صالح", description: "الرجاء إدخال مبلغ صحيح.", variant: "destructive" });
            return;
        }
        onSave({ amount: Number(amount), description });
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setAmount('');
                setDescription('');
            }, 300);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>{isOpen && (<>
            <motion.div key="add-cash-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[65]" />
            <motion.div 
                key="add-cash-sheet" 
                initial={{ y: '100%' }} 
                animate={{ y: '0%' }} 
                exit={{ y: '100%' }} 
                transition={{ type: 'tween', duration: 0.3, ease: [0.25, 1, 0.5, 1] }} 
                className="fixed bottom-0 left-0 right-0 bg-white z-[70] flex flex-col rounded-t-2xl border-t h-auto max-h-[85vh]" 
                dir="rtl"
            >
                <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between">
                    <Button variant="ghost" onClick={onClose} className="w-28">إلغاء</Button>
                    <h2 className="text-lg font-bold text-center flex-grow">إضافة دفعة نقدية</h2>
                    <Button onClick={handleSave} className="w-28 font-bold">حفظ الدفعة</Button>
                </header>
                <main className="flex-grow p-4 space-y-6 overflow-y-auto bg-slate-50/50">
                    <SimpleInput 
                        label="المبلغ"
                        name="amount"
                        type="number"
                        dir="ltr"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="h-14 text-lg font-mono font-bold bg-white"
                    />
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="font-semibold px-1 text-slate-800">البيان (اختياري)</Label>
                        <Textarea 
                             id="description"
                             name="description"
                             value={description}
                             onChange={(e) => setDescription(e.target.value)}
                             placeholder="مثال: دفعة تحت الحساب..."
                             className="min-h-[120px] text-base bg-white border-slate-200 shadow-sm" 
                        />
                    </div>
                </main>
            </motion.div></>)}</AnimatePresence>
    );
};

const FinancingSheet = ({ isOpen, onClose, onSave, onAddNew, customer, fetchAllCustomerPaymentsForSelection, loading }) => {
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        if (isOpen && customer) {
            const loadData = async () => {
                const data = await fetchAllCustomerPaymentsForSelection(customer.id);
                setPayments(data);
            };
            loadData();
        } else {
             setTimeout(() => {
                setPayments([]);
                setSelectedPayment(null);
             }, 300);
        }
    }, [isOpen, customer, fetchAllCustomerPaymentsForSelection]);

    const handlePaymentClick = (payment) => {
        setSelectedPayment(payment);
    };

    const handleConfirm = () => {
        if (!selectedPayment) return;
        onSave({
            type: 'financing',
            amount: selectedPayment.amount_total,
            description: `${selectedPayment.pay_method || 'تمويل'} - ${selectedPayment.notes || ''}`,
            original_move_id: selectedPayment.id
        });
    };

    const handleBack = () => {
        setSelectedPayment(null);
    };
    
    const getFinancierIcon = (name) => {
      const lowerName = name?.toLowerCase() || '';
      if (lowerName.includes('myler') || lowerName.includes('مايلو')) return Tractor;
      if (lowerName.includes('aman') || lowerName.includes('امان')) return CreditCard;
      return Wallet;
    };

    return (
        <AnimatePresence>{isOpen && (
            <>
                <motion.div key="fin-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[65]" />
                <motion.div 
                    key="fin-sheet" 
                    initial={{ y: '100%' }} 
                    animate={{ y: '0%' }} 
                    exit={{ y: '100%' }} 
                    transition={{ type: 'tween', duration: 0.3, ease: [0.25, 1, 0.5, 1] }} 
                    className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white z-[70] flex flex-col rounded-t-2xl border-t" 
                    dir="rtl"
                >
                    <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between gap-3 h-16">
                        {selectedPayment ? (
                            <>
                               <Button variant="ghost" onClick={handleBack} className="w-28 justify-start">رجوع</Button>
                               <h2 className="text-lg font-bold text-center flex-grow">تأكيد اختيار الدفعة</h2>
                               <Button onClick={handleConfirm} className="w-28 font-bold">تأكيد</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={onClose} className="w-28 justify-start">إلغاء</Button>
                                <h2 className="text-lg font-bold text-center flex-grow">الدفعات المتاحة للعميل</h2>
                                <Button variant="outline" className="h-11 shrink-0" onClick={onAddNew}>
                                    <UserPlus className="w-4 h-4 ml-2" /> إضافة جديد
                                </Button>
                            </>
                        )}
                    </header>
                    <main className="flex-grow overflow-y-auto bg-slate-50/50 relative">
                        <AnimatePresence mode="wait">
                            {selectedPayment ? (
                                <motion.div 
                                    key="details" 
                                    initial={{ opacity: 0, x: 50 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -50 }} 
                                    transition={{ duration: 0.2, ease: 'easeInOut' }} 
                                    className="absolute inset-0 bg-white p-4 space-y-4"
                                >
                                    <div className="bg-slate-50 rounded-lg p-4 border text-center">
                                       <p className="text-sm text-slate-500">مبلغ الدفعة</p>
                                       <p className="font-mono font-bold text-4xl text-blue-600 mt-1">{Number(selectedPayment.amount_total).toLocaleString('ar-EG')}</p>
                                       <p className="text-sm text-slate-500 mt-1">جنيه مصري</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-slate-200/80 space-y-3 text-sm">
                                      <div className="flex justify-between items-center"><span className="text-slate-500">البيان</span><span className="font-semibold text-slate-800 text-right">{selectedPayment.pay_method || 'دفعة'}</span></div>
                                      <div className="border-t"></div>
                                      <div className="flex justify-between items-center"><span className="text-slate-500">لحساب التاجر</span><span className="font-semibold text-slate-800 text-right">{selectedPayment.merchant_account || '---'}</span></div>
                                      <div className="border-t"></div>
                                      <div className="flex justify-between items-start"><span className="text-slate-500 pt-1">ملاحظات</span><p className="font-normal text-slate-700 text-right max-w-[70%]">{selectedPayment.notes || '---'}</p></div>
                                    </div>
                                    {selectedPayment.attachment_image && (
                                        <a href={selectedPayment.attachment_image} target="_blank" rel="noopener noreferrer" className="block">
                                           <div className="mt-4 p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors duration-200">
                                                <div className="flex items-center gap-3">
                                                    <img src={selectedPayment.attachment_image} alt="مرفق" className="w-12 h-12 rounded-md object-cover bg-slate-200"/>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">عرض المرفق</p>
                                                        <p className="text-xs text-slate-500">فتح في نافذة جديدة</p>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-5 h-5 text-slate-500" />
                                           </div>
                                        </a>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="list" className="h-full">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-3"/><span>جاري التحميل...</span></div>
                                    ) : payments.length > 0 ? (
                                        <div className="divide-y divide-slate-100 bg-white">{payments.map(payment => {
                                            const Icon = getFinancierIcon(payment.pay_method);
                                            return (
                                                <div key={payment.id} onClick={() => handlePaymentClick(payment)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors">
                                                    <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border"><Icon className="w-6 h-6" /></div><div><p className="font-bold text-lg text-slate-800">{payment.pay_method || 'دفعة'}</p><p className="text-xs text-slate-500 mt-0.5 truncate max-w-40">{payment.notes || '---'}</p></div></div>
                                                    <div className="text-left flex flex-col items-end"><p className="font-mono font-bold text-2xl text-blue-600">{Number(payment.amount_total).toLocaleString('ar-EG')}</p><p className="text-xs text-slate-500 mt-0.5">ج.م</p></div>
                                                </div>
                                            )
                                        })}</div>
                                    ) : (
                                        <div className="text-center py-16 text-slate-500"><FileText className="w-10 h-10 mx-auto mb-3"/><p className="font-bold">لا توجد دفعات متاحة</p><p className="text-sm mt-1">هذا العميل ليس لديه دفعات مسجلة.</p></div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </motion.div>
            </>)}
        </AnimatePresence>
    );
};

const AddCustomFinancingSheet = ({ isOpen, onClose, onSave, customer, createCustomerPayment, loading }) => {
    const [selectedFinancier, setSelectedFinancier] = useState(null);
    const [amount, setAmount] = useState('');
    const [merchantAccount, setMerchantAccount] = useState('');
    const [notes, setNotes] = useState('');
    const [attachment, setAttachment] = useState(null);
    const { toast } = useToast();
    
    const financiers = ['مايلو', 'امان', 'الوكيل (مباشر)', 'حالا', 'كيان'];
    const merchantAccounts = ['شركة عابدين', 'معرض ابورجب', 'معرض جنو', 'احمد مختار كعبيش', 'معرض الوكيل', 'ذمم مدينة عملاء', 'اخري'];

    const handleFinancierSelect = (financierName) => {
        setSelectedFinancier(financierName);
    };

    const handleBackToSelection = () => {
        setSelectedFinancier(null);
        setAmount('');
        setMerchantAccount('');
        setNotes('');
        setAttachment(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
        }
    };

    const handleSave = async () => {
        if (!amount || !selectedFinancier || !merchantAccount) { toast({ title: "بيانات ناقصة", description: "الرجاء تعبئة جميع الحقول.", variant: "destructive" }); return; }
        
        const { success } = await createCustomerPayment({ 
            partner_id: customer.id, 
            pay_method: selectedFinancier, 
            amount, 
            merchant_account: merchantAccount, 
            notes, 
            attach_img: attachment
        });

        if (success) {
            onSave();
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                handleBackToSelection();
            }, 300);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>{isOpen && (<>
            <motion.div key="add-fin-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[75]" />
            <motion.div 
                key="add-fin-sheet" 
                initial={{ y: '100%' }} 
                animate={{ y: '0%' }} 
                exit={{ y: '100%' }} 
                transition={{ type: 'tween', duration: 0.3, ease: [0.25, 1, 0.5, 1] }} 
                className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white z-[80] flex flex-col rounded-t-2xl border-t"
                dir="rtl"
            >
                <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between h-16">
                    <div className="w-24 flex justify-start">
                         <Button variant="ghost" onClick={selectedFinancier ? handleBackToSelection : onClose} disabled={loading}>
                            {selectedFinancier ? 'رجوع' : 'إلغاء'}
                        </Button>
                    </div>
                    <h2 className="text-lg font-bold text-center flex-grow">
                        {selectedFinancier ? `تمويل ${selectedFinancier}` : 'إضافة دفعة للعميل'}
                    </h2>
                    <div className="w-24 flex justify-end">
                        {selectedFinancier && <Button onClick={handleSave} className="font-bold" disabled={loading}>{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "حفظ"}</Button>}
                    </div>
                </header>

                <main className="flex-grow p-4 overflow-y-auto bg-slate-50">
                    {customer && (
                        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                            <div className="flex-shrink-0">
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <FileText className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
                            </div>
                        </div>
                    )}
                    
                    <AnimatePresence mode="wait">
                        {!selectedFinancier ? (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2 pt-6"
                            >
                                {financiers.map(name => (
                                    <Button 
                                        key={name}
                                        variant="outline"
                                        className="w-full h-14 text-base font-medium justify-start p-4 border-slate-200"
                                        onClick={() => handleFinancierSelect(name)}
                                    >
                                        {name}
                                    </Button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 pt-6"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-grow">
                                        <SimpleInput 
                                            label="المبلغ"
                                            name="amount"
                                            type="number"
                                            dir="ltr"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="h-14 text-lg font-mono font-bold bg-slate-50"
                                        />
                                    </div>
                                    <div className="w-[45%] flex-shrink-0">
                                        <SimpleSelect
                                            label="لحساب التاجر"
                                            name="merchantAccount"
                                            value={merchantAccount}
                                            onChange={e => setMerchantAccount(e.target.value)}
                                        >
                                            <option value="" disabled>اختر حساب...</option>
                                            {merchantAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                                        </SimpleSelect>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes" className="font-semibold px-1 text-slate-800">ملاحظات</Label>
                                    <Textarea 
                                        id="notes"
                                        name="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="أضف تفاصيل إضافية..."
                                        className="min-h-[100px] text-base bg-slate-50 border-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <Label className="font-semibold px-1 text-slate-800">إرفاق صورة (اختياري)</Label>
                                    <FileUploadInput
                                        id="finance_attachment"
                                        label="إيصال أو مستند"
                                        icon={Camera}
                                        fileName={attachment?.name}
                                        onFileChange={handleFileChange}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </motion.div></>)}</AnimatePresence>
    );
};


const DetailRow = ({ primary, secondary, amount, primaryClass, amountClass }) => (
    <div className="flex justify-between items-center">
        <div>
            <p className={cn("text-sm font-semibold text-slate-700", primaryClass)}>{primary}</p>
            {secondary && <p className="text-xs text-slate-500 font-sans pt-0.5">{secondary}</p>}
        </div>
        <p className={cn("font-mono text-sm text-slate-600", amountClass)}>{amount}</p>
    </div>
);

const AddPaymentView = ({ invoice, onBack, onPaymentSuccess }) => {
    const [payments, setPayments] = useState([]);
    const [isCashSheetOpen, setCashSheetOpen] = useState(false);
    const [isFinancingSheetOpen, setFinancingSheetOpen] = useState(false);
    const [isAddCustomFinancingOpen, setAddCustomFinancingOpen] = useState(false);
    const { toast } = useToast();
    
    const { createCustomerPayment, fetchAllCustomerPaymentsForSelection, addPaymentsToInvoice, loading: isSaving } = useAccountMoves();

    const totalPaidInSession = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingAmount = invoice.remaining_amount - totalPaidInSession;

    const handleSaveCash = (newPayment) => {
        setPayments(prev => [...prev, { id: Date.now(), type: 'cash', ...newPayment }]);
        setCashSheetOpen(false);
    };
    
    const handleSaveFinancingPayment = (newPayment) => {
        setPayments(prev => [...prev, { id: Date.now(), ...newPayment }]);
        setFinancingSheetOpen(false);
        setAddCustomFinancingOpen(false);
    };

    const handleSaveNewFinancingAndReopen = () => {
        setAddCustomFinancingOpen(false);
        setFinancingSheetOpen(true);
    };

    const handleConfirmPayments = async () => {
        if (payments.length === 0) {
            toast({ title: "لا توجد دفعات", description: "الرجاء إضافة دفعة واحدة على الأقل.", variant: "destructive" });
            return;
        }
        const { success, error } = await addPaymentsToInvoice(invoice.id, payments);

        if (success) {
            toast({ title: "تم بنجاح", description: "تم تسجيل الدفعات بنجاح." });
            onPaymentSuccess();
        } else {
            toast({ title: "حدث خطأ", description: error || "فشل تسجيل الدفعات.", variant: "destructive" });
        }
    };

    const getPaymentTypeStyle = (type) => {
        switch (type) {
            case 'cash': return "text-emerald-800 bg-emerald-100/80";
            case 'financing': return "text-blue-800 bg-blue-100/80";
            default: return "text-slate-800 bg-slate-100/80";
        }
    };
    
    const getPaymentTypeName = (type) => {
        switch (type) {
            case 'cash': return "نقــدي";
            case 'financing': return "تمويــل";
            default: return "غير محدد";
        }
    };

    return (
        <motion.div 
            key="add-payment-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col"
        >
            <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm z-10 border-b">
                <div className="flex justify-between items-center h-16 px-4">
                    <Button onClick={onBack} variant="ghost" className="w-24 justify-start">رجوع</Button>
                    <h2 className="text-lg font-bold">تسجيل دفعة</h2>
                    <Button onClick={handleConfirmPayments} disabled={payments.length === 0 || isSaving} className="w-24 justify-center">
                         {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : "تأكيد"}
                    </Button>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto bg-slate-50">
                <div className="p-4 max-w-2xl mx-auto">
                    <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <div className="p-4 flex justify-between items-center bg-slate-50/70 border-b-2 border-slate-200/60">
                                <span className="font-bold text-slate-700 text-lg">المبلغ المستحق</span>
                                <span className="font-mono font-bold text-3xl text-slate-900 tracking-tight">{Number(invoice.remaining_amount).toLocaleString('ar-EG')}</span>
                            </div>

                            <div className="p-3 grid grid-cols-2 gap-3">
                                <Button variant="outline" className="h-12 bg-white text-base font-semibold flex items-center justify-center gap-2" onClick={() => setCashSheetOpen(true)}><Wallet className="w-5 h-5 text-slate-500"/><span>دفعة نقدية</span></Button>
                                <Button variant="outline" className="h-12 bg-white text-base font-semibold flex items-center justify-center gap-2" onClick={() => setFinancingSheetOpen(true)}><CreditCard className="w-5 h-5 text-slate-500"/><span>وسائل دفع</span></Button>
                            </div>

                            <div className="p-3 space-y-2 min-h-[120px]">
                                {payments.length > 0 ? (
                                    payments.map(payment => (
                                        <div key={payment.id} className="p-2.5 flex items-center justify-between bg-slate-50 rounded-md border border-slate-200/80">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-bold font-mono text-slate-800 text-lg">{Number(payment.amount).toLocaleString()}</p>
                                                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full", getPaymentTypeStyle(payment.type))}>{getPaymentTypeName(payment.type)}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 pr-px">{payment.description || '---'}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 self-start" onClick={() => setPayments(p => p.filter(i => i.id !== payment.id))}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-5">
                                        <Wallet size={32} className="mx-auto"/>
                                        <p className="mt-2 font-semibold text-sm">لم يتم تسجيل أي دفعات</p>
                                    </div>
                                )}
                            </div>
                            
                            {payments.length > 0 && (
                                <div className="p-4 bg-slate-50/70 border-t border-slate-200/60 space-y-3 text-sm">
                                    <div className="flex justify-between items-center text-red-600 font-bold text-lg">
                                        <span>المتبقي</span>
                                        <span className="font-mono tracking-tighter">{remainingAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>
            <AddCashPaymentSheet 
                isOpen={isCashSheetOpen}
                onClose={() => setCashSheetOpen(false)}
                onSave={handleSaveCash}
                remainingAmount={remainingAmount}
            />
             <FinancingSheet
                isOpen={isFinancingSheetOpen}
                onClose={() => setFinancingSheetOpen(false)}
                onSave={handleSaveFinancingPayment}
                onAddNew={() => { setFinancingSheetOpen(false); setAddCustomFinancingOpen(true); }}
                customer={invoice.partner}
                fetchAllCustomerPaymentsForSelection={fetchAllCustomerPaymentsForSelection}
                loading={isSaving}
            />
            <AddCustomFinancingSheet
                isOpen={isAddCustomFinancingOpen}
                onClose={() => { setAddCustomFinancingOpen(false); setFinancingSheetOpen(true); }}
                onSave={handleSaveNewFinancingAndReopen}
                customer={invoice.partner}
                createCustomerPayment={createCustomerPayment}
                loading={isSaving}
            />
        </motion.div>
    );
};

const InvoiceContent = ({ invoice, payments, loading, error, refetch, setView, view, handlePaymentSuccess, onClose }) => {
    const formatCurrency = (amount) => `${Number(amount).toLocaleString('ar-EG')} ج.م`;
    const productLines = useMemo(() => invoice?.lines.filter(l => l.credit > 0) || [], [invoice]);

    const renderSkeleton = () => {
        const shimmerGradient = 'linear-gradient(to right, transparent 20%, rgba(255, 255, 255, 0.7) 50%, transparent 80%)';

        return (
            <div className="relative overflow-hidden h-full" dir="rtl">
                <motion.div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{ background: shimmerGradient }}
                    initial={{ x: '-200%' }}
                    animate={{ x: '200%' }}
                    transition={{ repeat: Infinity, duration: 2, ease: [0.4, 0.0, 0.2, 1] }}
                />
                <div className="bg-white p-4 border-b border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-9 w-9 bg-slate-200 rounded-full"></div>
                        <div className="h-9 w-24 bg-slate-200 rounded-md"></div>
                    </div>
                    <div>
                        <div className="h-8 w-3/4 bg-slate-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-1/2 bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="h-20 w-full bg-slate-100 rounded-lg mt-2"></div>
                </div>
                <div className="p-4 space-y-4 bg-slate-50">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                         <div className="p-5 space-y-4">
                           <div className="h-7 w-32 bg-slate-200 rounded mb-4"></div>
                           <div className="h-5 w-full bg-slate-100 rounded"></div>
                           <div className="h-5 w-full bg-slate-100 rounded"></div>
                         </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return renderSkeleton();
    if (error) return <div className="flex-grow flex items-center justify-center h-full text-center text-red-500"><div className="p-8"><p className="font-bold">حدث خطأ</p><p className="text-sm mt-2 mx-4">{error}</p></div></div>;
    
    return (
        invoice && (
            <div className="flex-grow relative overflow-hidden h-full">
               <AnimatePresence mode="wait">
                   {view === 'details' && (
                       <motion.div 
                           key="details-view" 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.15, ease: 'easeInOut' }}
                           className="absolute inset-0 flex flex-col h-full"
                       >
                           <header className="flex-shrink-0 bg-white border-b border-slate-200 p-4 space-y-4">
                               <div className="flex justify-between items-center">
                                   <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full h-9 w-9"><ArrowRight className="h-5 w-5 text-slate-600" /></Button>
                                   <Button variant="outline" size="sm" className="h-9" disabled={loading || !!error}><Printer className="w-4 h-4 ml-2"/> طباعة</Button>
                               </div>
                               <div>
                                   <h2 
                                     className="text-2xl font-bold text-slate-800 cursor-pointer hover:underline"
                                     onClick={() => setView('customerDetails')}
                                   >
                                     {invoice.partner?.name}
                                   </h2>
                                   <p className="text-sm text-slate-500 mt-1">{`تاريخ الفاتورة: ${new Date(invoice.invoice_date).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}`}</p>
                               </div>
                               {(() => {
                                   if (invoice.remaining_amount <= 0) {
                                       return <div className="bg-green-100/70 border border-green-200 rounded-lg p-3 mt-2"><div className="flex justify-center items-center"><CheckCircle className="w-5 h-5 text-green-700 ml-2" /><span className="text-sm font-semibold text-green-800">فاتورة مسددة</span></div></div>;
                                   }
                                   const isPartiallyPaid = invoice.paid_amount > 0;
                                   const bgColor = isPartiallyPaid ? 'bg-yellow-50/80' : 'bg-red-50/80';
                                   const borderColor = isPartiallyPaid ? 'border-yellow-200' : 'border-red-200';
                                   const textColor = isPartiallyPaid ? 'text-yellow-800' : 'text-red-800';
                                   const amountColor = isPartiallyPaid ? 'text-yellow-900' : 'text-red-900';
                                   
                                   return (
                                       <div className={`flex justify-between items-center ${bgColor} border ${borderColor} rounded-lg p-3 mt-2 shadow-sm`}>
                                           <div>
                                               <p className={`text-sm ${textColor} font-semibold`}>{isPartiallyPaid ? 'مدفوع جزئياً' : 'فاتورة غير مدفوعة'}</p>
                                               <p className={`font-mono font-bold ${amountColor} text-xl`}>{formatCurrency(invoice.remaining_amount)}</p>
                                           </div>
                                           <Button variant="ghost" className={`${textColor} hover:bg-slate-100`} onClick={() => setView('addPayment')}>
                                               <PlusCircle className="w-5 h-5 ml-2" />
                                               <span>تسجيل دفعة</span>
                                           </Button>
                                       </div>
                                   );
                               })()}
                           </header>
                           <main className="flex-grow overflow-y-auto bg-slate-50">
                               <div className="p-4 space-y-4">
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                                       <div className="p-5"><div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3"><h3 className="flex items-center text-md font-bold text-slate-700"><ShoppingCart className="w-5 h-5 text-slate-400 ml-3" strokeWidth={2} /><span>إجمالي الفاتورة</span></h3><p className="font-mono font-bold text-lg text-slate-800">{formatCurrency(invoice.amount_total)}</p></div><div className="space-y-3 pt-2">{productLines.map(line => ( <DetailRow key={line.id} primary={line.vehicle?.product_name || line.name} secondary={line.vehicle?.chassis_no ? `شاسيه: ${line.vehicle.chassis_no}` : null} amount={formatCurrency(line.credit)} amountClass="text-slate-800" /> ))}</div></div>
                                       <div className="border-t border-dashed border-slate-200 mx-5"></div>
                                       <div className="p-5 rounded-b-xl">
                                           <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3"><h3 className="flex items-center text-md font-bold text-slate-700"><Landmark className="w-5 h-5 text-slate-400 ml-3" strokeWidth={2} /><span>إجمالي المدفوع</span></h3><p className="font-mono font-bold text-lg text-green-600">{formatCurrency(invoice.paid_amount)}</p></div>
                                           {payments.length > 0 ? <div className="space-y-3 pt-2">{payments.map((p, index) => ( <DetailRow key={index} primary={'دفعة'} secondary={`${new Date(p.payment_line.move.date).toLocaleDateString('ar-EG')}${p.payment_line.move.pay_method ? ` • ${p.payment_line.move.pay_method}` : ''}`} amount={`+${formatCurrency(p.allocated_amount)}`} amountClass="text-green-600 font-semibold" /> ))}</div>
                                           : <p className="text-sm text-center text-slate-400 py-4">لا توجد دفعات مسجلة.</p>}
                                       </div>
                                    </div>
                                   {invoice.notes && <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200"><div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3"><h3 className="flex items-center text-md font-bold text-slate-700"><FileText className="w-5 h-5 text-slate-400 ml-3" strokeWidth={2} /><span>الملاحظات</span></h3></div><div className="space-y-3"><p className="text-sm text-slate-600 leading-relaxed">{invoice.notes}</p></div></div>}
                               </div>
                           </main>
                       </motion.div>
                   )}

                   {view === 'addPayment' && (
                       <AddPaymentView invoice={invoice} onBack={() => setView('details')} onPaymentSuccess={handlePaymentSuccess} />
                   )}

                   {view === 'customerDetails' && (
                       <CustomerDetailsView customer={invoice.partner} onBack={() => setView('details')} />
                   )}
               </AnimatePresence>
            </div>
        )
    );
};

export const SalesInvoiceViewSheet = ({ invoiceId, isOpen, onClose }) => {
    const { invoice, payments, loading, error, refetch } = useInvoiceDetails(invoiceId);
    const [view, setView] = useState('details'); 

    useEffect(() => {
        if(!isOpen) {
            setTimeout(() => setView('details'), 300); 
        } else {
             refetch();
        }
    }, [isOpen, refetch]);

    const handlePaymentSuccess = () => {
        setView('details');
        refetch();
    };
    
    const contentProps = { invoice, payments, loading, error, refetch, setView, view, handlePaymentSuccess, onClose };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-50" />
                    <motion.div
                        key="sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'tween', duration: 0.3, ease: [0.3, 1, 0.4, 1] }}
                        className="fixed inset-x-0 bottom-0 h-[96%] bg-white rounded-t-2xl z-[60] flex flex-col overflow-hidden lg:h-[80vh] lg:max-w-[30rem] lg:mx-auto lg:bottom-4 lg:rounded-2xl"
                        dir="rtl"
                    >
                       <InvoiceContent {...contentProps} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
