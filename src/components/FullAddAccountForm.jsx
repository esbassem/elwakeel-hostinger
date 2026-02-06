
import React, { useState, useEffect } from 'react';
import { Upload, X, AlertCircle, Image as ImageIcon, ScanText, Loader2, CreditCard, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Tesseract from 'tesseract.js';

const FullAddAccountForm = ({ isOpen, onClose, onSuccess, editAccount = null }) => {
  const { addAccount, updateAccount, getMissingFields, loading: saving } = useAccounts();
  const { toast } = useToast();
  
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [personalFile, setPersonalFile] = useState(null);
  const [personalPreview, setPersonalPreview] = useState(null);
  
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    phone1: '',
    phone2: '',
    address: '',
    birth_date: '',
    job: '',
    job_address: '',
    notes: '',
    account_type: 'customer',
    id_card_image: '', // Now used for Personal Photo
    id_card_front: '', // New field
    id_card_back: '',  // New field
    national_id: ''
  });

  useEffect(() => {
    if (editAccount) {
      setFormData({
        name: editAccount.name || '',
        nickname: editAccount.nickname || '',
        phone1: editAccount.phone1 || '',
        phone2: editAccount.phone2 || '',
        address: editAccount.address || '',
        birth_date: editAccount.birth_date || '',
        job: editAccount.job || '',
        job_address: editAccount.job_address || '',
        notes: editAccount.notes || '',
        account_type: editAccount.account_type || 'customer',
        id_card_image: editAccount.id_card_image || '',
        id_card_front: editAccount.id_card_front || '',
        id_card_back: editAccount.id_card_back || '',
        national_id: editAccount.national_id || ''
      });
      setPersonalPreview(editAccount.id_card_image || null);
      setFrontPreview(editAccount.id_card_front || null);
      setBackPreview(editAccount.id_card_back || null);
    } else {
      setFormData({
        name: '',
        nickname: '',
        phone1: '',
        phone2: '',
        address: '',
        birth_date: '',
        job: '',
        job_address: '',
        notes: '',
        account_type: 'customer',
        id_card_image: '',
        id_card_front: '',
        id_card_back: '',
        national_id: ''
      });
      setPersonalPreview(null);
      setFrontPreview(null);
      setBackPreview(null);
    }
    setFrontFile(null);
    setBackFile(null);
    setPersonalFile(null);
  }, [editAccount, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const processImageWithOCR = async (file) => {
    if (!file) return;

    setIsProcessingOCR(true);
    toast({
      title: "جاري تحليل البطاقة",
      description: "يتم الآن استخراج البيانات من وجه البطاقة...",
    });

    try {
      const result = await Tesseract.recognize(
        file,
        'ara',
        { 
          logger: m => {}
        }
      );

      const text = result.data.text;
      const nationalIdMatch = text.match(/\b\d{14}\b/);
      let foundNationalId = '';
      let foundBirthDate = '';

      if (nationalIdMatch) {
        foundNationalId = nationalIdMatch[0];
        
        const century = parseInt(foundNationalId.charAt(0));
        const yearPart = foundNationalId.substring(1, 3);
        const monthPart = foundNationalId.substring(3, 5);
        const dayPart = foundNationalId.substring(5, 7);

        let fullYear = '';
        if (century === 2) fullYear = '19' + yearPart;
        else if (century === 3) fullYear = '20' + yearPart;

        if (fullYear) {
          foundBirthDate = `${fullYear}-${monthPart}-${dayPart}`;
        }
      }

      const lines = text.split('\n').filter(line => line.trim().length > 0);
      let foundName = '';
      
      for (const line of lines) {
        const cleanLine = line.trim();
        const wordCount = cleanLine.split(/\s+/).length;
        if (wordCount >= 3 && 
            !/\d/.test(cleanLine) && 
            !cleanLine.includes('جمهورية') && 
            !cleanLine.includes('وزارة') &&
            !cleanLine.includes('بطاقة')) {
             foundName = cleanLine;
             break;
        }
      }

      setFormData(prev => ({
        ...prev,
        national_id: foundNationalId || prev.national_id,
        birth_date: foundBirthDate || prev.birth_date,
        name: (foundName && !prev.name) ? foundName : prev.name
      }));

      toast({
        title: "تم استخراج البيانات",
        description: foundNationalId 
          ? "تم التعرف على الرقم القومي وتاريخ الميلاد." 
          : "تم تحليل الصورة، يرجى مراجعة البيانات المستخرجة.",
        className: "bg-emerald-50 border-emerald-200"
      });

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "خطأ في التحليل",
        description: "لم نتمكن من قراءة البيانات تلقائياً.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleFrontChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFrontPreview(reader.result);
      reader.readAsDataURL(file);
      processImageWithOCR(file);
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBackPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPersonalFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPersonalPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const { data, error } = await supabase.storage
      .from('account-id-cards')
      .upload(path, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('account-id-cards')
      .getPublicUrl(path);
      
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = getMissingFields(formData);
    if (missingFields.length > 0) {
      if (!window.confirm(`تحذير: يوجد ${missingFields.length} حقل مفقود. متابعة؟`)) return;
    }

    try {
      const tempId = editAccount?.id || crypto.randomUUID();
      let frontUrl = formData.id_card_front;
      let backUrl = formData.id_card_back;
      let personalUrl = formData.id_card_image;

      if (frontFile) frontUrl = await uploadFile(frontFile, `${tempId}/front_${Date.now()}`);
      if (backFile) backUrl = await uploadFile(backFile, `${tempId}/back_${Date.now()}`);
      if (personalFile) personalUrl = await uploadFile(personalFile, `${tempId}/personal_${Date.now()}`);

      const accountData = { 
        ...formData, 
        id_card_front: frontUrl,
        id_card_back: backUrl,
        id_card_image: personalUrl
      };

      if (editAccount) {
        const { error } = await updateAccount(editAccount.id, accountData);
        if (!error) {
          onSuccess?.();
          onClose();
        }
      } else {
        const { data, error } = await addAccount(accountData);
        if (!error && data) {
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  const ImageUploadBox = ({ title, preview, onChange, onClear, icon: Icon, isLoading = false }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-stone-600">{title}</label>
      {preview ? (
        <div className="relative w-full aspect-video group">
          <img src={preview} alt={title} className="w-full h-full object-cover rounded-xl border border-stone-200" />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <Loader2 className="w-6 h-6 animate-spin mb-1" />
              <span className="text-xs">جاري المعالجة...</span>
            </div>
          )}
        </div>
      ) : (
        <label className="w-full aspect-video border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
          <input type="file" accept="image/*" onChange={onChange} className="hidden" />
          <div className="p-3 bg-stone-100 rounded-full mb-2">
            <Icon className="w-5 h-5 text-stone-400" />
          </div>
          <span className="text-xs font-bold text-stone-500">رفع الصورة</span>
        </label>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white rounded-3xl border-none p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 p-6 sticky top-0 z-10 flex justify-between items-center">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              {editAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              المعلومات الشخصية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">اللقب</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">الرقم القومي</label>
                <div className="relative">
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id}
                    onChange={handleChange}
                    className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800 tracking-wider"
                    maxLength={14}
                    placeholder="14 رقم"
                  />
                  {formData.national_id && formData.national_id.length === 14 && (
                    <div className="absolute left-3 top-3 text-emerald-500">
                      <ScanText className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">تاريخ الميلاد</label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">نوع الحساب</label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                >
                  <option value="customer">عميل</option>
                  <option value="supplier">مورد</option>
                  <option value="both">عميل ومورد</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              معلومات الاتصال
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">رقم هاتف 1</label>
                <input
                  type="tel"
                  name="phone1"
                  value={formData.phone1}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">رقم هاتف 2</label>
                <input
                  type="tel"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                  dir="ltr"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-stone-600 mb-2 block">العنوان</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
              <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
              معلومات العمل
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">العمل</label>
                <input
                  type="text"
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 mb-2 block">عنوان العمل</label>
                <input
                  type="text"
                  name="job_address"
                  value={formData.job_address}
                  onChange={handleChange}
                  className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-stone-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
              المستندات والصور
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ImageUploadBox 
                title="البطاقة الشخصية (وجه)" 
                preview={frontPreview} 
                onChange={handleFrontChange}
                onClear={() => { setFrontFile(null); setFrontPreview(null); setFormData(p => ({ ...p, id_card_front: '' })) }}
                icon={CreditCard}
                isLoading={isProcessingOCR}
              />
              <ImageUploadBox 
                title="البطاقة الشخصية (ظهر)" 
                preview={backPreview} 
                onChange={handleBackChange}
                onClear={() => { setBackFile(null); setBackPreview(null); setFormData(p => ({ ...p, id_card_back: '' })) }}
                icon={CreditCard}
              />
              <ImageUploadBox 
                title="الصورة الشخصية" 
                preview={personalPreview} 
                onChange={handlePersonalChange}
                onClear={() => { setPersonalFile(null); setPersonalPreview(null); setFormData(p => ({ ...p, id_card_image: '' })) }}
                icon={User}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2 border-b border-stone-100 pb-2">
              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
              ملاحظات إضافية
            </h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 bg-stone-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-stone-800"
              placeholder="أي ملاحظات أو معلومات إضافية..."
            />
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            <Button
              type="submit"
              disabled={saving || isProcessingOCR}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-bold shadow-lg transition-transform active:scale-95"
            >
              {saving ? 'جاري الحفظ...' : editAccount ? 'تحديث' : 'حفظ'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-8 py-6 rounded-2xl border-2 border-stone-200 hover:bg-stone-50"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FullAddAccountForm;
