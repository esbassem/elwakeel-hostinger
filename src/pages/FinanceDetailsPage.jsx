import React, { useState } from 'react';
import CustomerDetailsTab from '@/components/CustomerDetailsTab';
import CustomerGuarantorsTab from '@/components/CustomerGuarantorsTab';
import { Banknote, Calendar, User, CheckCircle2 } from 'lucide-react';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(0);
  }
  return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
};

const getInstallmentStatusInfo = (installment) => {
    if (!installment) return { color: 'bg-slate-200', tooltip: 'غير محدد' };

    if (installment.status === 'paid') {
        return { color: 'bg-green-500', tooltip: 'مدفوع' };
    }
    if (installment.status === 'partially_paid') {
        return { color: 'bg-yellow-500', tooltip: 'مدفوع جزئياً' };
    }

    const installmentDate = new Date(installment.installment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!isNaN(installmentDate.getTime()) && installmentDate < today) {
        return { color: 'bg-red-500', tooltip: 'متأخر' };
    }

    return { color: 'bg-slate-300', tooltip: 'قادم' };
};

const InstallmentsList = ({ installments }) => (
    <div className="space-y-2">
        {installments.length > 0 ? installments.map((inst, index) => (
            <div key={inst.id} className="flex justify-start items-center pb-[0.6rem] border-b border-slate-100 last:border-b-0">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-slate-100 text-slate-500 font-semibold text-sm w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                    </div>
                    <div>
                        <p className="font-bold text-lg text-slate-800 font-mono">{formatCurrency(inst.installment_amount)}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{inst.installment_label || '--'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{new Date(inst.installment_date).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>
                </div>
            </div>
        )) : (
            <div className="text-center py-16">
                <p className="font-medium text-slate-500">لا يوجد أقساط لعرضها.</p>
            </div>
        )}
    </div>
);

// New component to display payments
const PaymentsList = ({ payments }) => (
    <div className="space-y-3">
        {payments && payments.length > 0 ? (
            payments.map(payment => (
                <div key={payment.id} className="bg-white p-3.5 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Banknote size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-base text-slate-800 font-mono">{formatCurrency(payment.paid_amount)}</p>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                    <Calendar size={12} />
                                    <span>{new Date(payment.payment_date).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                <User size={12} />
                                <span>{payment.created_by || 'النظام'}</span>
                            </div>
                        </div>
                    </div>
                    {payment.note && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-600 leading-relaxed">{payment.note}</p>
                        </div>
                    )}
                </div>
            ))
        ) : (
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Banknote className="w-8 h-8 text-slate-400" />
                 </div>
                <p className="font-medium text-slate-500">لا توجد مدفوعات مسجلة.</p>
            </div>
        )}
    </div>
);


const FinanceDetailsPage = ({ financeContract }) => {
  const [activeTab, setActiveTab] = useState('installments');

  if (!financeContract) {
    return (
        <div className="flex items-center justify-center h-full p-8 font-cairo" dir="rtl">
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-700">لا يوجد بيانات</h2>
                <p className="text-slate-500">لم يتم تحميل بيانات التمويل لعرضها.</p>
            </div>
        </div>
    );
  }

  const { accounts: beneficiary, finance_name, installments, finance_installment_payments } = financeContract;
  
  const safeInstallments = installments || [];
  const safeBeneficiary = beneficiary || {};
  const safePayments = finance_installment_payments || [];

  const totalAmount = safeInstallments.reduce((acc, inst) => acc + (inst.installment_amount || 0), 0);
  // Correctly calculate paid amount from payments table
  const paidAmount = safePayments.reduce((acc, p) => acc + (p.paid_amount || 0), 0);

  const tabs = [
      { key: 'installments', label: 'الأقساط' },
      { key: 'client', label: 'العميل' },
      { key: 'guarantors', label: 'الضامنين' },
      { key: 'payments', label: 'المدفوعات' },
      { key: 'notes', label: 'الملاحظات' },
  ];

  const renderContent = () => {
    switch (activeTab) {
        case 'installments':
            return <InstallmentsList installments={safeInstallments} />;
        case 'client':
            return <CustomerDetailsTab beneficiary={safeBeneficiary} />;
        case 'guarantors':
            return <CustomerGuarantorsTab finance={financeContract} />;
        case 'payments':
            return <PaymentsList payments={safePayments} />;
        case 'notes':
             return <div className="text-center p-10 text-slate-500">محتوى الملاحظات سيعرض هنا.</div>;
        default:
            return null;
    }
  }

  return (
    <div className="font-cairo w-full h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm z-10">
        <div className="px-6 pt-10">
            <div className="pb-4">
                <h1 className="text-2xl font-bold text-slate-800 truncate">{finance_name || 'تفاصيل التمويل'}</h1>
                <p className="text-base text-slate-500 mt-1">{safeBeneficiary.nickname || 'العميل غير محدد'}</p>
            </div>

            <div className="py-6 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 text-slate-700">
                    <span className="font-bold text-2xl font-mono text-green-600">{formatCurrency(paidAmount)}</span>
                    <span className="text-slate-400 font-medium text-sm">/</span>
                    <span className="font-semibold text-base font-mono">{formatCurrency(totalAmount)}</span>
                </div>
                {safeInstallments.length > 0 && (
                    <div className="flex items-center gap-1.5" title={`${safeInstallments.length} أقساط`}>
                        {safeInstallments.map(inst => {
                            const { color, tooltip } = getInstallmentStatusInfo(inst);
                            return (
                                <div 
                                    key={inst.id} 
                                    className={`w-3 h-5 rounded-[3px] ${color}`}
                                    title={`${tooltip}: ${formatCurrency(inst.installment_amount)}`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200">
            <div className="flex w-full bg-slate-100/80 border border-slate-200/90 rounded-lg p-1">
                {tabs.map((tab) => (
                    <button 
                        key={tab.key} 
                        onClick={() => setActiveTab(tab.key)}
                        className={`w-full text-center px-2 py-2 text-sm font-semibold rounded-md transition-all duration-200 
                                    ${activeTab === tab.key 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
      </div>
      
      {/* Scrollable Tab Content */}
      <div className="px-6 pt-4 pb-10 flex-grow overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default FinanceDetailsPage;
