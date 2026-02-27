import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Search, Loader2, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Helper Functions ---
const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return value.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const getDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return 'اليوم';
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    if (d.getTime() === yest.getTime()) return 'أمس';
    return d.toLocaleDateString('ar-SA', { weekday: 'long' });
};

const getDayDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
};


const TransactionHistorySheet = ({ open, onOpenChange, transactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('current');
    const [loading, setLoading] = useState(true);

    useState(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const filteredTransactions = useMemo(() => {
        const allRelevant = transactions
            .filter(t => t.status !== 'rejected')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let monthToFilter = selectedMonth === 'current' ? currentMonthKey : selectedMonth;
        
        if (monthToFilter === 'all') return allRelevant;

        return allRelevant.filter(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthKey !== monthToFilter) return false;

            const searchMatch = !searchTerm 
                || t.note?.toLowerCase().includes(searchTerm.toLowerCase()) 
                || t.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
                || t.ref_id?.toString().includes(searchTerm);

            return searchMatch;
        });
    }, [transactions, searchTerm, selectedMonth]);

    const groupedByDay = useMemo(() => {
        const groups = filteredTransactions.reduce((acc, t) => {
            const dayKey = new Date(t.date).toISOString().split('T')[0];
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(t);
            return acc;
        }, {});
        return Object.entries(groups);
    }, [filteredTransactions]);

    const availableMonths = useMemo(() => {
        const monthSet = new Set(transactions.map(t => {
            const date = new Date(t.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }));
        return Array.from(monthSet).map(monthKey => ({
            value: monthKey,
            label: new Date(monthKey + '-02').toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
        }));
    }, [transactions]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="bg-white p-0 w-full sm:max-w-4xl flex flex-col" hideCloseButton>
                <header className="flex-shrink-0 p-3 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-20 border-b" dir="rtl">
                    <h2 className="text-lg font-bold text-stone-800 pr-2">سجل الخزنة</h2>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
                        <ArrowRight className="w-6 h-6 text-stone-600" />
                    </Button>
                </header>

                <div className="flex-shrink-0 p-3 flex items-center gap-2 sticky top-[65px] bg-white/80 backdrop-blur-sm z-10 border-b" dir="rtl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                        <Input
                            placeholder="بحث بالبيان, المستخدم, أو الرقم المرجعي..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-stone-50 border-stone-200 pl-9 h-10 text-sm rounded-lg w-full focus:ring-2 focus:ring-indigo-500/40"
                        />
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-10 rounded-lg bg-stone-50 border-stone-200 text-sm font-medium text-stone-700 w-40">
                            <SelectValue placeholder="اختر شهر" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="current">الشهر الحالي</SelectItem>
                            <SelectItem value="all">كل الشهور</SelectItem>
                            {availableMonths.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <main className="flex-grow overflow-y-auto p-4" dir="rtl">
                    {loading ? (
                        <div className="text-center py-20 flex justify-center">
                            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                        </div>
                    ) : groupedByDay.length > 0 ? (
                        <div className="space-y-6">
                            {groupedByDay.map(([dateKey, dayTransactions]) => {
                                const incomeTxns = dayTransactions.filter(t => t.type === 'income');
                                const expenseTxns = dayTransactions.filter(t => t.type === 'expense');
                                return (
                                    <div key={dateKey} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                                        <div className="bg-stone-50 p-3 px-4 border-b border-stone-100">
                                            <h3 className="font-bold text-sm text-stone-700">{getDayLabel(dateKey)} - <span className="font-normal text-stone-500">{getDayDate(dateKey)}</span></h3>
                                        </div>
                                        <div className="flex flex-col lg:flex-row lg:divide-y-0 lg:divide-y-reverse lg:divide-x divide-stone-100">
                                            <div className="flex-1 p-3 sm:p-4 space-y-2 bg-emerald-50/5">
                                                {incomeTxns.length > 0 ? 
                                                    incomeTxns.map(t => <TransactionItem key={t.id} t={t} />) : 
                                                    <div className="text-center py-6"><p className="text-emerald-400/60 text-xs font-bold">لا توجد إيرادات</p></div>
                                                }
                                            </div>
                                            <div className="flex-1 p-3 sm:p-4 space-y-2 bg-rose-50/5">
                                                {expenseTxns.length > 0 ? 
                                                    expenseTxns.map(t => <TransactionItem key={t.id} t={t} />) : 
                                                    <div className="text-center py-6"><p className="text-rose-400/60 text-xs font-bold">لا توجد مصروفات</p></div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 px-6">
                             <p className="text-stone-500 font-bold">لا توجد عمليات في هذا الشهر</p>
                        </div>
                    )}
                </main>
            </SheetContent>
        </Sheet>
    );
};

const TransactionItem = ({ t }) => (
    <div className="group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:bg-white hover:shadow-sm hover:border-stone-100 transition-all">
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${t.status === 'pending' ? 'bg-amber-100 text-amber-600' : t.type === 'income' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
                {t.status === 'pending' ? <Clock className="w-4 h-4" /> : t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    {t.ref_id && <span className="font-mono text-[9px] font-bold text-stone-500 bg-stone-100 px-1 py-0.5 rounded border border-stone-200 leading-none">#{t.ref_id}</span>}
                    <p className="text-xs font-bold leading-tight text-stone-800">{t.note || (t.type === 'income' ? 'إيراد' : 'مصروف')}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-stone-400 font-medium">
                    <span>{new Date(t.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{t.created_by}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3 pl-1">
            <span className={`text-xs font-black dir-ltr ${t.status === 'pending' ? 'text-stone-400' : t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
            </span>
        </div>
    </div>
); 

export default TransactionHistorySheet;
