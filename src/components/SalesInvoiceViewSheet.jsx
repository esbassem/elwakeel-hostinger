
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, X, Printer, ShoppingCart, Landmark, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Data Fetching Hook (No changes) ---
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
            setError(null);
            try {
                await new Promise(res => setTimeout(res, 500));
                const { data: arAccount, error: accError } = await supabase.from('account_accounts').select('id').eq('name', 'ذمم مدينة عملاء').single();
                if (accError || !arAccount) throw new Error('فشل تحديد حساب الذمم المدينة.');
                const { data: moveData, error: moveError } = await supabase.from('account_moves').select(`id, name, invoice_date, notes, amount_total, partner:partner_id(name), lines:account_move_lines(*, vehicle:vehicles(product_name, chassis_no))`).eq('id', invoiceId).single();
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
        };
        fetchDetails();
    }, [invoiceId]);

    return { ...data, loading, error };
};

const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h3 className="flex items-center text-md font-bold text-slate-700">
                <Icon className="w-5 h-5 text-slate-400 ml-3" strokeWidth={2} />
                <span>{title}</span>
            </h3>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const DetailRow = ({ primary, secondary, amount, primaryClass, amountClass }) => (
    <div className="flex justify-between items-center">
        <div>
            <p className={cn("text-sm font-semibold text-slate-700", primaryClass)}>{primary}</p>
            {secondary && <p className="text-xs text-slate-500 font-sans pt-0.5">{secondary}</p>}
        </div>
        <p className={cn("font-mono text-sm text-slate-600", amountClass)}>{amount}</p>
    </div>
);


// --- Main Component: Final, Professional Layout ---
export const SalesInvoiceViewSheet = ({ invoiceId, isOpen, onClose }) => {
    const { invoice, payments, loading, error } = useInvoiceDetails(invoiceId);
    const formatCurrency = (amount) => `${Number(amount).toLocaleString('ar-EG')} ج.م`;
    const productLines = useMemo(() => invoice?.lines.filter(l => l.credit > 0) || [], [invoice]);

    const renderSkeleton = () => (
        <div className="animate-pulse">
            <div className="bg-white p-4 border-b border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-9 w-9 bg-slate-200 rounded-full"></div>
                    <div className="h-9 w-20 bg-slate-200 rounded-md"></div>
                </div>
                <div>
                    <div className="h-8 w-3/4 bg-slate-200 rounded-lg mb-2"></div>
                    <div className="h-4 w-1/2 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-14 w-full bg-slate-100 rounded-lg mt-4"></div>
            </div>
            <div className="p-5 space-y-4 bg-slate-50">
                 <div className="h-48 w-full bg-white rounded-lg"></div>
                 <div className="h-24 w-full bg-white rounded-lg"></div>
            </div>
        </div>
    );

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
                        transition={{ type: 'tween', duration: 0.4, ease: [0.3, 1, 0.4, 1] }}
                        className="fixed inset-0 h-[96%] mt-auto bg-white rounded-t-2xl z-[60] flex flex-col overflow-hidden" dir="rtl"
                    >
                       
                        {loading ? renderSkeleton() :
                         error ? <div className="flex-grow flex items-center justify-center h-full text-center text-red-500"><div className="p-8"><p className="font-bold">حدث خطأ</p><p className="text-sm mt-2 mx-4">{error}</p></div></div> :
                         invoice && (
                            <>
                                <header className="flex-shrink-0 bg-white border-b border-slate-200 p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                            <ArrowRight className="h-5 w-5 text-slate-600" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-9" disabled={loading || !!error}><Printer className="w-4 h-4 ml-2"/> طباعة</Button>
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{invoice.partner?.name}</h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {`تاريخ الفاتورة: ${new Date(invoice.invoice_date).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                        </p>
                                    </div>

                                    {invoice.remaining_amount > 0 ? (
                                        <div className="bg-red-50/80 border border-red-200 rounded-lg p-3 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-red-800">المبلغ المتبقي</span>
                                                <span className="font-mono font-bold text-red-800 text-xl">{formatCurrency(invoice.remaining_amount)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50/80 border border-green-200 rounded-lg p-3 mt-2">
                                            <div className="flex justify-center items-center">
                                                <CheckCircle className="w-5 h-5 text-green-700 ml-2" />
                                                <span className="text-sm font-semibold text-green-800">فاتورة مسددة</span>
                                            </div>
                                        </div>
                                    )}
                                </header>

                                <main className="flex-grow overflow-y-auto bg-slate-50">
                                    <div className="p-4 space-y-4">
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                                            <div className="p-5">
                                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                                    <h3 className="flex items-center text-md font-bold text-slate-700">
                                                        <ShoppingCart className="w-5 h-5 text-slate-400 ml-3" strokeWidth={2} />
                                                        <span>إجمالي الفاتورة</span>
                                                    </h3>
                                                    <p className="font-mono font-bold text-lg text-slate-800">
                                                        {formatCurrency(invoice.amount_total)}
                                                    </p>
                                                </div>
                                                <div className="space-y-3 pt-2">
                                                    {productLines.map(line => (
                                                        <DetailRow 
                                                            key={line.id} 
                                                            primary={line.vehicle?.product_name || line.name}
                                                            secondary={line.vehicle?.chassis_no ? `شاسيه: ${line.vehicle.chassis_no}` : null}
                                                            amount={formatCurrency(line.credit)}
                                                            amountClass="text-slate-800"
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-dashed border-slate-200 mx-5"></div>

                                            <div className="p-5 rounded-b-xl">
                                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                                    <h3 className="flex items-center text-md font-bold text-slate-700">
                                                        <Landmark className="w-5 h-5 text-slate-400 ml-3" strokeWidth={2} />
                                                        <span>إجمالي المدفوع</span>
                                                    </h3>
                                                     <p className="font-mono font-bold text-lg text-green-600">
                                                        {formatCurrency(invoice.paid_amount)}
                                                    </p>
                                                </div>
                                                {payments.length > 0 ? (
                                                    <div className="space-y-3 pt-2">
                                                        {payments.map((p, index) => (
                                                            <DetailRow 
                                                                key={index}
                                                                primary={'دفعة'}
                                                                secondary={`${new Date(p.payment_line.move.date).toLocaleDateString('ar-EG')}${p.payment_line.move.pay_method ? ` • ${p.payment_line.move.pay_method}` : ''}`}
                                                                amount={`+${formatCurrency(p.allocated_amount)}`}
                                                                amountClass="text-green-600 font-semibold"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-center text-slate-400 py-4">لا توجد دفعات مسجلة.</p>
                                                )}
                                            </div>
                                        </div>

                                        {invoice.notes && (
                                            <Section icon={FileText} title="الملاحظات">
                                                <p className="text-sm text-slate-600 leading-relaxed">{invoice.notes}</p>
                                            </Section>
                                        )}
                                    </div>
                                </main>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
