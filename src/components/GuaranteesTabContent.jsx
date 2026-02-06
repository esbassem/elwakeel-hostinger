
import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Plus, User, Phone, Briefcase, MapPin, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';

const GuaranteesTabContent = ({ financeId }) => {
  const [guarantees, setGuarantees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { deleteGuarantor } = useFinance();

  useEffect(() => {
    if (financeId) fetchGuarantees();
  }, [financeId]);

  const fetchGuarantees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('guarantees')
      .select(`
        *,
        accounts:guarantor_account_id (*)
      `)
      .eq('finance_contract_id', financeId) // Updated column name
      .neq('guarantee_type', 'receipts_bundle');
    setGuarantees(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
     if(!window.confirm("هل أنت متأكد من حذف هذا الضامن؟")) return;
     await deleteGuarantor(id);
     fetchGuarantees();
  };

  return (
    <div className="space-y-6 pb-10">
       <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Shield className="w-5 h-5 text-blue-600" />
             الضامنين المسجلين
          </h3>
          <Button variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
             <Plus className="w-4 h-4" />
             إضافة ضامن جديد
          </Button>
       </div>

       {loading ? (
          <div className="flex justify-center py-12">
             <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
       ) : guarantees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-slate-300" />
             </div>
             <h4 className="text-slate-800 font-bold mb-1">لا يوجد ضامنين</h4>
             <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                لم يتم إضافة أي ضامن لهذا التمويل بعد. يفضل إضافة ضامن لتعزيز الموثوقية.
             </p>
             <Button className="bg-blue-600 text-white hover:bg-blue-700">
                إضافة ضامن الآن
             </Button>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {guarantees.map((guaranty) => {
                const account = guaranty.accounts;
                if (!account) return null; // Should not happen if data integrity is kept

                return (
                  <div key={guaranty.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-r-none"></div>
                     
                     <div className="flex justify-between items-start mb-4 pr-3">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden border border-blue-100">
                              {account.id_card_image || account.id_card_front ? (
                                <img src={account.id_card_image || account.id_card_front} alt={account.name} className="w-full h-full object-cover" />
                              ) : (
                                account.name ? account.name.charAt(0) : <User className="w-6 h-6" />
                              )}
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800">{account.name || 'بدون اسم'}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                    {guaranty.relationship || 'ضامن'}
                                 </span>
                                 {account.nickname && <span className="text-[10px] text-slate-400">({account.nickname})</span>}
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                           </Button>
                           <Button onClick={() => handleDelete(guaranty.id)} size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-600">
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>

                     <div className="space-y-3 pr-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                           <Phone className="w-4 h-4 text-slate-300" />
                           <span className="font-mono">{account.phone1 || 'غير مسجل'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                           <Briefcase className="w-4 h-4 text-slate-300" />
                           <span>{account.job || 'غير مسجل'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                           <MapPin className="w-4 h-4 text-slate-300" />
                           <span className="truncate">{account.address || 'غير مسجل'}</span>
                        </div>
                        {guaranty.note && (
                           <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-500 italic">
                              "{guaranty.note}"
                           </div>
                        )}
                     </div>
                  </div>
                );
             })}
          </div>
       )}
    </div>
  );
};

export default GuaranteesTabContent;
