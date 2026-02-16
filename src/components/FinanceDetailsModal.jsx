
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import InstallmentsDisplayTab from './InstallmentsDisplayTab';
import PaymentsDisplayTab from './PaymentsDisplayTab';
import useMediaQuery from '../hooks/useMediaQuery';

const FinanceDetailsModal = ({ isOpen, onOpenChange, financeContract }) => {
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const [activeTab, setActiveTab] = useState(isDesktop ? 'installmentsAndPayments' : 'installments');

    useEffect(() => {
        if (isDesktop && activeTab !== 'installmentsAndPayments' && activeTab !== 'guarantors' && activeTab !== 'details') {
            setActiveTab('installmentsAndPayments');
        } else if (!isDesktop && activeTab === 'installmentsAndPayments') {
            setActiveTab('installments');
        }
    }, [isDesktop, activeTab]);

    if (!financeContract) return null;

    const { id, finance_name, customerName, customerNickname, metrics } = financeContract;
    const { paidCount = 0, overdueCountInst = 0, totalInstallmentsCount = 0, paidAmount = 0, totalAmount = 0 } = metrics || {};
    const displayName = customerNickname ? `${customerNickname} (${customerName})` : customerName;

    const TABS = (() => {
        const baseTabs = {
            guarantors: { 
                label: 'الضامنون', 
                content: <div className="text-center pt-12 text-slate-400">عرض الضامنين معطل حالياً.</div>
            },
            details: { 
                label: 'التفاصيل', 
                content: <div className="text-center pt-12 text-slate-400">سيتم عرض تفاصيل العقد هنا.</div>
            }
        };

        if (isDesktop) {
            return {
                installmentsAndPayments: {
                    label: 'الأقساط والمدفوعات',
                    content: (
                        <div className="grid grid-cols-2 gap-x-4">
                            <InstallmentsDisplayTab finance_id={id} />
                            <PaymentsDisplayTab finance_id={id} />
                        </div>
                    )
                },
                ...baseTabs
            };
        } 
        
        return {
            installments: { 
                label: 'الأقساط', 
                content: <InstallmentsDisplayTab finance_id={id} />
            },
            payments: { 
                label: 'المدفوعات', 
                content: <PaymentsDisplayTab finance_id={id} />
            },
            ...baseTabs
        };
    })();

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-[95%] lg:max-w-[56rem] w-full m-0 p-0 shadow-2xl border-0 !rounded-2xl overflow-hidden bg-white"
                dir="rtl"
            >
                 <Button variant="ghost" size="icon" className="absolute top-3 left-3 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 z-10" onClick={() => onOpenChange(false)}>
                    <X className="h-5 w-5" />
                </Button>

                <div className="bg-slate-50 border-b">
                    <div className="p-6 pb-4">
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{finance_name || 'اسم التمويل'}</h1>
                        <p className="text-sm text-slate-500 mt-1 mb-5">{displayName}</p>
                        
                        <div className="max-w-sm">
                            <div className="flex justify-end mb-1.5">
                                <div className="flex items-baseline font-bold rtl:space-x-reverse space-x-1.5">
                                    <span className="text-2xl text-green-600 tracking-tight">{(Number(paidAmount) || 0).toLocaleString('en-US')}</span>
                                    <span className="text-xl text-slate-400">/</span>
                                    <span className="text-2xl text-slate-800 tracking-tight">{(Number(totalAmount) || 0).toLocaleString('en-US')}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-grow flex gap-1 h-2 w-full rounded-full overflow-hidden bg-slate-200/80" dir="rtl">
                                    {Array.from({ length: totalInstallmentsCount }).map((_, i) => {
                                        let colorClass = "bg-slate-300";
                                        if (i < paidCount) colorClass = "bg-green-500";
                                        else if (i < paidCount + overdueCountInst) colorClass = "bg-red-500";
                                        return <div key={i} className={cn("flex-1", colorClass)} />;
                                    })}
                                </div>
                                <span className="text-xs font-mono text-slate-500 flex-shrink-0">{paidCount}/{totalInstallmentsCount}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6">
                        <div className="flex">
                            {Object.keys(TABS).map(key => (
                                <button 
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={cn(
                                        "px-1 pb-2.5 text-sm font-medium transition-colors duration-200 ml-6 -mb-px",
                                        activeTab === key 
                                            ? "text-blue-600 border-b-2 border-blue-600"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {TABS[key].label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50/50 min-h-[420px]">
                    <div className="flex-1">
                         {TABS[activeTab] && TABS[activeTab].content}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FinanceDetailsModal;
