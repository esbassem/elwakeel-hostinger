
import React, { useState } from 'react';
import { 
  User, Phone, MapPin, Briefcase, Calendar, 
  CreditCard, StickyNote, Mail, Save, X, Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CompactImageUpload from './CompactImageUpload';
import { useGuarantorDetails } from '@/hooks/useGuarantorDetails';
import { Loader2 } from 'lucide-react';

const GuarantorEditForm = ({ initialData, onSave, onCancel, isDraft = false }) => {
  const [formData, setFormData] = useState({
    // Account Data
    name: initialData.name || '',
    phone1: initialData.phone1 || '',
    phone2: initialData.phone2 || '',
    address: initialData.address || '',
    job: initialData.job || '',
    job_address: initialData.job_address || '',
    birth_date: initialData.birth_date || '',
    national_id: initialData.national_id || '',
    email: initialData.email || '',
    id_card_front: initialData.id_card_front || '',
    id_card_back: initialData.id_card_back || '',
    id_card_image: initialData.id_card_image || '',
    
    // Guarantee Data
    relationship: initialData.relationship || '',
    note: initialData.note || '',
    
    // IDs
    accountId: initialData.id || initialData.guarantor_account_id,
    guaranteeId: initialData.guarantee_id
  });

  const { updateGuarantorAccount, updateGuaranteeInfo, loading } = useGuarantorDetails();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Update Account Data (Always update if we have an account ID)
    if (formData.accountId) {
      const accountUpdates = {
        name: formData.name,
        phone1: formData.phone1,
        phone2: formData.phone2,
        address: formData.address,
        job: formData.job,
        job_address: formData.job_address,
        birth_date: formData.birth_date || null,
        national_id: formData.national_id,
        email: formData.email,
        id_card_front: formData.id_card_front,
        id_card_back: formData.id_card_back,
        id_card_image: formData.id_card_image
      };
      
      const { error: accError } = await updateGuarantorAccount(formData.accountId, accountUpdates);
      if (accError) return;
    }

    // 2. Update Guarantee Data (Only if not draft mode and we have guarantee ID)
    if (!isDraft && formData.guaranteeId) {
      const guaranteeUpdates = {
        relationship: formData.relationship,
        note: formData.note
      };
      const { error: guarError } = await updateGuaranteeInfo(formData.guaranteeId, guaranteeUpdates);
      if (guarError) return;
    }

    // Return combined data to parent
    onSave(formData);
  };

  const InputField = ({ label, value, onChange, icon: Icon, type = "text", placeholder }) => (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-stone-500">{label}</Label>
      <div className="relative">
        {Icon && <Icon className="absolute right-3 top-2.5 w-4 h-4 text-stone-400" />}
        <Input 
          type={type}
          value={value}
          onChange={onChange}
          className={`h-9 pr-9 pl-3 text-xs bg-white border-stone-200 focus:border-indigo-500 ${type === 'date' ? 'font-mono' : ''}`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Account Personal Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
          <User className="w-4 h-4 text-indigo-500" />
          البيانات الشخصية
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="الاسم الكامل"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            icon={User}
            placeholder="الاسم الرباعي"
          />
          <InputField 
            label="الرقم الوطني"
            value={formData.national_id}
            onChange={e => setFormData({...formData, national_id: e.target.value})}
            icon={CreditCard}
            placeholder="رقم وطني / إثبات هوية"
          />
          <InputField 
            label="تاريخ الميلاد"
            type="date"
            value={formData.birth_date}
            onChange={e => setFormData({...formData, birth_date: e.target.value})}
            icon={Calendar}
          />
           <InputField 
            label="البريد الإلكتروني"
            type="email"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            icon={Mail}
            placeholder="email@example.com"
          />
        </div>
      </div>

      {/* Contact & Job */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
          <Phone className="w-4 h-4 text-emerald-500" />
          الاتصال والعمل
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField 
            label="رقم الهاتف 1"
            value={formData.phone1}
            onChange={e => setFormData({...formData, phone1: e.target.value})}
            icon={Phone}
            placeholder="09..."
          />
          <InputField 
            label="رقم الهاتف 2"
            value={formData.phone2}
            onChange={e => setFormData({...formData, phone2: e.target.value})}
            icon={Phone}
            placeholder="09..."
          />
          <InputField 
            label="العنوان السكني"
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            icon={MapPin}
            placeholder="المدينة - المنطقة - الشارع"
          />
           <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="الوظيفة"
              value={formData.job}
              onChange={e => setFormData({...formData, job: e.target.value})}
              icon={Briefcase}
            />
            <InputField 
              label="عنوان العمل"
              value={formData.job_address}
              onChange={e => setFormData({...formData, job_address: e.target.value})}
              icon={MapPin}
            />
           </div>
        </div>
      </div>

      {/* Guarantee Specific Info */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-4">
        <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2 border-b border-amber-200 pb-2">
          <Link className="w-4 h-4" />
          بيانات الضمان
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <InputField 
            label="صلة القرابة"
            value={formData.relationship}
            onChange={e => setFormData({...formData, relationship: e.target.value})}
            placeholder="مثال: أخ، صديق، زميل"
           />
           <div className="space-y-1">
              <Label className="text-xs font-bold text-amber-700">ملاحظات الضمان</Label>
              <div className="relative">
                 <StickyNote className="absolute right-3 top-2.5 w-4 h-4 text-amber-400" />
                 <Textarea 
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    className="pr-9 pl-3 text-xs bg-white border-amber-200 focus:border-amber-500 min-h-[80px]"
                    placeholder="ملاحظات إضافية حول الضمان..."
                 />
              </div>
           </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            المستندات
         </h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <CompactImageUpload 
               label="بطاقة (أمام)"
               value={formData.id_card_front}
               onChange={url => setFormData({...formData, id_card_front: url})}
            />
            <CompactImageUpload 
               label="بطاقة (خلف)"
               value={formData.id_card_back}
               onChange={url => setFormData({...formData, id_card_back: url})}
            />
            <CompactImageUpload 
               label="صورة شخصية"
               value={formData.id_card_image}
               onChange={url => setFormData({...formData, id_card_image: url})}
            />
         </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
         <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            إلغاء
         </Button>
         <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            حفظ التغييرات
         </Button>
      </div>
    </form>
  );
};

export default GuarantorEditForm;
