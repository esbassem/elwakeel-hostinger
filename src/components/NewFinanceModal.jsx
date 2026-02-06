import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Loader2, ArrowLeft, ArrowRight, X, CreditCard,
  User, MapPin, Phone, Briefcase, 
  ShieldCheck, UserCheck, CheckCircle2
} from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';

import GuarantorForm from './GuarantorForm';
import AttachmentsTabContent from './AttachmentsTabContent';
import FinanceReviewSummary from './FinanceReviewSummary';
import SearchableAccountSelect from './SearchableAccountSelect';
import CompactImageUpload from './CompactImageUpload';

const NewFinanceModal = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 6;

  const [formData, setFormData] = useState({
    finance_amount: '',
    finance_name: '',
    finance_date: new Date().toISOString().split('T')[0],
    
    // Customer Data
    customer_type: 'registered',
    beneficiary_account_id: '',
    new_customer_name: '',
    new_customer_phone1: '',
    new_customer_phone2: '',
    new_customer_address: '',
    new_customer_job: '',
    new_customer_job_address: '',
    new_customer_id_front: '',
    new_customer_id_back: '',

    // Installments Config (Used for initial setup)
    installments_count: '',
    installment_amount: '',
    first_installment_date: ''
  });
  
  const [guarantors, setGuarantors] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [receiptsData, setReceiptsData] = useState({ count: 0, names: [], images: { receipts: '', front: '', back: '' } });
  const [agreements, setAgreements] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // UI States
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  const { fetchAccounts, addAccount } = useAccounts();
  const { createFinanceWithGuarantees } = useFinance();

  const loadData = async () => {
    const { data } = await fetchAccounts();
    if (data) setAccounts(data);
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      // Reset form
      setFormData(prev => ({
        ...prev, 
        finance_amount: '', 
        finance_name: '', 
        finance_date: new Date().toISOString().split('T')[0],
        new_customer_name: '', new_customer_phone1: '', new_customer_phone2: '',
        new_customer_address: '', new_customer_job: '', new_customer_job_address: '',
        new_customer_id_front: '', new_customer_id_back: '',
        beneficiary_account_id: '',
        installments_count: '',
        installment_amount: '',
        first_installment_date: ''
      }));
      setGuarantors([]);
      setInstallments([]);
      setReceiptsData({ count: 0, names: [], images: { receipts: '', front: '', back: '' } });
      setAgreements([]);
      setIsEditingCustomer(false);
      
      loadData();
    }
  }, [isOpen]);

  // Handle updates from GuarantorForm (including dialog updates)
  const handleGuarantorChange = (updatedGuarantor, index) => {
     const updated = [...guarantors];
     updated[index] = updatedGuarantor;
     setGuarantors(updated);
     
     // If the guarantor account was updated in the dialog, we might want to refresh the accounts list
     // to ensure other components see the latest data.
     // We can debounce this or just trigger it.
     if (updatedGuarantor.mode === 'existing') {
        loadData();
     }
  };

  // Auto-generate installments when inputs change
  useEffect(() => {
    if (step === 4) {
      const count = parseInt(formData.installments_count);
      const amount = parseFloat(formData.installment_amount);
      const startDate = formData.first_installment_date;

      if (count > 0 && amount > 0 && startDate) {
        const newInstallments = Array.from({ length: count }).map((_, index) => {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + index);
          return {
            installment_number: index + 1,
            installment_label: `القسط ${index + 1}`,
            installment_date: date.toISOString().split('T')[0],
            installment_amount: amount.toString()
          };
        });
        setInstallments(newInstallments);
      }
    }
  }, [formData.installments_count, formData.installment_amount, formData.first_installment_date, step]);

  const handleAccountSelect = (id) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setFormData(prev => ({
      ...prev,
      customer_type: 'registered',
      beneficiary_account_id: id,
      new_customer_name: acc.name || '',
      new_customer_phone1: acc.phone1 || '',
      new_customer_phone2: acc.phone2 || '',
      new_customer_address: acc.address || '',
      new_customer_job: acc.job || '',
      new_customer_job_address: acc.job_address || '',
      new_customer_id_front: acc.id_card_front || acc.id_card_image || '', 
      new_customer_id_back: acc.id_card_back || ''
    }));
    setIsEditingCustomer(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Handle Customer (New or Existing)
      let finalAccountId = formData.beneficiary_account_id;
      
      if (formData.customer_type === 'new') {
        const { data: newAccount } = await addAccount({
          name: formData.new_customer_name,
          phone1: formData.new_customer_phone1,
          phone2: formData.new_customer_phone2,
          address: formData.new_customer_address,
          job: formData.new_customer_job,
          job_address: formData.new_customer_job_address,
          id_card_front: formData.new_customer_id_front,
          id_card_back: formData.new_customer_id_back,
          account_type: 'customer',
          is_active: true
        });
        if (newAccount) finalAccountId = newAccount.id;
        else throw new Error("Failed to create customer account");
      }
      
      // 2. Handle Guarantors (New or Existing)
      const processedGuarantors = await Promise.all(guarantors.map(async (g) => {
        if (g.mode === 'new') {
          // Register new guarantor account
          const { data: newGuarantorAccount } = await addAccount({
             name: g.name,
             phone1: g.phone1,
             phone2: g.phone2,
             address: g.address,
             job: g.job,
             job_address: g.job_address,
             national_id: g.national_id,
             birth_date: g.birth_date,
             id_card_front: g.id_card_front,
             id_card_back: g.id_card_back,
             id_card_image: g.id_card_image, // personal photo
             account_type: 'customer', // Guarantors are also saved as accounts
             is_active: true,
             notes: `ضامن في تمويل ${formData.finance_name}`
          });
          
          if (newGuarantorAccount) {
            return {
              ...g,
              guarantor_account_id: newGuarantorAccount.id
            };
          } else {
             console.error("Failed to create guarantor account for", g.name);
             return null;
          }
        } else {
          // Existing guarantor - ensure we pass relationship and note
          // 'g' already contains relationship and note from the form state
          return g;
        }
      }));

      const validGuarantors = processedGuarantors.filter(g => g && g.guarantor_account_id);

      // 3. Create Finance
      const financePayload = {
        beneficiary_account_id: finalAccountId,
        finance_name: formData.finance_name,
        finance_amount: parseFloat(formData.finance_amount),
        finance_date: formData.finance_date,
        total_amount: installments.reduce((sum, i) => sum + parseFloat(i.installment_amount), 0)
      };
      
      const { error } = await createFinanceWithGuarantees(financePayload, installments, validGuarantors, receiptsData, agreements, currentUser);
      if (!error) {
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إنشاء التمويل: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-white p-0 border-none rounded-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden font-cairo" dir="rtl">
        
        {/* Header - Modern Gradient Blue-Purple */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 flex items-center justify-between shrink-0 shadow-lg relative z-20">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-md">
                 <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-white leading-none mb-1 tracking-tight">تمويل جديد</h2>
                 <p className="text-[10px] text-blue-100 font-medium opacity-90">إضافة عقد تمويل جديد</p>
              </div>
           </div>
           <button 
             onClick={onClose} 
             className="w-8 h-8 flex items-center justify-center text-blue-100 hover:text-white rounded-full hover:bg-white/10 transition-all"
           >
              <X className="w-4 h-4" />
           </button>
        </div>

        {/* Modern Progress Bar */}
        <div className="w-full bg-slate-100 h-1 relative overflow-hidden">
           <motion.div 
             className="bg-gradient-to-r from-blue-500 to-purple-500 h-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
             initial={{ width: 0 }}
             animate={{ width: `${(step/totalSteps)*100}%` }}
             transition={{ type: "spring", stiffness: 50 }}
           />
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar bg-slate-50/30">
           <AnimatePresence mode="wait">
              
              {/* Stage 1: Basic Info */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                    <div className="space-y-3 text-center">
                       <Label className="text-sm font-bold text-slate-600 block">قيمة التمويل المطلوبة</Label>
                       <div className="relative max-w-[240px] mx-auto group">
                          <input 
                            type="number" 
                            className="w-full h-16 px-4 text-center text-3xl font-black border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white transition-all placeholder:text-slate-200 text-slate-900 shadow-sm group-hover:border-blue-300" 
                            placeholder="0" 
                            value={formData.finance_amount} 
                            onChange={e => setFormData({ ...formData, finance_amount: e.target.value })} 
                            autoFocus 
                          />
                          <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ج.م</span>
                       </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="space-y-1.5">
                         <Label className="text-xs font-bold text-slate-700">اسم/وصف التمويل</Label>
                         <input type="text" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-slate-800" placeholder="مثال: تمويل أجهزة منزلية" value={formData.finance_name} onChange={e => setFormData({ ...formData, finance_name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-xs font-bold text-slate-700">تاريخ البدء</Label>
                         <input type="date" className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/10 bg-slate-50 focus:bg-white text-slate-800" value={formData.finance_date} onChange={e => setFormData({ ...formData, finance_date: e.target.value })} />
                      </div>
                    </div>
                 </motion.div>
              )}

              {/* Stage 2: Customer Data */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    
                    {/* Search Section */}
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-slate-700">تحديد العميل</Label>
                       <SearchableAccountSelect 
                          accounts={accounts} 
                          value={formData.customer_type === 'registered' ? formData.beneficiary_account_id : ''} 
                          onChange={handleAccountSelect}
                          onAddNew={() => {
                             setFormData(prev => ({ 
                               ...prev, 
                               customer_type: 'new', 
                               beneficiary_account_id: '',
                               new_customer_name: '', new_customer_phone1: '', new_customer_phone2: '',
                               new_customer_address: '', new_customer_job: '', new_customer_job_address: '',
                               new_customer_id_front: '', new_customer_id_back: ''
                             }));
                             setIsEditingCustomer(true);
                          }}
                          placeholder="بحث عن عميل مسجل..."
                       />
                    </div>

                    {/* Customer Form */}
                    {(formData.beneficiary_account_id || formData.customer_type === 'new') && (
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-blue-600" />
                                بيانات العميل
                            </h3>
                        </div>

                        <div className="p-4 space-y-3.5">
                           {/* Row 1: Name & Address */}
                           <div className="space-y-3">
                              <div className="space-y-1">
                                 <Label className="text-[10px] font-bold text-slate-500">الاسم الرباعي</Label>
                                 <div className="relative">
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                      className="w-full h-10 pr-9 pl-3 text-xs font-bold border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all bg-slate-50/50 focus:bg-white text-slate-800"
                                      value={formData.new_customer_name}
                                      onChange={e => setFormData({ ...formData, new_customer_name: e.target.value })}
                                      placeholder="اسم العميل"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[10px] font-bold text-slate-500">العنوان</Label>
                                 <div className="relative">
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                      className="w-full h-10 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-slate-50/50 focus:bg-white text-slate-800"
                                      value={formData.new_customer_address}
                                      onChange={e => setFormData({ ...formData, new_customer_address: e.target.value })}
                                      placeholder="العنوان السكني"
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* Row 2: Phones */}
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <Label className="text-[10px] font-bold text-slate-500">رقم الهاتف 1</Label>
                                 <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                      className="w-full h-10 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-mono bg-slate-50/50 focus:bg-white text-slate-800"
                                      value={formData.new_customer_phone1}
                                      onChange={e => setFormData({ ...formData, new_customer_phone1: e.target.value })}
                                      placeholder="01xxxxxxxxx"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[10px] font-bold text-slate-500">رقم الهاتف 2</Label>
                                 <div className="relative">
                                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                      className="w-full h-10 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all font-mono bg-slate-50/50 focus:bg-white text-slate-800"
                                      value={formData.new_customer_phone2}
                                      onChange={e => setFormData({ ...formData, new_customer_phone2: e.target.value })}
                                      placeholder="01xxxxxxxxx"
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* Row 3: Job Info */}
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <Label className="text-[10px] font-bold text-slate-500">الوظيفة</Label>
                                 <div className="relative">
                                    <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                      className="w-full h-10 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-slate-50/50 focus:bg-white text-slate-800"
                                      value={formData.new_customer_job}
                                      onChange={e => setFormData({ ...formData, new_customer_job: e.target.value })}
                                      placeholder="الوظيفة"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[10px] font-bold text-slate-500">عنوان العمل</Label>
                                 <div className="relative">
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input 
                                      className="w-full h-10 pr-9 pl-3 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all bg-slate-50/50 focus:bg-white text-slate-800"
                                      value={formData.new_customer_job_address}
                                      onChange={e => setFormData({ ...formData, new_customer_job_address: e.target.value })}
                                      placeholder="مقر العمل"
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* Row 4: ID Images */}
                           <div className="grid grid-cols-2 gap-3 pt-2">
                               <CompactImageUpload 
                                  label="صورة البطاقة (أمام)"
                                  value={formData.new_customer_id_front}
                                  onChange={url => setFormData({ ...formData, new_customer_id_front: url })}
                               />
                               <CompactImageUpload 
                                  label="صورة البطاقة (خلف)"
                                  value={formData.new_customer_id_back}
                                  onChange={url => setFormData({ ...formData, new_customer_id_back: url })}
                               />
                           </div>
                        </div>
                      </div>
                    )}
                 </motion.div>
              )}

              {/* Stage 3: Guarantors */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    
                    {/* Header Controls */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
                       <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          بيانات الضامنين
                       </h3>
                       <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                          {[0, 1, 2, 3].map(num => (
                             <button 
                               key={num} 
                               onClick={() => {
                                  const current = [...guarantors];
                                  if (num > current.length) {
                                     // Add new guarantor placeholder with 'existing' mode by default
                                     for(let i=current.length; i<num; i++) current.push({ 
                                       mode: 'existing', 
                                       guarantor_account_id: '', 
                                       relationship: '', 
                                       note: '',
                                       // New fields
                                       name: '', phone1: '', phone2: '', address: '', 
                                       job: '', job_address: '', national_id: '', birth_date: '',
                                       id_card_front: '', id_card_back: '', id_card_image: ''
                                     });
                                  } else {
                                     current.splice(num);
                                  }
                                  setGuarantors(current);
                               }} 
                               className={cn(
                                  "w-7 h-7 rounded-md text-[10px] font-bold transition-all flex items-center justify-center", 
                                  guarantors.length === num ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                               )}
                             >
                               {num === 0 ? 'لا يوجد' : num}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <AnimatePresence>
                         {guarantors.map((g, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-visible group hover:border-blue-200 transition-colors"
                            >
                               {/* Decorative Number */}
                               <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-bl-2xl -mr-6 -mt-6 flex items-end justify-start p-3 z-0">
                                  <span className="text-xl font-black text-blue-200 group-hover:text-blue-300 transition-colors">#{idx+1}</span>
                               </div>
                               
                               <div className="relative z-10">
                                  <GuarantorForm 
                                    data={g} 
                                    onChange={d => handleGuarantorChange(d, idx)}
                                    index={idx}
                                    accounts={accounts}
                                    isDraft={true}
                                  />
                               </div>
                            </motion.div>
                         ))}
                       </AnimatePresence>
                       
                       {guarantors.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
                             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                               <ShieldCheck className="w-6 h-6 text-slate-300" />
                             </div>
                             <p className="text-xs font-bold text-slate-500">لم يتم تحديد أي ضامنين</p>
                             <p className="text-[10px] text-slate-400 mt-1">يمكنك إتمام التمويل بدون ضامن إذا كانت الثقة متوفرة</p>
                          </div>
                       )}
                    </div>
                 </motion.div>
              )}

              {/* Stage 4: Installments */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                    
                    {/* Control Inputs */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                       <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          إعداد الأقساط
                       </h3>
                       
                       <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold text-slate-500">قيمة القسط</Label>
                             <input 
                               type="number" 
                               className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                               value={formData.installment_amount}
                               onChange={e => setFormData({...formData, installment_amount: e.target.value})}
                               placeholder="0.00"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold text-slate-500">عدد الأقساط</Label>
                             <input 
                               type="number" 
                               className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                               value={formData.installments_count}
                               onChange={e => setFormData({...formData, installments_count: e.target.value})}
                               placeholder="12"
                             />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold text-slate-500">تاريخ أول قسط</Label>
                             <input 
                               type="date" 
                               className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"
                               value={formData.first_installment_date}
                               onChange={e => setFormData({...formData, first_installment_date: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>

                    {/* Generated Table */}
                    {installments.length > 0 ? (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                         <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                           <table className="w-full text-center text-xs">
                             <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm text-slate-500 font-bold">
                               <tr>
                                 <th className="py-3 px-2">#</th>
                                 <th className="py-3 px-2">اسم القسط</th>
                                 <th className="py-3 px-2">التاريخ</th>
                                 <th className="py-3 px-2">القيمة</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                               {installments.map((inst, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                     <td className="py-2 px-2 font-mono text-slate-400">{idx + 1}</td>
                                     <td className="py-2 px-2">
                                        <input 
                                          value={inst.installment_label}
                                          onChange={e => {
                                             const newArr = [...installments];
                                             newArr[idx].installment_label = e.target.value;
                                             setInstallments(newArr);
                                          }}
                                          className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 outline-none text-center font-bold text-slate-700 py-1 transition-all"
                                        />
                                     </td>
                                     <td className="py-2 px-2">
                                        <input 
                                          type="date"
                                          value={inst.installment_date}
                                          onChange={e => {
                                             const newArr = [...installments];
                                             newArr[idx].installment_date = e.target.value;
                                             setInstallments(newArr);
                                          }}
                                          className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 outline-none text-center font-mono text-slate-600 py-1 transition-all"
                                        />
                                     </td>
                                     <td className="py-2 px-2">
                                        <input 
                                          type="number"
                                          value={inst.installment_amount}
                                          onChange={e => {
                                             const newArr = [...installments];
                                             newArr[idx].installment_amount = e.target.value;
                                             setInstallments(newArr);
                                          }}
                                          className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 outline-none text-center font-mono font-bold text-emerald-600 py-1 transition-all"
                                        />
                                     </td>
                                  </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                         <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                            <span className="text-[10px] text-slate-400">إجمالي الأقساط: <span className="font-mono font-bold text-slate-600">{installments.reduce((sum, i) => sum + Number(i.installment_amount || 0), 0).toLocaleString()}</span></span>
                         </div>
                      </div>
                    ) : (
                       <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs text-slate-400 font-bold">أدخل بيانات الأقساط أعلاه لتوليد الجدول</p>
                       </div>
                    )}
                 </motion.div>
              )}

              {/* Stage 5: Attachments */}
              {step === 5 && (
                 <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <AttachmentsTabContent 
                       receiptsData={receiptsData} setReceiptsData={setReceiptsData} 
                       agreements={agreements} setAgreements={setAgreements} 
                    />
                 </motion.div>
              )}

              {/* Stage 6: Summary */}
              {step === 6 && (
                 <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <FinanceReviewSummary 
                       formData={formData} guarantors={guarantors} 
                       installments={installments} receipts={receiptsData.names} agreements={agreements} 
                       accounts={accounts} // Pass accounts to look up names
                    />
                 </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shadow-[0_-5px_20px_-15px_rgba(0,0,0,0.05)] z-30">
           {step > 1 && (
              <Button onClick={() => setStep(s => s - 1)} variant="outline" className="h-10 w-14 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-600 shrink-0">
                 <ArrowRight className="w-5 h-5" />
              </Button>
           )}
           <Button 
              onClick={step === totalSteps ? handleSubmit : () => {
                 if(step === 1 && (!formData.finance_amount || !formData.finance_name)) return alert("أكمل البيانات الأساسية");
                 if(step === 2 && !formData.beneficiary_account_id && formData.customer_type === 'registered') return alert("يجب اختيار العميل");
                 setStep(s => s + 1);
              }} 
              disabled={loading} 
              className={cn(
                 "flex-1 h-10 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-0.5",
                 step === totalSteps ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-200" : "bg-slate-900 hover:bg-slate-800 shadow-slate-200"
              )}
           >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                 <>
                    {step === totalSteps ? "اعتماد وإنشاء التمويل" : "متابعة"}
                    {step !== totalSteps && <ArrowLeft className="w-4 h-4" />}
                 </>
              )}
           </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default NewFinanceModal;