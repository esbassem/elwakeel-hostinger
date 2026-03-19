
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SalesInvoiceViewSheet } from '@/components/SalesInvoiceViewSheet';
import CreateInvoiceSheet from '@/components/CreateInvoiceSheet';
import { Loader2, Frown, Plus, ChevronLeft, ChevronRight, FileText, ArrowUpRight, Search, X, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

// --- Data Fetching Hook (No changes needed) ---
const useSalesInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: moves, error: movesError } = await supabase
                .from('account_moves')
                .select(`id, name, invoice_date, amount_total, partner:partner_id(id, name), lines:account_move_lines(id, move_id, account_id, debit, credit, name, vehicle:vehicles(product_name, model_year, color, condition, chassis_no))`)
                .eq('move_type', 'sale')
                .order('invoice_date', { ascending: false });
            if (movesError) throw new Error(`Failed to fetch invoices: ${movesError.message}`);

            const receivableLineIds = moves.map(m => m.lines.find(l => l.debit > 0)?.id).filter(Boolean);
            const { data: allocations, error: allocationsError } = await supabase
                .from('payment_allocations').select('invoice_move_line_id, allocated_amount').in('invoice_move_line_id', receivableLineIds);
            if (allocationsError) throw new Error(`Failed to fetch payments: ${allocationsError.message}`);

            const paidAmountsMap = allocations.reduce((acc, alloc) => {
                acc[alloc.invoice_move_line_id] = (acc[alloc.invoice_move_line_id] || 0) + alloc.allocated_amount;
                return acc;
            }, {});

            const processedInvoices = moves.map(move => {
                const receivableLine = move.lines.find(l => l.debit > 0);
                const paid_amount = receivableLine ? (paidAmountsMap[receivableLine.id] || 0) : 0;
                const remaining_amount = move.amount_total - paid_amount;
                
                let status;
                if (remaining_amount <= 0.01) status = 'paid';
                else if (paid_amount > 0) status = 'partial';
                else status = 'due';

                const products = move.lines.filter(l => l.credit > 0).map(l => {
                    if (!l.vehicle) return { name: l.name };
                    return {
                        name: l.vehicle.product_name || l.name,
                        model: l.vehicle.model_year, color: l.vehicle.color,
                        condition: l.vehicle.condition, chassis_no: l.vehicle.chassis_no
                    };
                });

                return { ...move, paid_amount, remaining_amount, status, products };
            });
            setInvoices(processedInvoices);
        } catch (err) { setError(err); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
    return { invoices, loading, error, refetch: fetchInvoices };
};


// --- Reusable Components ---
const InvoiceListItem = ({ invoice, onClick }) => {
    const statusConfig = {
        paid: { text: 'مدفوع', color: 'text-green-600', dotColor: 'bg-green-500' },
        partial: { text: 'جزئي', color: 'text-amber-600', dotColor: 'bg-amber-500' },
        due: { text: 'مستحق', color: 'text-red-600', dotColor: 'bg-red-500' },
    }[invoice.status];

    const getArabicCondition = (condition) => {
        if (condition === 'new') return 'جديد';
        if (condition === 'used') return 'مستعمل';
        return condition;
    };

    return (
        <div onClick={onClick} className="flex justify-between items-start py-5 px-6 cursor-pointer hover:bg-slate-50">
            <div className="flex-grow mr-4 min-w-0 md:flex md:items-start md:gap-x-4">
                <div className="md:flex-shrink-0 md:w-56 mb-3 md:mb-0">
                    <p className="font-bold text-gray-800 text-base truncate">{invoice.partner?.name || 'عميل غير محدد'}</p>
                    <p className="text-sm text-slate-500 mt-1">
                        {new Date(invoice.invoice_date).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                {invoice.products?.length > 0 && (
                    <div className="min-w-0">
                        <div className="flex flex-col items-start gap-2">
                            {invoice.products.map((product, index) => {
                                const translatedCondition = getArabicCondition(product.condition);
                                const mainDetails = [translatedCondition, product.color, product.model].filter(Boolean).join(' • ');
                                return (
                                    <div key={index} className="bg-slate-100/70 px-3 py-2 rounded-md w-full">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-x-2 flex-wrap">
                                                 <p className="font-semibold text-sm text-slate-800">{product.name}</p>
                                                 <p className="text-xs text-slate-500">{mainDetails}</p>
                                            </div>
                                             {product.chassis_no && (
                                                <p className="text-xs text-slate-500 font-mono tracking-wider truncate mt-1">شاسيه: {product.chassis_no}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            <div className="text-left flex-shrink-0 pt-0.5">
                <p className="font-mono font-bold text-lg text-gray-900">{`${invoice.amount_total.toLocaleString('ar-EG')} ج.م`}</p>
                <div className="flex items-center justify-end gap-2 mt-1.5">
                    <p className={cn("text-sm font-semibold", statusConfig.color)}>
                        {statusConfig.text}
                        {(invoice.status === 'partial' || invoice.status === 'due') && invoice.remaining_amount > 0 && (
                            <span className="font-mono text-xs opacity-90 ml-1">
                                ({`${invoice.remaining_amount.toLocaleString('ar-EG')} ج.م`})
                            </span>
                        )}
                    </p>
                    <div className={cn("w-2 h-2 rounded-full", statusConfig.dotColor)}></div>
                </div>
            </div>
        </div>
    );
};

const StatusTabButton = ({ label, isActive, ...props }) => {
    return (
        <button
            className={cn(
                "py-2 text-sm font-medium transition-colors duration-200",
                isActive
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
            )}
            {...props}
        >
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );
};


// --- Main Sales Component (V39 - Ultimate Minimalism) ---
const Sales = () => {
    const { invoices, loading, error, refetch } = useSalesInvoices();
    const [isCreateSheetOpen, setCreateSheetOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [viewDate, setViewDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const { totalOutstanding } = useMemo(() => {
        const outstandingInvoices = invoices.filter(inv => inv.status !== 'paid');
        return { totalOutstanding: outstandingInvoices.reduce((sum, inv) => sum + inv.remaining_amount, 0) };
    }, [invoices]);

    const monthlyInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const invDate = new Date(inv.invoice_date);
            return invDate.getFullYear() === viewDate.getFullYear() && invDate.getMonth() === viewDate.getMonth();
        });
    }, [invoices, viewDate]);

    const filteredInvoices = useMemo(() => {
        let preSearchInvoices = statusFilter === 'outstanding'
            ? invoices.filter(inv => inv.status === 'due' || inv.status === 'partial')
            : monthlyInvoices;
        
        if (!searchTerm) return preSearchInvoices;
        
        const lowercasedTerm = searchTerm.toLowerCase();
        return preSearchInvoices.filter(invoice => 
            invoice.partner?.name?.toLowerCase().includes(lowercasedTerm) ||
            invoice.products.some(p =>
                p.name?.toLowerCase().includes(lowercasedTerm) ||
                p.chassis_no?.toLowerCase().includes(lowercasedTerm)
            )
        );
    }, [invoices, monthlyInvoices, statusFilter, searchTerm]);

    const displayedStats = useMemo(() => {
        const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount_total, 0);
        return { total, count: filteredInvoices.length };
    }, [filteredInvoices]);

    const changeMonth = (offset) => setViewDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    const handleCloseCreateSheet = () => { setCreateSheetOpen(false); refetch(); };
    const currentMonthStr = viewDate.toLocaleString('ar-EG-u-nu-latn', { month: 'long', year: 'numeric' });

    return (
        <>
            <div className="bg-slate-50 h-full overflow-y-auto" dir="rtl">
                <header className="relative bg-gradient-to-br from-blue-600 to-blue-700 pb-8 pt-6 rounded-b-2xl shadow-md">
                    <div className="px-6">
                         <div className="flex justify-end items-center mb-6">
                            <Button onClick={() => setCreateSheetOpen(true)} className="bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 shadow-sm border border-white/20">
                                <Plus className="w-4 h-4 ml-2" />
                                <span>إضافة فاتورة</span>
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4">
                            <div className="group relative p-3 rounded-lg transition-all duration-200 hover:bg-white/10 cursor-pointer">
                                <ArrowUpRight className="absolute top-3 left-3 w-4 h-4 text-white/30 transition-colors group-hover:text-white/60" />
                                <p className="text-sm text-blue-200">إجمالي المتبقي</p>
                                {loading ? (
                                     <div className="h-8 w-3/4 bg-blue-500/80 rounded-md animate-pulse mt-1"></div>
                                ) : (
                                     <p className="text-2xl font-bold text-white">{`${totalOutstanding.toLocaleString('ar-EG')} ج.م`}</p>
                                )}
                            </div>
                             <div className="group relative p-3 rounded-lg transition-all duration-200 hover:bg-white/10 cursor-pointer">
                                <ArrowUpRight className="absolute top-3 left-3 w-4 h-4 text-white/30 transition-colors group-hover:text-white/60" />
                                <p className="text-sm text-blue-200">للمراجعة</p>
                                <p className="text-2xl font-bold text-white">--- ج.م</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="-mt-6 relative z-10">
                    <section className="bg-white rounded-t-2xl shadow-lg pb-12 mx-3 lg:max-w-[60rem] lg:mr-[150px] min-h-[70vh]">
                        
                        <div className="p-4 sm:p-6 space-y-4">
                            {/* --- Toolbar: Top Row (Filters & Search) --- */}
                            <div className="flex justify-between items-center gap-4">
                                <div className={cn("items-center gap-5", isSearchVisible ? "hidden sm:flex" : "flex")}>
                                    <StatusTabButton label="فواتير الشهر" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                                    <StatusTabButton label="كل المستحقات" isActive={statusFilter === 'outstanding'} onClick={() => setStatusFilter('outstanding')} />
                                </div>

                                <div className="flex-1 flex justify-end">
                                    {isSearchVisible ? (
                                        <div className="relative w-full sm:hidden">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                autoFocus
                                                type="text"
                                                placeholder="ابحث..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="h-10 w-full rounded-lg bg-slate-100 pl-16 pr-9"
                                            />
                                            <Button variant="ghost" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 px-2 text-slate-500" onClick={() => { setIsSearchVisible(false); setSearchTerm(''); }}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="icon" variant="ghost" className="sm:hidden rounded-full h-10 w-10" onClick={() => setIsSearchVisible(true)}>
                                            <Search className="w-5 h-5 text-slate-500" />
                                        </Button>
                                    )}

                                    <div className="hidden sm:block relative w-full max-w-[200px] sm:max-w-xs">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <Input
                                            type="text"
                                            placeholder={statusFilter === 'all' ? "ابحث..." : "ابحث في كل المستحقات..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-3 pr-9 h-10 w-full bg-slate-100 rounded-lg transition-all focus-visible:ring-1 focus-visible:ring-blue-500 border-transparent"
                                        />
                                        {searchTerm && (
                                            <Button size="icon" variant="ghost" className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-500" onClick={() => setSearchTerm('')}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- Toolbar: Bottom Row (Month Drawer & Reports) --- */}
                            {statusFilter === 'all' && (
                                <div className="flex justify-start items-center">
                                    <div className="flex items-center bg-white border border-slate-200 rounded-full h-10 p-1">
                                        <div className="flex items-center pr-1">
                                            <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-gray-500" onClick={() => changeMonth(1)}><ChevronRight className="h-5 w-5" /></Button>
                                            <h2 className="text-base font-bold text-gray-700 text-center w-auto sm:w-32 px-2 whitespace-nowrap">{currentMonthStr}</h2>
                                            <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 text-gray-500" onClick={() => changeMonth(-1)}><ChevronLeft className="h-5 w-5" /></Button>
                                        </div>
                                        <div className="border-l h-5 border-slate-300"></div>
                                        <div className="flex items-baseline gap-x-4 px-3 text-sm text-slate-500">
                                            <p className="font-semibold font-mono text-sm text-slate-600">{loading ? '...' : displayedStats.total.toLocaleString('ar-EG')}</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="font-semibold font-mono text-sm text-slate-600">{loading ? '...' : displayedStats.count}</p>
                                                <span className="text-xs">فاتورة</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <hr className="border-slate-200"/>

                        {/* --- Invoice List --- */}
                        <div>
                            {loading && !invoices.length ? (
                                <div className="text-center py-24"><Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" /><p className="mt-3 text-sm text-gray-500">جاري تحميل الفواتير...</p></div>
                            ) : error ? (
                                <div className="text-center py-24"><Frown className="w-10 h-10 mx-auto text-red-400" /><p className="mt-4 font-bold text-red-600">حدث خطأ بالتحميل</p><p className="text-xs text-slate-500 mt-2">{error.message}</p></div>
                            ) : (
                                filteredInvoices.length > 0 ? (
                                    <div className="divide-y divide-slate-200">
                                        {filteredInvoices.map(invoice => (
                                            <InvoiceListItem key={invoice.id} invoice={invoice} onClick={() => setSelectedInvoiceId(invoice.id)} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 px-6 flex flex-col items-center">
                                        {searchTerm ? <Search className="w-12 h-12 text-slate-300"/> : <FileText className="w-12 h-12 text-slate-300"/> }
                                        <p className="mt-4 text-lg font-semibold text-slate-600">
                                            {searchTerm ? 'لا توجد نتائج تطابق بحثك' : statusFilter === 'outstanding' ? 'لا توجد أي فواتير مستحقة حالياً.' : 'لا توجد فواتير بهذا الشهر'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400 max-w-xs mx-auto">
                                            {searchTerm ? 'جرّب كلمة بحث مختلفة.' : statusFilter === 'outstanding' ? '' : 'جرّب تغيير الشهر أو أضف فاتورة جديدة.' }
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                </main>
            </div>

            <SalesInvoiceViewSheet invoiceId={selectedInvoiceId} isOpen={!!selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
            <CreateInvoiceSheet isOpen={isCreateSheetOpen} onClose={handleCloseCreateSheet} />
        </>
    );
};

export default Sales;