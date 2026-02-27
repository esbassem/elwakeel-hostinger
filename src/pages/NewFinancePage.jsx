import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent 
} from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2,
  Check,
  UserPlus,
  ChevronRight,
  Search, 
  ArrowRight,
  Phone
} from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';

import FinanceReviewSummary from '@/components/FinanceReviewSummary';
import CompactImageUpload from '@/components/CompactImageUpload';

const BASE_STEPS = [
  { key: 'basics', title: 'الأساسيات', description: 'تحديد التمويل والعميل.' },
  { key: 'beneficiary_details', title: 'بيانات العميل', description: 'مراجعة وإكمال بيانات المستفيد.' },
  { key: 'guarantors_selection', title: 'الضامنون', description: 'تحديد الضامنين للتمويل.' },
  { key: 'installments', title: 'الأقساط', description: 'إنشاء جدول سداد الأقساط.' },
  { key: 'final_review', title: 'المراجعة النهائية', description: 'التأكد من صحة كافة البيانات.' },
];

const CustomInput = React.forwardRef(({ label, id, containerClassName, ...props }, ref) => (
    <div className={cn("flex items-center h-12 bg-white rounded-lg border border-slate-300 overflow-hidden", containerClassName)}>
      <label htmlFor={id} className="px-4 text-sm font-medium text-slate-600 bg-slate-50/80 h-full flex items-center border-l border-slate-200/90 whitespace-nowrap">{label}</label>
      <input id={id} {...props} ref={ref} className={cn("flex-grow bg-transparent h-full outline-none border-0 p-0 px-4 text-base text-slate-900 placeholder:text-slate-400", props.className)} />
    </div>
));

const AccountSearchPalette = ({ open, onOpenChange, accounts, onConfirmSelection, onAccountCreate, loading, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('search');
  const [stagedAccount, setStagedAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: '', nickname: '', phone1: '', phone2: '', address: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClick = async () => {
    const created = await onAccountCreate(newAccount);
    if (created) {
      setStagedAccount(created);
      setView('confirm');
    }
  };

  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return accounts;
    const lowercasedQuery = searchQuery.toLowerCase();
    return accounts.filter(account =>
      (account.name && account.name.toLowerCase().includes(lowercasedQuery)) ||
      (account.nickname && account.nickname.toLowerCase().includes(lowercasedQuery)) ||
      (account.phone1 && account.phone1.includes(searchQuery)) ||
      (account.national_id && account.national_id.includes(searchQuery))
    );
  }, [accounts, searchQuery]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSearchQuery('');
        setView('search');
        setNewAccount({ name: '', nickname: '', phone1: '', phone2: '', address: '' });
        setStagedAccount(null);
      }, 300);
    }
  }, [open]);

  const renderContent = () => {
    if (view === 'confirm' && stagedAccount) {
      return (
        <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-5">
          <h3 className="font-bold text-lg text-slate-800 text-center mb-2">تأكيد الاختيار</h3>
          <div className="bg-slate-50 rounded-lg p-4 my-4 border border-slate-200 text-center">
            <p className="font-bold text-slate-900 text-xl">{stagedAccount.nickname}{stagedAccount.name ? ` (${stagedAccount.name})` : ''}</p>
            <p className="text-slate-600 mt-1" dir="ltr">{stagedAccount.phone1}</p>
            {stagedAccount.address && <p className="text-sm text-slate-500 mt-1">{stagedAccount.address}</p>}
          </div>
          <div className="flex flex-col space-y-2">
            <Button onClick={() => onConfirmSelection(stagedAccount)} className="w-full h-11 bg-blue-600 hover:bg-blue-700">تأكيد واختيار هذا الحساب</Button>
            <Button onClick={() => setView('search')} variant="ghost" className="w-full">العودة للبحث</Button>
          </div>
        </motion.div>
      );
    }

    if (view === 'add') {
      return (
        <motion.div key="add" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-5">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-slate-800">تسجيل حساب جديد</h3>
                <Button variant="ghost" size="sm" onClick={() => setView('search')} className="flex items-center gap-2 text-slate-600"><ArrowRight size={16} /><span>رجوع للبحث</span></Button>
            </div>
            <div className="space-y-4">
              <CustomInput label="اللقب" id="nickname-add" name="nickname" value={newAccount.nickname} onChange={handleInputChange} autoFocus />
              <CustomInput label="الاسم" id="name-add" name="name" value={newAccount.name} onChange={handleInputChange} />
              <div className="grid grid-cols-2 gap-4">
                <CustomInput label={<div className="flex items-center gap-2"><Phone size={16} /><span className="font-bold">1</span></div>} id="phone1-add" name="phone1" type="tel" value={newAccount.phone1} onChange={handleInputChange} dir="ltr" style={{ textAlign: 'right' }}/>
                <CustomInput label={<div className="flex items-center gap-2"><Phone size={16} /><span className="font-bold">2</span></div>} id="phone2-add" name="phone2" type="tel" value={newAccount.phone2} onChange={handleInputChange} dir="ltr" style={{ textAlign: 'right' }}/>
              </div>
              <CustomInput label="العنوان" id="address-add" name="address" value={newAccount.address} onChange={handleInputChange} />
              <div className="pt-2"><Button onClick={handleCreateClick} disabled={loading} className="w-full h-11">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل ومتابعة"}</Button></div>
            </div>
        </motion.div>
      );
    }

    return (
      <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex items-center justify-between p-3 border-b border-slate-200/80">
            <h3 className="font-bold text-base text-slate-800 pl-2">{title}</h3>
            <Button variant="ghost" size="sm" onClick={() => setView('add')} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"><UserPlus size={16} /><span>حساب جديد</span></Button>
        </div>
        <div className="p-3">
            <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث باللقب، الاسم، رقم الهاتف..." className="h-12 px-4 w-full bg-white text-slate-900 text-base rounded-lg border border-slate-300 placeholder:text-slate-400 outline-none pr-11"/>
            </div>
        </div>
        <div className="max-h-[40vh] min-h-[10vh] overflow-y-auto p-2">
          {loading && accounts.length === 0 ? <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400"/></div> : null}
          {!loading && filteredAccounts.length === 0 ? (
            <div className="text-center p-6"><p className="font-semibold text-slate-800">لا توجد نتائج</p><p className="text-sm text-slate-600">لم يتم العثور على حساب يطابق بحثك.</p></div>
          ) : (
            <ul className="space-y-1">
              {filteredAccounts.map(account => (
                <li key={account.id}>
                  <button onClick={() => { setStagedAccount(account); setView('confirm'); }} className="w-full flex justify-between items-center text-right p-3 rounded-lg hover:bg-slate-100 transition-colors">
                    <div><p className="font-bold text-slate-900">{account.nickname}{account.name ? ` (${account.name})` : ''}</p><p className="text-sm text-slate-600" dir="ltr">{account.phone1}</p></div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-lg" hideCloseButton>
        <div className="relative bg-white rounded-xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 min-h-[200px] overflow-hidden">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NewFinancePage = ({ isSheet = false, currentUser }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [dynamicSteps, setDynamicSteps] = useState(BASE_STEPS.map((s, i) => ({ ...s, id: i + 1 })));
  const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isGuarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [editingGuarantorIndex, setEditingGuarantorIndex] = useState(null);
  const [formData, setFormData] = useState({ finance_amount: '', finance_name: '', finance_date: new Date().toISOString().split('T')[0], beneficiary_account_id: '', new_customer_name: '', new_customer_nickname: '', new_customer_phone1: '', new_customer_phone2: '', new_customer_address: '', new_customer_job: '', new_customer_job_address: '', new_customer_id_front: '', new_customer_id_back: '', installments_count: '', installment_amount: '', first_installment_date: '' });
  const [guarantors, setGuarantors] = useState([]);
  const [numberOfGuarantors, setNumberOfGuarantors] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const { toast } = useToast();
  const { loading: accountsLoading, fetchAccounts, addAccount, updateAccount } = useAccounts();
  const { loading: financeLoading, createFinanceWithGuarantees } = useFinance();

  useEffect(() => { if (!isSheet) window.scrollTo(0, 0); }, [step, isSheet]);
  useEffect(() => { fetchAccounts().then(({ data }) => data && setAccounts(data)); }, [fetchAccounts]);

  useEffect(() => {
    const base = BASE_STEPS;
    const guarantorSteps = guarantors.map((g, index) => ({
        key: `guarantor_details_${index}`,
        title: `بيانات الضامن #${index + 1}`,
        description: `مراجعة بيانات الضامن ${g.nickname || ''}`,
    }));

    const newSteps = [
        ...base.slice(0, 3),
        ...guarantorSteps,
        ...base.slice(3)
    ].map((s, i) => ({ ...s, id: i + 1 }));
    
    setDynamicSteps(newSteps);
  }, [guarantors]);

  const isStepValid = useMemo(() => {
    const currentStepInfo = dynamicSteps.find(s => s.id === step);
    if (!currentStepInfo) return true;
    const { key } = currentStepInfo;
    switch (key) {
      case 'basics': return formData.finance_amount && parseFloat(formData.finance_amount) > 0 && formData.finance_name.trim() !== '' && formData.finance_date.trim() !== '' && !!formData.beneficiary_account_id;
      case 'guarantors_selection': return numberOfGuarantors !== null && guarantors.every(g => !!g.id);
      case 'beneficiary_details': return true;
      default:
          const isGuarantorStep = key.startsWith('guarantor_details_');
          if (isGuarantorStep) return true;
          return true;
    }
  }, [step, dynamicSteps, formData, guarantors, numberOfGuarantors]);

  useEffect(() => {
    const count = parseInt(formData.installments_count);
    const amount = parseFloat(formData.installment_amount);
    const startDate = formData.first_installment_date;
    if (count > 0 && amount > 0 && startDate) {
        setInstallments(Array.from({ length: count }).map((_, index) => {
            const date = new Date(startDate);
            date.setMonth(date.getMonth() + index);
            return { installment_number: index + 1, installment_label: `القسط ${index + 1}`, installment_date: date.toISOString().split('T')[0], installment_amount: amount.toString() };
        }));
    } else {
        setInstallments([]);
    }
  }, [formData.installments_count, formData.installment_amount, formData.first_installment_date]);

  const handleConfirmCustomerSelection = useCallback((acc) => {
    if (acc) setFormData(prev => ({ ...prev, beneficiary_account_id: acc.id, new_customer_name: acc.name || '', new_customer_nickname: acc.nickname || '', new_customer_phone1: acc.phone1 || '', new_customer_phone2: acc.phone2 || '', new_customer_address: acc.address || '', new_customer_job: acc.job || '', new_customer_job_address: acc.job_address || '', new_customer_id_front: acc.id_card_front || '', new_customer_id_back: acc.id_card_back || '' }));
    setCustomerDialogOpen(false);
  }, [setFormData, setCustomerDialogOpen]);
  
  const handleCreateBeneficiaryAccount = useCallback(async (newAccountData) => {
    if (!newAccountData.nickname || !newAccountData.phone1) { toast({ title: "بيانات ناقصة", description: "الرجاء إدخال اللقب ورقم الهاتف 1 على الأقل.", variant: "destructive" }); return null; }
    const { data: createdAccount, error } = await addAccount({ ...newAccountData, account_type: 'beneficiary', is_active: true });
    if (!error && createdAccount) { setAccounts(prev => [createdAccount, ...prev]); return createdAccount; }
    return null;
  }, [addAccount, toast, setAccounts]);

  const handleConfirmGuarantorSelection = useCallback((acc) => {
    if (acc && editingGuarantorIndex !== null) {
        const newGuarantors = [...guarantors];
        newGuarantors[editingGuarantorIndex] = { ...newGuarantors[editingGuarantorIndex], id: acc.id, name: acc.name || '', nickname: acc.nickname || '', phone1: acc.phone1 || '', phone2: acc.phone2 || '', address: acc.address || '', job: acc.job || '', job_address: acc.job_address || '', id_card_front: acc.id_card_front || '', id_card_back: acc.id_card_back || '' };
        setGuarantors(newGuarantors);
    }
    setGuarantorDialogOpen(false);
    setEditingGuarantorIndex(null);
  }, [guarantors, editingGuarantorIndex]);

  const handleGuarantorUpdate = (index, updatedData) => {
      const newGuarantors = [...guarantors];
      newGuarantors[index] = { ...newGuarantors[index], ...updatedData };
      setGuarantors(newGuarantors);
  };

  const handleCreateGuarantorAccount = useCallback(async (newAccountData) => {
    if (!newAccountData.nickname || !newAccountData.phone1) { toast({ title: "بيانات ناقصة", description: "الرجاء إدخال اللقب ورقم الهاتف 1 على الأقل.", variant: "destructive" }); return null; }
    const { data: createdAccount, error } = await addAccount({ ...newAccountData, account_type: 'guarantor', is_active: true });
    if (!error && createdAccount) { toast({ title: "تم", description: "تم تسجيل الضامن بنجاح."}); setAccounts(prev => [createdAccount, ...prev]); return createdAccount; }
    return null;
  }, [addAccount, toast, setAccounts]);

  const handleSubmit = async () => {
    if (!currentUser) {
      toast({ title: "خطأ", description: "لا يمكن تحديد المستخدم الحالي، الرجاء إعادة تحميل الصفحة.", variant: "destructive" });
      return;
    }
    toast({ title: "جاري التنفيذ...", description: "يتم الآن تحديث بيانات الحسابات وحفظ التمويل." });

    // 1. Update beneficiary account
    const beneficiaryUpdateData = {
      name: formData.new_customer_name,
      nickname: formData.new_customer_nickname,
      phone1: formData.new_customer_phone1,
      phone2: formData.new_customer_phone2,
      address: formData.new_customer_address,
      job: formData.new_customer_job,
      job_address: formData.new_customer_job_address,
      id_card_front: formData.new_customer_id_front,
      id_card_back: formData.new_customer_id_back,
    };
    await updateAccount(formData.beneficiary_account_id, beneficiaryUpdateData);

    // 2. Update guarantor accounts
    for (const guarantor of guarantors) {
      const guarantorUpdateData = {
        name: guarantor.name,
        nickname: guarantor.nickname,
        phone1: guarantor.phone1,
        phone2: guarantor.phone2,
        address: guarantor.address,
        job: guarantor.job,
        job_address: guarantor.job_address,
        id_card_front: guarantor.id_card_front,
        id_card_back: guarantor.id_card_back,
      };
      await updateAccount(guarantor.id, guarantorUpdateData);
    }

    // 3. Prepare data for finance creation
    const financeData = {
      finance_amount: parseFloat(formData.finance_amount),
      finance_name: formData.finance_name,
      finance_date: formData.finance_date,
      beneficiary_account_id: formData.beneficiary_account_id,
    };

    const guarantorsDataForCreation = guarantors.map(g => ({ 
      guarantor_account_id: g.id, 
      relationship: 'ضامن شخصي', // Default value 
      note: '' // Default value
    }));

    // 4. Create finance with all related data
    const { data: newFinance, error } = await createFinanceWithGuarantees(
      financeData,
      installments,
      guarantorsDataForCreation,
      [], // receipts data
      [], // agreements data
      currentUser
    );

    if (error) {
      // Error toast is already handled in the hook
      return;
    }

    // Success, maybe close the sheet or redirect
    // For now, just show a success message.
  };
  
  const handleNext = () => {
    if (isStepValid) {
      setDirection(1);
      setStep(s => (s < dynamicSteps.length ? s + 1 : s));
    } else {
      toast({
        title: "بيانات غير مكتملة",
        description: "الرجاء التأكد من تعبئة جميع الحقول الإجبارية في هذه المرحلة للمتابعة.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const loading = accountsLoading || financeLoading;

  const CurrentForm = useMemo(() => {
    const currentStepInfo = dynamicSteps.find(s => s.id === step);
    if (!currentStepInfo) return null;
    const props = { formData, setFormData, accounts, guarantors, setGuarantors, installments, setInstallments, isCustomerDialogOpen, setCustomerDialogOpen, handleConfirmCustomerSelection, loading, setEditingGuarantorIndex, setGuarantorDialogOpen, handleGuarantorUpdate, numberOfGuarantors, setNumberOfGuarantors };
    const guarantorStepIndex = currentStepInfo.key.startsWith('guarantor_details_') ? parseInt(currentStepInfo.key.split('_')[2]) : -1;
    if (guarantorStepIndex !== -1) return <GuarantorDataForm {...props} guarantorIndex={guarantorStepIndex} guarantor={guarantors[guarantorStepIndex]} />;
    switch (currentStepInfo.key) {
      case 'basics': return <Step1Form {...props} />;
      case 'beneficiary_details': return <Step2Form {...props} />;
      case 'guarantors_selection': return <Step3Form {...props} />;
      case 'installments': return <Step4Form {...props} />;
      case 'final_review': return <FinalReviewForm {...props} />;
      default: return null;
    }
  }, [step, dynamicSteps, formData, accounts, guarantors, installments, setInstallments, isCustomerDialogOpen, loading, numberOfGuarantors]);

  const footer = (
    <div className="flex items-center justify-end gap-2">
      {step > 1 && <Button onClick={handleBack} variant="ghost" className="text-slate-700 hover:bg-slate-100">رجوع للمراجعة</Button>}
      <Button 
        onClick={step === dynamicSteps.length ? handleSubmit : handleNext} 
        disabled={loading || !isStepValid} 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-7 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {loading 
          ? <Loader2 className="w-5 h-5 animate-spin" /> 
          : (step === dynamicSteps.length ? "إنشاء التمويل" : "متابعة")}
      </Button>
    </div>
  );

  const mainContent = (
    <div className={cn("pt-8 pb-24 md:pt-12 md:pb-12", isSheet && "p-6")}>
      <div className={cn("max-w-2xl px-4 md:px-8 lg:pr-12 lg:pl-8", isSheet && "max-w-full p-0")}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 15 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {CurrentForm}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  if (isSheet) {
    return (
      <div className="h-full flex flex-col bg-white font-cairo" dir="rtl">
        <div className="flex-grow overflow-y-auto">{mainContent}</div>
        <div className="shrink-0 border-t border-slate-200 p-4">{footer}</div>
        <AccountSearchPalette open={isCustomerDialogOpen} onOpenChange={setCustomerDialogOpen} accounts={accounts} onConfirmSelection={handleConfirmCustomerSelection} onAccountCreate={handleCreateBeneficiaryAccount} loading={loading} title="اختر العميل المستفيد" />
        <AccountSearchPalette open={isGuarantorDialogOpen} onOpenChange={setGuarantorDialogOpen} accounts={accounts.filter(a => a.id !== formData.beneficiary_account_id)} onConfirmSelection={handleConfirmGuarantorSelection} onAccountCreate={handleCreateGuarantorAccount} loading={loading} title="اختر الضامن" />
      </div>
    )
  }

  return (
    <div className="min-h-screen font-cairo bg-white" dir="rtl">
      <div className="md:grid md:grid-cols-12">
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-0 h-screen py-12 bg-slate-50 border-l border-slate-200/80">
           <div className="flex flex-col h-full max-w-sm mx-auto px-6">
              <div>
                 <h2 className="font-bold text-xl text-slate-800">إنشاء تمويل جديد</h2>
                 <p className="text-sm text-slate-500 mt-1">اتبع الخطوات التالية لإكمال العملية.</p>
              </div>
              <ul className="space-y-6 mt-12 flex-grow">
                {dynamicSteps.map(s => { const isCompleted = step > s.id; const isActive = step === s.id; return (<li key={s.id} className="flex items-center gap-4"><div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all", isCompleted ? "bg-blue-600 text-white" : isActive ? "bg-blue-100 text-blue-700 font-bold ring-2 ring-blue-300" : "bg-slate-200 text-slate-500")} >{isCompleted ? <Check size={18}/> : s.id}</div><div><p className={cn("font-bold text-sm transition-colors", isActive ? 'text-slate-800' : 'text-slate-500')}>{s.title}</p><p className={cn("text-xs", isActive? 'text-slate-500' : 'text-slate-400')}>{s.description}</p></div></li>);})}
              </ul>
               <div className="text-xs text-slate-400 shrink-0">نظام الإدارة المبسط™</div>
           </div>
        </aside>

        <main className="md:col-span-8 lg:col-span-9 md:h-screen md:flex md:flex-col">
          <div className="md:flex-grow md:overflow-y-auto">
            {mainContent}
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-t border-slate-200 md:relative md:z-auto md:border-t-0 md:bg-transparent md:backdrop-blur-none md:flex-shrink-0">
            <div className="max-w-2xl px-4 md:px-8 lg:pr-12 lg:pl-8 py-3 md:border-t md:border-slate-100">
                {footer}
            </div>
          </div>
        </main>
      </div>

      <AccountSearchPalette open={isCustomerDialogOpen} onOpenChange={setCustomerDialogOpen} accounts={accounts} onConfirmSelection={handleConfirmCustomerSelection} onAccountCreate={handleCreateBeneficiaryAccount} loading={loading} title="اختر العميل المستفيد" />
      <AccountSearchPalette open={isGuarantorDialogOpen} onOpenChange={setGuarantorDialogOpen} accounts={accounts.filter(a => a.id !== formData.beneficiary_account_id)} onConfirmSelection={handleConfirmGuarantorSelection} onAccountCreate={handleCreateGuarantorAccount} loading={loading} title="اختر الضامن" />
    </div>
  );
};


const StepSection = ({ title, subtitleAction, children }) => (
    <div className="py-8 border-b border-slate-200/80 last:pb-0 last:border-b-0 first:pt-0">
        <div className="mb-5">
            {title && <h3 className="font-bold text-xl text-slate-800">{title}</h3>}
            {subtitleAction}
        </div>
        <div className="space-y-5">
            {children}
        </div>
    </div>
);


// Step 1: Basic Finance Information
const Step1Form = ({ formData, setFormData, accounts, setCustomerDialogOpen }) => (
    <div className="divide-y divide-slate-200/80">
        <StepSection title="معلومات التمويل الأساسية">
            <div className="flex justify-start">
                <div className="relative w-[200px]">
                    <input id="finance_amount" type="number" placeholder="0" value={formData.finance_amount} onChange={e => setFormData({ ...formData, finance_amount: e.target.value })} className="w-full h-20 bg-white rounded-2xl border-2 border-slate-300 outline-none p-4 pr-6 text-right text-4xl font-bold text-slate-800 tracking-tight" />
                    <label htmlFor="finance_amount" className="absolute bottom-2 left-4 text-xs font-semibold text-slate-500 pointer-events-none">قيمة التمويل</label>
                </div>
            </div>
            <div className="flex gap-4">
                 <div className="w-[250px]">
                     <Label htmlFor="finance_name" className="mb-1.5 block text-right font-semibold text-slate-700">اسم التمويل</Label>
                     <Input id="finance_name" value={formData.finance_name} onChange={e => setFormData({ ...formData, finance_name: e.target.value })} />
                 </div>
                 <div className="w-[250px]">
                    <Label htmlFor="finance_date" className="mb-1.5 block text-right font-semibold text-slate-700">التاريخ</Label>
                    <Input id="finance_date" type="date" value={formData.finance_date} onChange={e => setFormData({ ...formData, finance_date: e.target.value })} />
                 </div>
            </div>
        </StepSection>
        <StepSection title="العميل المستفيد">
            <button type="button" onClick={() => setCustomerDialogOpen(true)} className="w-full text-right h-12 px-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{formData.beneficiary_account_id ? (accounts.find(a => a.id === formData.beneficiary_account_id)?.nickname + (accounts.find(a => a.id === formData.beneficiary_account_id)?.name ? ` (${accounts.find(a => a.id === formData.beneficiary_account_id)?.name})` : '')) : <span className="text-slate-500 font-normal">اختر العميل...</span>}</span>
                <Search className="h-5 w-5 text-slate-400" />
            </button>
        </StepSection>
    </div>
);

// Step 2: Beneficiary Details
const Step2Form = ({ formData, setFormData }) => {
    const selectedAccount = formData.beneficiary_account_id ? formData : null;
    return (
        <div>
            {!selectedAccount ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-lg"><p className="font-bold text-slate-700">لم يتم تحديد عميل بعد</p><p className="text-sm text-slate-500 mt-2">الرجاء الرجوع للخطوة السابقة واختيار العميل أولاً للمتابعة.</p></div>
            ) : (
                <div className="divide-y divide-slate-200/80">
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6"><p className="font-bold text-blue-800">{`مراجعة بيانات العميل: ${selectedAccount.new_customer_nickname || ''}`}</p><p className="text-sm text-blue-600">تأكد من صحة كافة البيانات، أو قم بتحديثها عند اللزوم.</p></div>
                    <StepSection title="المعلومات الشخصية والاتصال">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomInput label="اللقب" id="new_customer_nickname" value={selectedAccount.new_customer_nickname} onChange={e => setFormData({ ...formData, new_customer_nickname: e.target.value })} />
                            <CustomInput label="الاسم" id="new_customer_name" value={selectedAccount.new_customer_name} onChange={e => setFormData({ ...formData, new_customer_name: e.target.value })} />
                            <CustomInput label="العنوان الكامل" id="new_customer_address" value={selectedAccount.new_customer_address} onChange={e => setFormData({ ...formData, new_customer_address: e.target.value })} />
                            <CustomInput label={<div className="flex items-center gap-2"><Phone size={16} /><span className="font-bold">1</span></div>} id="new_customer_phone1" type="tel" dir="ltr" style={{ textAlign: 'right' }} value={selectedAccount.new_customer_phone1} onChange={e => setFormData({ ...formData, new_customer_phone1: e.target.value })} />
                            <CustomInput label={<div className="flex items-center gap-2"><Phone size={16} /><span className="font-bold">2</span></div>} id="new_customer_phone2" type="tel" dir="ltr" style={{ textAlign: 'right' }} value={selectedAccount.new_customer_phone2} onChange={e => setFormData({ ...formData, new_customer_phone2: e.target.value })} />
                        </div>
                    </StepSection>
                     <StepSection title="معلومات العمل والوثائق">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomInput label="الوظيفة" id="new_customer_job" value={selectedAccount.new_customer_job} onChange={e => setFormData({ ...formData, new_customer_job: e.target.value })} />
                            <CustomInput label="عنوان العمل" id="new_customer_job_address" value={selectedAccount.new_customer_job_address} onChange={e => setFormData({ ...formData, new_customer_job_address: e.target.value })} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 mt-5 border-t border-slate-200">
                            <CompactImageUpload label="صورة وجه البطاقة" value={selectedAccount.new_customer_id_front} onChange={url => setFormData({ ...formData, new_customer_id_front: url })} />
                            <CompactImageUpload label="صورة ظهر البطاقة" value={selectedAccount.new_customer_id_back} onChange={url => setFormData({ ...formData, new_customer_id_back: url })} />
                        </div>
                    </StepSection>
                </div>
            )}
        </div>
    );
};

const Step3Form = ({ guarantors, setGuarantors, setEditingGuarantorIndex, setGuarantorDialogOpen, numberOfGuarantors, setNumberOfGuarantors }) => (
    <div className="divide-y divide-slate-200/80">
        <StepSection title="الضامنون" subtitleAction={
            <div className="flex items-center gap-1.5 mt-2">{[0, 1, 2, 3, 4].map(num => (<button key={num} onClick={() => { setNumberOfGuarantors(num); setGuarantors(current => num > current.length ? [...current, ...Array(num - current.length).fill({})] : current.slice(0, num)); }} className={cn("w-8 h-8 rounded-md text-xs font-semibold transition-all flex items-center justify-center border", numberOfGuarantors === num ? "bg-slate-200 text-slate-700 border-slate-300" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100")} >{num}</button>))
            }
            </div>}>
            {guarantors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {guarantors.map((guarantor, idx) => (
                        <div key={idx}>
                            <Label className="font-medium text-sm text-slate-700 mb-1.5 block">{`الضامن #${idx + 1}`}</Label>
                            <button type="button" onClick={() => { setEditingGuarantorIndex(idx); setGuarantorDialogOpen(true); }} className="w-full text-right h-12 px-4 bg-white rounded-lg border border-slate-300 flex items-center justify-between">
                                <span className="font-semibold text-slate-800">{guarantor.id ? (guarantor.nickname + (guarantor.name ? ` (${guarantor.name})` : '')) : <span className="text-slate-500 font-normal">اختر الضامن...</span>}</span>
                                <Search className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </StepSection>
    </div>
);

const GuarantorDataForm = ({ guarantor, guarantorIndex, handleGuarantorUpdate }) => {
    const onUpdate = (field, value) => handleGuarantorUpdate(guarantorIndex, { [field]: value });
    return (
        <div>
            {!guarantor ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-lg"><p className="font-bold text-slate-700">لم يتم تحديد ضامن بعد</p><p className="text-sm text-slate-500 mt-2">الرجاء الرجوع للخطوة السابقة واختيار الضامن أولاً للمتابعة.</p></div>
            ) : (
                <div className="divide-y divide-slate-200/80">
                     <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6"><p className="font-bold text-blue-800">{`مراجعة بيانات الضامن: ${guarantor.nickname || ''}`}</p><p className="text-sm text-blue-600">تأكد من صحة كافة البيانات، أو قم بتحديثها عند اللزوم.</p></div>
                    <StepSection title="المعلومات الشخصية والاتصال">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomInput label="اللقب" id={`guarantor_nickname_${guarantorIndex}`} value={guarantor.nickname || ''} onChange={e => onUpdate('nickname', e.target.value)} />
                            <CustomInput label="الاسم" id={`guarantor_name_${guarantorIndex}`} value={guarantor.name || ''} onChange={e => onUpdate('name', e.target.value)} />
                            <CustomInput label="العنوان الكامل" id={`guarantor_address_${guarantorIndex}`} value={guarantor.address || ''} onChange={e => onUpdate('address', e.target.value)} />
                            <CustomInput label={<div className="flex items-center gap-2"><Phone size={16} /><span className="font-bold">1</span></div>} id={`guarantor_phone1_${guarantorIndex}`} type="tel" dir="ltr" style={{ textAlign: 'right' }} value={guarantor.phone1 || ''} onChange={e => onUpdate('phone1', e.target.value)} />
                            <CustomInput label={<div className="flex items-center gap-2"><Phone size={16} /><span className="font-bold">2</span></div>} id={`guarantor_phone2_${guarantorIndex}`} type="tel" dir="ltr" style={{ textAlign: 'right' }} value={guarantor.phone2 || ''} onChange={e => onUpdate('phone2', e.target.value)} />
                        </div>
                    </StepSection>
                     <StepSection title="معلومات العمل والوثائق">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CustomInput label="الوظيفة" id={`guarantor_job_${guarantorIndex}`} value={guarantor.job || ''} onChange={e => onUpdate('job', e.target.value)} />
                            <CustomInput label="عنوان العمل" id={`guarantor_job_address_${guarantorIndex}`} value={guarantor.job_address || ''} onChange={e => onUpdate('job_address', e.target.value)} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 mt-5 border-t border-slate-200">
                            <CompactImageUpload label="صورة وجه البطاقة" value={guarantor.id_card_front} onChange={url => onUpdate('id_card_front', url)} />
                            <CompactImageUpload label="صورة ظهر البطاقة" value={guarantor.id_card_back} onChange={url => onUpdate('id_card_back', url)} />
                        </div>
                    </StepSection>
                </div>
            )}
        </div>
    );
};

const Step4Form = ({ formData, setFormData, installments, setInstallments }) => {
    const handleInstallmentChange = (index, field, value) => {
        const newInstallments = [...installments];
        if (newInstallments[index]) {
            newInstallments[index] = { ...newInstallments[index], [field]: value };
            setInstallments(newInstallments);
        }
    };
    return (
        <div className="divide-y divide-slate-300">
            <StepSection title="إعدادات الأقساط">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="installment_amount" className="text-xs text-slate-500 font-medium mb-1.5 block">مبلغ القسط</Label>
                        <Input id="installment_amount" type="number" placeholder="0.00" value={formData.installment_amount} onChange={e => setFormData({...formData, installment_amount: e.target.value})} />
                    </div>
                    <div>
                        <Label htmlFor="installments_count" className="text-xs text-slate-500 font-medium mb-1.5 block">عدد الأقساط</Label>
                        <Input id="installments_count" type="number" placeholder="12" value={formData.installments_count} onChange={e => setFormData({...formData, installments_count: e.target.value})} />
                    </div>
                    <div>
                        <Label htmlFor="first_installment_date" className="text-xs text-slate-500 font-medium mb-1.5 block">تاريخ أول قسط</Label>
                        <Input id="first_installment_date" type="date" value={formData.first_installment_date} onChange={e => setFormData({...formData, first_installment_date: e.target.value})} />
                    </div>
                </div>
            </StepSection>
            {installments.length > 0 && (
                <div className="pt-8 space-y-2">
                    {installments.map((inst, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-x-2">
                            <div className="col-span-5"><Input type="text" value={inst.installment_label} onChange={(e) => handleInstallmentChange(idx, 'installment_label', e.target.value)} /></div>
                             <div className="col-span-4"><Input type="date" value={inst.installment_date} onChange={(e) => handleInstallmentChange(idx, 'installment_date', e.target.value)} /></div>
                            <div className="col-span-3"><Input type="number" value={inst.installment_amount} onChange={(e) => handleInstallmentChange(idx, 'installment_amount', e.target.value)} /></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FinalReviewForm = ({ formData, guarantors, installments, accounts }) => (<div className="py-8"><FinanceReviewSummary formData={formData} guarantors={guarantors} installments={installments} receipts={[]} agreements={[]} accounts={accounts} isPage /></div>);

export default NewFinancePage;
