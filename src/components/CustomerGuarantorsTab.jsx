import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { User, Users, Loader2 } from 'lucide-react';

// Helper component for displaying details
const DetailItem = ({ label, value }) => (
    <div className="py-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
            {value || <span className="font-normal text-slate-400">--</span>}
        </p>
    </div>
);

// Helper component for displaying images
const ImagePreview = ({ title, url }) => (
    <div className="w-full">
        <p className="text-xs font-semibold text-slate-700 mb-2">
            {title}
        </p>
        {url ? (
            <div className="h-28 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                <img src={url} alt={title} className="w-full h-full object-contain" />
            </div>
        ) : (
            <div className="h-28 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center">
                <p className="text-sm text-slate-400">لا توجد صورة</p>
            </div>
        )}
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
        const { data, error } = await supabase
          .from('guarantees')
          .select('*, accounts:guarantor_account_id(*)')
          .eq('finance_contract_id', finance.id)
          .neq('guarantee_type', 'receipts_bundle');

        if (error) throw error;
        
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

  if (loading) {
    return (
        <div className="flex justify-center py-8">
           <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
    );
  }

  if (guarantors.length === 0) {
    return (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
           <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
           <p className="text-slate-500 text-sm font-medium">لا يوجد ضامنين مسجلين</p>
        </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="grid grid-cols-1 gap-6">
        {guarantors.map((guarantee, index) => {
            const guarantorAccount = guarantee.accounts;
            if (!guarantorAccount) return null;

            return (
              <div key={guarantee.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* Guarantor Header */}
                  <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {guarantorAccount.name ? guarantorAccount.name.charAt(0) : <User />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{guarantorAccount.name}</h4>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                              {guarantee.relationship || `ضامن ${index + 1}`}
                          </span>
                        </div>
                    </div>
                  </div>

                  {/* Guarantor Details */}
                  <div className="p-4">
                    <div className="px-1">
                      <DetailItem label="الرقم القومي" value={guarantorAccount.national_id} />
                      <div className="grid grid-cols-2 py-2">
                          <div>
                              <p className="text-xs font-medium text-slate-500">هاتف 1</p>
                              <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
                                  {guarantorAccount.phone1 || <span className="font-normal text-slate-400">--</span>}
                              </p>
                          </div>
                          <div>
                              <p className="text-xs font-medium text-slate-500">هاتف 2</p>
                              <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">
                                  {guarantorAccount.phone2 || <span className="font-normal text-slate-400">--</span>}
                              </p>
                          </div>
                      </div>
                      <DetailItem label="عنوان السكن" value={guarantorAccount.address} />
                      <DetailItem label="الوظيفة" value={guarantorAccount.job} />
                      <DetailItem label="عنوان العمل" value={guarantorAccount.job_address} />
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImagePreview 
                                title="البطاقة الشخصية (وجه أمامي)" 
                                url={guarantorAccount.id_card_front}
                            />
                            <ImagePreview 
                                title="البطاقة الشخصية (وجه خلفي)" 
                                url={guarantorAccount.id_card_back}
                            />
                        </div>
                    </div>
                  </div>
              </div>
            )
          })}
      </div>
    </div>
  );
};

export default CustomerGuarantorsTab;
