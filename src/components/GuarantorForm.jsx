
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { 
  User, Phone, Briefcase, MapPin, CreditCard, StickyNote, 
  UserPlus, Search, Save, X, Edit, Loader2, Image as ImageIcon,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SearchableAccountSelect from './SearchableAccountSelect';
import GuarantorRegistrationForm from './GuarantorRegistrationForm';
import CompactImageUpload from './CompactImageUpload';
import { useGuarantorDetails } from '@/hooks/useGuarantorDetails';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const GuarantorForm = ({ data, onChange, index, accounts = [], isDraft = true }) => {
  const { updateGuarantorAccount, loading } = useGuarantorDetails();
  const { toast } = useToast();
  
  // Local state for editing fields
  const [localData, setLocalData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    address: '',
    job: '',
    job_address: '',
    national_id: '',
    id_card_front: '',
    id_card_back: '',
    id_card_image: ''
  });

  const selectedAccount = accounts.find(a => a.id === data.guarantor_account_id);
  const isNewMode = data.mode === 'new';

  // Initialize localData when selectedAccount changes
  useEffect(() => {
    if (selectedAccount) {
      setLocalData({
        name: selectedAccount.name || '',
        phone1: selectedAccount.phone1 || '',
        phone2: selectedAccount.phone2 || '',
        address: selectedAccount.address || '',
        job: selectedAccount.job || '',
        job_address: selectedAccount.job_address || '',
        national_id: selectedAccount.national_id || '',
        id_card_front: selectedAccount.id_card_front || '',
        id_card_back: selectedAccount.id_card_back || '',
        id_card_image: selectedAccount.id_card_image || ''
      });
    }
  }, [selectedAccount]);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleModeChange = (mode) => {
    onChange({ 
      ...data, 
      mode,
      guarantor_account_id: mode === 'existing' ? data.guarantor_account_id : '',
    });
  };

  const handleLocalChange = (field, value) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!data.guarantor_account_id) return;

    // Prepare updates for the account
    const accountUpdates = {
      name: localData.name,
      phone1: localData.phone1,
      phone2: localData.phone2,
      address: localData.address,
      job: localData.job,
      job_address: localData.job_address,
      national_id: localData.national_id,
      id_card_front: localData.id_card_front,
      id_card_back: localData.id_card_back,
      id_card_image: localData.id_card_image
    };

    const { error } = await updateGuarantorAccount(data.guarantor_account_id, accountUpdates);

    if (!error) {
       // Update parent state as well to reflect changes immediately in the UI (e.g. summary)
       onChange({ 
          ...data,
          ...localData
       });
    }
  };

  // Helper input component
  const InputField = ({ label, value, onChange, icon: Icon, placeholder, className, type = "text" }) => (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-bold text-slate-600">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />}
        <Input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 pr-10 pl-3 text-sm bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
      
      {!isNewMode && (
        <div className="space-y-4">
          {!selectedAccount ? (
             <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Label className="text-xs text-slate-500 font-bold">البحث في الحسابات</Label>
                <SearchableAccountSelect 
                   accounts={accounts}
                   value={data.guarantor_account_id}
                   onChange={(val) => handleChange('guarantor_account_id', val)}
                   placeholder="ابحث عن اسم الضامن..."
                   onAddNew={() => handleModeChange('new')} 
                />
             </div>
          ) : (
            <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               
               {/* Header Section */}
               <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        {localData.id_card_image ? (
                           <img src={localData.id_card_image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                           <User className="w-6 h-6 text-indigo-500" />
                        )}
                     </div>
                     <div>
                        <h3 className="text-base font-bold text-slate-800 leading-none mb-1.5">{localData.name || 'بدون اسم'}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">ضامن مسجل</span>
                            {localData.phone1 && <span className="font-mono">{localData.phone1}</span>}
                        </div>
                     </div>
                  </div>
                  
                  <Button 
                     size="sm" 
                     variant="ghost"
                     onClick={() => handleChange('guarantor_account_id', '')}
                     className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
                     title="إزالة الضامن"
                  >
                     <X className="w-5 h-5" />
                  </Button>
               </div>

               <div className="p-6 space-y-8">
                  
                  {/* Images Section */}
                  <div className="grid grid-cols-3 gap-4">
                     <CompactImageUpload 
                        label="صورة البطاقة (أمام)"
                        value={localData.id_card_front}
                        onChange={(url) => handleLocalChange('id_card_front', url)}
                        heightClass="h-32"
                     />
                     <CompactImageUpload 
                        label="صورة البطاقة (خلف)"
                        value={localData.id_card_back}
                        onChange={(url) => handleLocalChange('id_card_back', url)}
                        heightClass="h-32"
                     />
                     <CompactImageUpload 
                        label="صورة شخصية"
                        value={localData.id_card_image}
                        onChange={(url) => handleLocalChange('id_card_image', url)}
                        heightClass="h-32"
                     />
                  </div>

                  {/* Form Fields Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InputField 
                        label="الاسم الكامل"
                        value={localData.name}
                        onChange={(val) => handleLocalChange('name', val)}
                        icon={User}
                        placeholder="اسم الضامن"
                     />
                     <InputField 
                        label="الرقم الوطني"
                        value={localData.national_id}
                        onChange={(val) => handleLocalChange('national_id', val)}
                        icon={CreditCard}
                        placeholder="الرقم القومي"
                     />
                     <InputField 
                        label="رقم الهاتف 1"
                        value={localData.phone1}
                        onChange={(val) => handleLocalChange('phone1', val)}
                        icon={Phone}
                        placeholder="01xxxxxxxxx"
                     />
                     <InputField 
                         label="رقم الهاتف 2"
                         value={localData.phone2}
                         onChange={(val) => handleLocalChange('phone2', val)}
                         icon={Phone}
                         placeholder="01xxxxxxxxx"
                     />
                     <InputField 
                        label="العنوان"
                        value={localData.address}
                        onChange={(val) => handleLocalChange('address', val)}
                        icon={MapPin}
                        placeholder="العنوان السكني"
                     />
                     <InputField 
                        label="الوظيفة"
                        value={localData.job}
                        onChange={(val) => handleLocalChange('job', val)}
                        icon={Briefcase}
                        placeholder="المسمى الوظيفي"
                     />
                     <InputField 
                        label="عنوان العمل"
                        value={localData.job_address}
                        onChange={(val) => handleLocalChange('job_address', val)}
                        icon={MapPin}
                        placeholder="مقر العمل"
                     />
                  </div>

                  {/* Relationship & Notes */}
                  <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-100 space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <StickyNote className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">بيانات الضمان الإضافية</span>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-xs font-bold text-slate-600">صلة القرابة</Label>
                           <Input 
                              value={data.relationship || ''}
                              onChange={(e) => handleChange('relationship', e.target.value)}
                              className="h-10 text-sm bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-100"
                              placeholder="مثال: أخ، صديق، زميل"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold text-slate-600">ملاحظات</Label>
                           <Textarea 
                              value={data.note || ''}
                              onChange={(e) => handleChange('note', e.target.value)}
                              className="min-h-[42px] h-10 py-2 text-sm bg-white border-slate-200 focus:border-amber-500 focus:ring-amber-100 resize-none"
                              placeholder="ملاحظات إضافية..."
                           />
                        </div>
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                    <Button 
                        onClick={handleSave}
                        disabled={loading}
                        className="h-10 min-w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm font-bold shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-1px]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ التعديلات
                    </Button>
                  </div>

               </div>
            </div>
          )}
        </div>
      )}

      {isNewMode && (
        <GuarantorRegistrationForm 
          data={data}
          onChange={onChange}
        />
      )}

    </div>
  );
};

export default GuarantorForm;
