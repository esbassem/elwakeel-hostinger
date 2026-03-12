
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, X, Calendar, User, Tractor, Wallet, FileText, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const useInvoiceDetails = (invoiceId) => {
    const [data, setData] = useState({ invoice: null, payments: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!invoiceId) {
            setLoading(false);
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const { data: arAccount, error: accError } = await supabase
                    .from('account_accounts').select('id').eq('name', 'ذمم مدينة عملاء').single();
                if (accError || !arAccount) throw new Error('فشل تحديد حساب الذمم المدينة.');

                const { data: moveData, error: moveError } = await supabase
                    .from('account_moves')
                    .select(`id, name, invoice_date, notes, amount_total, partner:partner_id(name, phone1, address), lines:account_move_lines(*, vehicle:vehicles(product_name, chassis_no))`)
                    .eq('id', invoiceId).single();
                if (moveError || !moveData) throw new Error('تعذر العثور على الفاتورة.');

                const receivableLine = moveData.lines.find(l => l.debit > 0 && l.account_id === arAccount.id);
                if (!receivableLine) throw new Error('سطر ذمم العميل غير موجود لهذه الفاتورة.');

                const { data: allocsData, error: allocsError } = await supabase
                    .from('payment_allocations')
                    .select(`allocated_amount, payment_line:account_move_lines!payment_move_line_id(move:account_moves(pay_method, notes, date))`)
                    .eq('invoice_move_line_id', receivableLine.id);
                if (allocsError) throw new Error(`فشل جلب الدفعات المرتبطة: ${allocsError.message}`);

                const paidAmount = allocsData.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
                setData({ invoice: { ...moveData, paid_amount: paidAmount, remaining_amount: moveData.amount_total - paidAmount }, payments: allocsData });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [invoiceId]);

    return { ...data, loading, error };
};

const InfoRow = ({ label, value, valueClass }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={cn("text-sm font-semibold text-slate-800", valueClass)}>{value}</p>
    </div>
);

export const SalesInvoiceViewSheet = ({ invoiceId, isOpen, onClose }) => {
    const { invoice, payments, loading, error } = useInvoiceDetails(invoiceId);

    const status = useMemo(() => {
        if (!invoice) return { text: '-', color: 'text-slate-700', bgColor: 'bg-slate-100' };
        if (invoice.remaining_amount <= 0.01) return { text: 'مدفوعة', color: 'text-green-800', bgColor: 'bg-green-100' };
        if (invoice.paid_amount > 0) return { text: 'مدفوعة جزئياً', color: 'text-amber-800', bgColor: 'bg-amber-100' };
        return { text: 'غير مدفوعة', color: 'text-red-800', bgColor: 'bg-red-100' };
    }, [invoice]);

    const productLines = useMemo(() => invoice?.lines.filter(l => l.credit > 0) || [], [invoice]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 z-50" />
                    <motion.div
                        key="sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'tween', duration: 0.4, ease: [0.3, 1, 0.4, 1] }}
                        className="fixed inset-0 h-[96%] mt-auto bg-white rounded-t-2xl z-[60] flex flex-col" dir="rtl"
                    >
                        <header className="flex-shrink-0 flex items-center justify-center h-14 px-4 relative border-b border-slate-200">
                            <h2 className="text-base font-bold text-slate-800">تفاصيل الفاتورة</h2>
                            <Button onClick={onClose} variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full h-8 w-8">
                                <X className="h-5 w-5 text-slate-600" />
                            </Button>
                        </header>

                        <main className="flex-grow overflow-y-auto p-5">
                            {loading && <div className="flex items-center justify-center h-full text-slate-500"><Loader2 className="w-8 h-8 animate-spin mr-3"/><span>جاري التحميل...</span></div>}
                            {error && <div className="text-center py-20 text-red-500"><p className="font-bold">حدث خطأ</p><p className="text-sm mt-2 mx-4">{error}</p></div>}
                            {invoice && (
                                <div className="max-w-2xl mx-auto space-y-8">
                                    {/* --- Customer & Status --- */}
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-slate-800">{invoice.partner?.name}</p>
                                        <p className="text-sm text-slate-500 mt-1">فاتورة بتاريخ {new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}</p>
                                        <div className={cn("mt-3 text-xs font-bold px-3 py-1 rounded-full inline-block", status.bgColor, status.color)}>{status.text}</div>
                                    </div>

                                    {/* --- Financial Summary --- */}
                                    <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/80 p-4 rounded-xl">
                                        <div>
                                            <p className="text-xs text-slate-500">الإجمالي</p>
                                            <p className="font-mono font-bold text-slate-800 text-lg">{Number(invoice.amount_total).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">المدفوع</p>
                                            <p className="font-mono font-bold text-green-600 text-lg">{Number(invoice.paid_amount).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">المتبقي</p>
                                            <p className="font-mono font-bold text-red-600 text-lg">{Number(invoice.remaining_amount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* --- Details Section --- */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 mb-2 px-1">المنتجات</h3>
                                        {productLines.map(line => (
                                            <InfoRow 
                                                key={line.id} 
                                                label={line.vehicle?.product_name || line.name} 
                                                value={Number(line.credit).toLocaleString()} 
                                                valueClass="font-mono"
                                            />
                                        ))}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 mb-2 px-1">الدفعات</h3>
                                        {payments.length > 0 ? payments.map((p, index) => (
                                            <InfoRow 
                                                key={index} 
                                                label={`دفعة بتاريخ ${new Date(p.payment_line.move.date).toLocaleDateString('ar-EG')}`} 
                                                value={`+${Number(p.allocated_amount).toLocaleString()}`} 
                                                valueClass="font-mono text-green-600"
                                            />
                                        )) : <p className="text-sm text-center text-slate-400 py-4">لا توجد دفعات مسجلة.</p>}
                                    </div>
                                    
                                    {invoice.notes && (
                                        <div>
                                             <h3 className="text-sm font-bold text-slate-500 mb-2 px-1">ملاحظات</h3>
                                             <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{invoice.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </main>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
