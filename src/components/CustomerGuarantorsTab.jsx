import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { User, Phone, MapPin, Briefcase, CreditCard, Users, ShieldCheck, Loader2 } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 text-right">
      <p className="text-[10px] font-bold text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || 'غير متوفر'}</p>
    </div>
  </div>
);

const CustomerGuarantorsTab = ({ finance }) => {
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuarantors = async () => {
      if (!finance?.id) return;
      try {
        setLoading(true);
        const { data } = await supabase
          .from('guarantees')
          .select('*')
          .eq('finance_id', finance.id)
          .neq('guarantee_type', 'receipts_bundle');
        setGuarantors(data || []);
      } catch (error) {
        console.error('Error fetching guarantors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuarantors();
  }, [finance?.id]);

  if (!finance) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* Customer Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
               <User className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">بيانات العميل</h3>
         </div>
         
         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <InfoRow icon={User} label="اسم العميل" value={finance.accounts?.name} />
            <InfoRow icon={Phone} label="رقم الهاتف الأساسي" value={finance.accounts?.phone1} />
            <InfoRow icon={Phone} label="رقم الهاتف الإضافي" value={finance.accounts?.phone2} />
            <InfoRow icon={MapPin} label="العنوان" value={finance.accounts?.address} />
            <InfoRow icon={CreditCard} label="الرقم القومي" value={finance.accounts?.national_id} />
            <InfoRow icon={Briefcase} label="الوظيفة" value={finance.accounts?.job} />
         </div>
      </div>

      {/* Guarantors Section */}
      <div>
         <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm px-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            الضامنين
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
               {loading ? '...' : guarantors.length}
            </span>
         </h3>

         {loading ? (
            <div className="flex justify-center py-8">
               <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
         ) : guarantors.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
               <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
               <p className="text-slate-500 text-sm font-medium">لا يوجد ضامنين مسجلين</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-3">
               {guarantors.map((guarantor) => (
                  <div key={guarantor.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
                     <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                              {guarantor.name ? guarantor.name.charAt(0) : <User />}
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800 text-sm">{guarantor.name}</h4>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                                 {guarantor.relationship || 'ضامن'}
                              </span>
                           </div>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50/50">
                           <span className="text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> الهاتف
                           </span>
                           <span className="font-mono text-slate-700 font-semibold">{guarantor.phone || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50/50">
                           <span className="text-slate-400 flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3" /> الرقم القومي
                           </span>
                           <span className="font-mono text-slate-700 font-semibold">{guarantor.national_id || '-'}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
};

export default CustomerGuarantorsTab;