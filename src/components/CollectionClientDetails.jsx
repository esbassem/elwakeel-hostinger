
import React, { useMemo } from 'react';
import { 
  X, Phone, MapPin, CreditCard, Calendar, 
  AlertTriangle, CheckCircle2, FileText, PhoneCall 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const CollectionClientDetails = ({ client, onClose }) => {
  // Aggregate all installments from all contracts
  // Moved useMemo before the conditional return to comply with React Hook rules
  const allInstallments = useMemo(() => {
    if (!client) return [];
    return client.contracts.flatMap(contract => 
      contract.installments.map(inst => ({
        ...inst,
        contractName: contract.name,
        remaining: Number(inst.installment_amount) - Number(inst.total_paid_amount)
      }))
    ).sort((a, b) => new Date(a.installment_date) - new Date(b.installment_date));
  }, [client]);

  if (!client) return null;

  const overdueInstallments = allInstallments.filter(i => 
    new Date(i.installment_date) < new Date() && i.remaining > 0
  );

  const upcomingInstallments = allInstallments.filter(i => 
    new Date(i.installment_date) >= new Date() && i.remaining > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row" dir="rtl">
        
        {/* Left Sidebar (Customer Info) */}
        <div className="w-full md:w-80 bg-stone-50 border-l border-stone-200 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner ${
               client.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {client.name?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-stone-900 leading-tight mb-1">{client.name}</h2>
            <Badge variant={client.status === 'overdue' ? 'destructive' : 'secondary'}>
              {client.status === 'overdue' ? 'عليه متأخرات' : 'وضع جيد'}
            </Badge>
          </div>

          <div className="space-y-4">
            <InfoItem icon={Phone} label="رقم الهاتف" value={client.phone1} isLink />
            <InfoItem icon={MapPin} label="العنوان" value={client.address || 'غير مسجل'} />
            <InfoItem icon={FileText} label="الرقم الوطني" value={client.national_id || 'غير مسجل'} />
          </div>

          <Separator />

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="text-sm font-bold text-stone-500 mb-3">ملخص المديونية</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-400">إجمالي المستحق</span>
                <span className="font-bold text-stone-800">{client.totalOutstanding.toLocaleString()} د.ل</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-400">المتأخرات</span>
                <span className="font-bold text-red-600">{client.overdueAmount.toLocaleString()} د.ل</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-stone-400">عدد الأقساط</span>
                <span className="font-mono text-sm">{overdueInstallments.length} متأخر / {allInstallments.length} كلي</span>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="mt-auto w-full gap-2 border-dashed" disabled>
             <PhoneCall className="w-4 h-4" />
             تسجيل مكالمة (قريباً)
          </Button>
        </div>

        {/* Right Content (Details) */}
        <div className="flex-1 flex flex-col h-full bg-white">
          <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-bold text-lg text-stone-800">تفاصيل الأقساط والتحصيل</h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-stone-100">
              <X className="w-6 h-6 text-stone-500" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-10">
              
              {/* Overdue Section */}
              {overdueInstallments.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-bold">الأقساط المتأخرة ({overdueInstallments.length})</h4>
                  </div>
                  <div className="grid gap-3">
                    {overdueInstallments.map(inst => (
                      <InstallmentCard key={inst.id} inst={inst} isOverdue />
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming Section */}
              {upcomingInstallments.length > 0 && (
                <section>
                   <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <Calendar className="w-5 h-5" />
                    <h4 className="font-bold">الأقساط القادمة</h4>
                  </div>
                  <div className="grid gap-3">
                    {upcomingInstallments.slice(0, 5).map(inst => (
                      <InstallmentCard key={inst.id} inst={inst} />
                    ))}
                    {upcomingInstallments.length > 5 && (
                       <div className="text-center text-sm text-stone-400 italic py-2">
                         + {upcomingInstallments.length - 5} أقساط أخرى
                       </div>
                    )}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {allInstallments.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 text-stone-300">
                    <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                    <p>لا توجد أقساط مستحقة لهذا العميل</p>
                 </div>
              )}

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, isLink }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-stone-100 rounded-lg text-stone-500 mt-0.5">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-stone-400 font-medium mb-0.5">{label}</p>
      {isLink && value ? (
         <a href={`tel:${value}`} className="text-sm font-bold text-indigo-600 hover:underline dir-ltr block text-right">{value}</a>
      ) : (
         <p className="text-sm font-bold text-stone-700">{value}</p>
      )}
    </div>
  </div>
);

const InstallmentCard = ({ inst, isOverdue }) => (
  <div className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
    isOverdue 
      ? 'bg-red-50/50 border-red-100 hover:border-red-200' 
      : 'bg-white border-stone-100 hover:border-stone-200'
  }`}>
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-bold ${isOverdue ? 'text-red-700' : 'text-stone-700'}`}>
          {inst.contractName}
        </span>
        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
          قسط #{inst.installment_number}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
        <Calendar className="w-3 h-3" />
        {new Date(inst.installment_date).toLocaleDateString('ar-LY')}
      </div>
    </div>
    
    <div className="text-left">
      <div className="font-bold text-stone-800">
        {inst.remaining.toLocaleString()} <span className="text-xs text-stone-400">د.ل</span>
      </div>
      {isOverdue && (
        <span className="text-[10px] text-red-500 font-bold bg-red-100 px-1.5 py-0.5 rounded">متأخر</span>
      )}
    </div>
  </div>
);

export default CollectionClientDetails;
