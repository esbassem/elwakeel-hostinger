
'use client';
import React from 'react';
import { useFinanceTimeline } from '@/hooks/useFinanceTimeline'; // Hook مخصص لجلب ودمج البيانات
import { CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';

// مكون لعرض أيقونة الحالة
const StatusIcon = ({ status }) => {
    switch (status) {
        case 'paid':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'pending':
            return <Clock className="h-5 w-5 text-gray-400" />;
        case 'overdue':
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        case 'payment':
            return <DollarSign className="h-5 w-5 text-blue-500" />;
        default:
            return null;
    }
};

// المكون الرئيسي للجدول الزمني
const CombinedTimeline = ({ financeId }) => {
    const { timeline, loading, error } = useFinanceTimeline(financeId);

    if (loading) return <div className="p-4 text-center">جاري تحميل الجدول الزمني...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (timeline.length === 0) return <div className="p-4 text-center text-gray-500">لا توجد بيانات لعرضها.</div>;

    return (
        <div className="p-4 space-y-6">
            {timeline.map((item, index) => (
                <div key={index} className="flex items-start space-x-4" dir="rtl">
                    {/* الأيقونة والخط الزمني */}
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                           <StatusIcon status={item.type === 'payment' ? 'payment' : item.status} />
                        </div>
                        {index < timeline.length - 1 && (
                            <div className="w-px flex-grow bg-slate-200 mt-2"></div>
                        )}
                    </div>

                    {/* المحتوى */}
                    <div className="flex-1 pt-1.5">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-700">
                                {item.type === 'installment' ? `القسط #${item.installment_number}` : 'دفعة مالية'}
                            </span>
                            <span className="text-sm text-gray-500">
                                {new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <p className={`text-lg font-bold ${item.type === 'payment' ? 'text-blue-600' : 'text-slate-800'}`}>
                            {item.amount.toLocaleString()} د.ل
                        </p>
                         {item.status && item.type === 'installment' && (
                             <p className={`text-sm font-medium mt-1 ${item.status === 'paid' ? 'text-green-600' : item.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                                 {item.status === 'paid' ? 'مدفوع' : item.status === 'overdue' ? 'متأخر' : 'قادم'}
                             </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CombinedTimeline;
