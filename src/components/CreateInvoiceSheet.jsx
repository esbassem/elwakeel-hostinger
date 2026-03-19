import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountMoves } from '@/hooks/useAccountMoves';
import { User, Search, UserPlus, Loader2, X, Phone, Camera, CheckCircle2, Tractor, ArrowRight, Wallet, CreditCard, Printer, Edit, FileText, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';
import PartnerFormSheet from './partners/PartnerFormSheet';

const SimpleInput = ({ label, name, className = '', ...props }) => (
    <div className="space-y-1.5">
        <Label htmlFor={name} className="font-semibold px-1 text-slate-800">{label}</Label>
        <Input
            id={name}
            name={name}
            {...props}
            className={cn("h-12 bg-slate-100 border-slate-200 shadow-sm text-base", className)}
        />
    </div>
);

const SimpleSelect = ({ label, name, value, onChange, children, className }) => (
    <div className="space-y-1.5 w-full">
        <Label htmlFor={name} className="font-semibold px-1 text-slate-800">{label}</Label>
        <div className="relative">
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={cn(
                    "appearance-none w-full h-14 rounded-md border border-slate-200 bg-slate-50 px-3 pr-8 text-base ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m6 9 6 6 6-6"/></svg>
            </div>
        </div>
    </div>
);

const InfoDisplayField = ({ label, value, isMono }) => (
    <div className="space-y-1.5">
        <Label className="font-semibold px-1 text-slate-800">{label}</Label>
        <div className="flex items-center h-12 bg-slate-100 border-slate-200 shadow-sm rounded-md px-3">
            <p className={cn("text-base text-slate-800", isMono && "font-mono")}>
                {value || <span className="text-slate-400">--</span>}
            </p>
        </div>
    </div>
);

const ImageDisplayField = ({ label, imageUrl }) => (
    <div className="space-y-1.5">
        <Label className="font-semibold px-1 text-slate-800">{label}</Label>
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block group">
            <div className="h-32 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group-hover:border-blue-500 transition-colors relative">
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={label} className="max-w-full max-h-full object-contain rounded-md p-1" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                           <ExternalLink className="w-8 h-8 text-white" />
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-400">
                        <Camera className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-xs font-semibold">لا توجد صورة</p>
                    </div>
                )}
            </div>
        </a>
    </div>
);

const CustomerSelectionSheet = ({ isOpen, onClose, onCustomerConfirmed, onAddNew, onEdit, newlyAddedCustomerId, onClearHighlight }) => {
  const { fetchAccounts } = useAccounts();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const openDetailsFor = useCallback((customer) => {
      setSelectedCustomer(customer);
      setView('details');
  }, []);

  const loadAccounts = useCallback(async () => {
      setIsLoading(true);
      try {
          const { data } = await fetchAccounts({ account_type: 'customer' });
          if (data) {
              const sortedData = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              setAccounts(sortedData);
              if (newlyAddedCustomerId) {
                  const newCustomer = sortedData.find(c => c.id === newlyAddedCustomerId);
                  if (newCustomer) {
                      openDetailsFor(newCustomer);
                      setTimeout(onClearHighlight, 2500);
                  }
              }
          }
      } finally {
          setIsLoading(false);
      }
  }, [fetchAccounts, newlyAddedCustomerId, onClearHighlight, openDetailsFor]);

  useEffect(() => {
    let timer;
    if (isOpen) {
        timer = setTimeout(loadAccounts, 150);
    } else {
        timer = setTimeout(() => {
            setSearch('');
            setView('list');
            setSelectedCustomer(null);
            setAccounts([]);
        }, 300);
    }
    return () => clearTimeout(timer);
  }, [isOpen, loadAccounts]);

  const handleConfirm = () => {
      onCustomerConfirmed(selectedCustomer);
  }

  const handleEditClick = () => {
    onEdit(selectedCustomer);
  }

  const filteredAccounts = accounts.filter(acc =>
      acc.name?.toLowerCase().includes(search.toLowerCase()) ||
      (acc.nickname && acc.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (acc.phone1 && acc.phone1.includes(search))
  );

  return (
    <AnimatePresence>{isOpen && (<>
          <motion.div key="customer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[55]" />
          <motion.div key="customer-sheet" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }} className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white z-[60] flex flex-col rounded-t-2xl border-t overflow-hidden" dir="rtl">
               <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between gap-3 h-16">
                  {view === 'details' && selectedCustomer ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" onClick={() => setView('list')}>رجوع للقائمة</Button>
                          <Button variant="outline" size="icon" onClick={handleEditClick}><Edit className="h-4 w-4"/></Button>
                        </div>
                         <h3 className="text-lg font-bold text-center flex-grow">
                            بيانات العميل
                         </h3>
                         <Button
                            onClick={handleConfirm}
                            className="w-28 font-bold"
                         >
                            تأكيد
                         </Button>
                      </>
                  ) : (
                      <>
                          <div className="relative flex-grow"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> <Input placeholder="ابحث بالاسم أو رقم الهاتف..." className="h-11 text-base bg-slate-100 rounded-lg pr-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                          <Button variant="outline" onClick={onAddNew} className="h-11 shrink-0"> <UserPlus className="w-4 h-4 ml-2" /> إضافة جديد </Button>
                      </>
                  )}
              </header>

            <main className="flex-grow relative overflow-hidden bg-slate-50/50">
                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div
                             key="list"
                             className="w-full h-full flex flex-col bg-white overflow-y-auto"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-3"/><span>جاري تحميل العملاء...</span></div>
                            ) : filteredAccounts.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                  {filteredAccounts.map(account => (
                                    <div
                                        key={account.id}
                                        onClick={() => openDetailsFor(account)}
                                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50/50 active:bg-blue-100 transition-colors"
                                    >
                                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border"><User className="w-4 h-4" /></div>
                                      <div className="flex-grow overflow-hidden"><p className="font-semibold text-sm text-slate-800 truncate">{account.name} <span className="text-xs text-slate-400">{account.nickname}</span></p><p className="font-mono text-xs text-slate-500 mt-1" dir="ltr">{account.phone1}</p></div>
                                       <ArrowRight className="w-5 h-5 text-slate-400 -rotate-180 shrink-0 ml-3" />
                                    </div>
                                  ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-slate-500"><p className="font-bold">لا توجد نتائج</p><p className="text-sm mt-1">أضف عميلاً جديداً</p></div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-white p-4 space-y-4 overflow-y-auto"
                        >
                            {selectedCustomer && (<>
                                <InfoDisplayField label="الاسم ثلاثي" value={selectedCustomer.name} />
                                <InfoDisplayField label="العنوان" value={selectedCustomer.address} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoDisplayField label="هاتف 1" value={selectedCustomer.phone1} isMono />
                                    <InfoDisplayField label="هاتف 2" value={selectedCustomer.phone2} isMono />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <ImageDisplayField label="وجه البطاقة" imageUrl={selectedCustomer.id_card_front} />
                                    <ImageDisplayField label="خلف البطاقة" imageUrl={selectedCustomer.id_card_back} />
                                </div>
                            </>)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
          </motion.div>
    </>)}</AnimatePresence>
  );
};

const useVehicles = () => {
    const [loading, setLoading] = useState(false);

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('current_state', 'in_stock');

            if (error) {
                console.error("Error fetching vehicles:", error);
                throw error;
            }
            return { data, error: null };
        } catch (error) {
            return { data: [], error };
        } finally {
            setLoading(false);
        }
    }, []);

    const addVehicle = useCallback(async (vehicleData) => {
        setLoading(true);
        try {
            const payload = {
                product_name: vehicleData.product_name,
                chassis_no: vehicleData.chassis_no,
                engine_no: vehicleData.engine_no,
                color: vehicleData.color,
                condition: vehicleData.condition,
                notes: vehicleData.notes,
                manufacture_year: vehicleData.model_year ? parseInt(vehicleData.model_year, 10) : new Date().getFullYear(),
                model_year: vehicleData.model_year ? parseInt(vehicleData.model_year, 10) : null,
                current_state: 'in_stock'
            };

            const { data, error } = await supabase
                .from('vehicles')
                .insert([payload])
                .select();

            if (error) {
                console.error("Error adding vehicle:", error);
                throw error;
            }
            return { data, error: null };
        } catch (error) {
             if (error.code === '23505') {
                 if (error.message.includes('vehicles_chassis_no_key')) {
                    return { data: null, error: { message: 'رقم الشاسيه هذا مسجل بالفعل لمركبة أخرى.' } };
                }
                if (error.message.includes('vehicles_engine_no_key')) {
                    return { data: null, error: { message: 'رقم المحرك هذا مسجل بالفعل لمركبة أخرى.' } };
                }
            }
            return { data: null, error: { message: 'حدث خطأ غير متوقع أثناء إضافة المركبة.'} };
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, fetchVehicles, addVehicle };
};

const AddNewVehicleSheet = ({ isOpen, onClose, onVehicleCreated }) => {
    const { addVehicle, loading } = useVehicles();
    const { toast } = useToast();
    const initialState = { product_name: '', chassis_no: '', engine_no: '', model_year: '', color: '', notes: '', condition: null };
    const [vehicle, setVehicle] = useState(initialState);

    const handleChange = e => setVehicle(prev => ({...prev, [e.target.name]: e.target.value}));

    const handleSave = async () => {
        if (!vehicle.product_name || !vehicle.chassis_no || !vehicle.engine_no) {
            toast({title: 'بيانات ناقصة', description: 'اسم المنتج، رقم الشاسيه، ورقم المحرك حقول مطلوبة.', variant: 'destructive'});
            return;
        }
        if (!vehicle.condition) {
            toast({title: 'بيانات ناقصة', description: 'الرجاء تحديد حالة المركبة (جديد أو مستعمل).', variant: 'destructive'});
            return;
        }

        const { data, error } = await addVehicle(vehicle);

        if (error) {
            toast({title: 'خطأ', description: error.message || 'فشل تسجيل المركبة.', variant: 'destructive'});
        } else if (data) {
            toast({title: 'تم بنجاح', description: 'تم تسجيل المركبة بنجاح.'});
            onVehicleCreated(data[0]);
        }
    };

    useEffect(() => {
        if (!isOpen) setTimeout(() => setVehicle(initialState), 300);
    }, [isOpen]);

    return (
        <AnimatePresence>{isOpen && (<>
            <motion.div key="add-vh-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[65]" />
            <motion.div key="add-vh-sheet" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }} className="fixed bottom-0 left-0 right-0 h-auto max-h-[90vh] bg-white z-[70] flex flex-col rounded-t-2xl border-t" dir="rtl">
                <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between"><h2 className="text-lg font-bold px-2">إضافة مركبة جديدة</h2><Button variant="ghost" onClick={onClose}>إلغاء</Button></header>
                <main className="flex-grow p-4 space-y-4 overflow-y-auto">
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                           <SimpleInput label="اسم المنتج *" name="product_name" value={vehicle.product_name} onChange={handleChange} placeholder="مثال: Hilux GLX" />
                        </div>
                        <div className="flex-shrink-0 grid grid-cols-2 gap-2 h-12 w-40">
                             <Button
                                 variant="outline"
                                 className={cn("h-full text-base font-bold", vehicle.condition === 'new' ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : "bg-white text-slate-900")}
                                 onClick={() => setVehicle(prev => ({...prev, condition: 'new'}))}
                             >
                                 جديد
                             </Button>
                             <Button
                                 variant="outline"
                                 className={cn("h-full text-base font-bold", vehicle.condition === 'used' ? "bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : "bg-white text-slate-900")}
                                 onClick={() => setVehicle(prev => ({...prev, condition: 'used'}))}
                             >
                                 مستعمل
                             </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <SimpleInput label="رقم الشاسيه *" name="chassis_no" value={vehicle.chassis_no} onChange={handleChange} dir="ltr" />
                        <SimpleInput label="رقم المحرك *" name="engine_no" value={vehicle.engine_no} onChange={handleChange} dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <SimpleInput label="سنة الموديل" name="model_year" value={vehicle.model_year} onChange={handleChange} type="number" dir="ltr" />
                        <SimpleInput label="اللون" name="color" value={vehicle.color} onChange={handleChange} />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="notes" className="font-semibold px-1 text-slate-800">ملاحظات</Label>
                        <Textarea id="notes" name="notes" placeholder="أي تفاصيل إضافية..." value={vehicle.notes || ''} onChange={handleChange} className="min-h-[100px] text-base bg-slate-100 border-slate-200" />
                    </div>
                </main>
                <footer className="p-3 bg-white/80 backdrop-blur-sm border-t"><Button onClick={handleSave} disabled={loading} className="w-full h-12 text-base font-bold">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تسجيل المنتج"}</Button></footer>
            </motion.div></>)}</AnimatePresence>
    );
};

const VehicleSelectionSheet = ({ isOpen, onClose, onVehicleSelect, onAddNew, itemToEdit, itemsInCart = [] }) => {
    const { loading, fetchVehicles } = useVehicles();
    const [vehicles, setVehicles] = useState([]);
    const [search, setSearch] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [price, setPrice] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setSelectedVehicle(itemToEdit);
                setPrice(itemToEdit.selling_price || '');
            } else {
                setSelectedVehicle(null);
                setPrice('');
                const load = async () => {
                    setInitialLoad(true);
                    const { data } = await fetchVehicles();
                    if (data) setVehicles(data.sort((a, b) => b.id - a.id));
                    setInitialLoad(false);
                };
                load();
            }
        } else {
            setTimeout(() => {
                setSearch('');
                setVehicles([]);
                setInitialLoad(true);
            }, 300);
        }
    }, [isOpen, itemToEdit, fetchVehicles]);

    const handleSelectClick = (vehicle) => {
        setSelectedVehicle(vehicle);
        setPrice('');
    };

    const handleConfirm = () => {
        if (!selectedVehicle) return;
        onVehicleSelect({ ...selectedVehicle, selling_price: price || '0' });
    };

    const handleBack = () => {
        if (itemToEdit) onClose();
        else setSelectedVehicle(null);
    };

    const itemIdsInCart = itemsInCart.map(item => item.id);
    const filtered = vehicles.filter(v => {
        if (!itemToEdit && itemIdsInCart.includes(v.id)) return false;

        const searchLower = search.toLowerCase();
        return (
            v.product_name.toLowerCase().includes(searchLower) ||
            v.chassis_no.toLowerCase().includes(searchLower) ||
            (v.brand && v.brand.toLowerCase().includes(searchLower))
        );
    });

    return (
        <AnimatePresence>{isOpen && (<>
            <motion.div key="vh-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[55]" />
            <motion.div key="vh-sheet" initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }} className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white z-[60] flex flex-col rounded-t-2xl border-t" dir="rtl">
                <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between gap-3">
                    {selectedVehicle ? (
                        <>
                           <Button variant="ghost" onClick={handleBack} className="w-28">{itemToEdit ? 'إلغاء' : 'رجوع'}</Button>
                           <h3 className="text-lg font-bold text-center flex-grow">{itemToEdit ? "تعديل سعر المنتج" : "إضافة سعر المنتج"}</h3>
                           <Button onClick={handleConfirm} className="w-28 font-bold">{itemToEdit ? "حفظ" : "إضافة"}</Button>
                        </>
                    ) : (
                        <>
                            <div className="relative flex-grow"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="ابحث بالاسم، الشاسيه..." className="h-11 text-base bg-slate-100 rounded-lg pr-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                            <Button variant="outline" onClick={onAddNew} className="h-11 shrink-0"><Tractor className="w-4 h-4 ml-2" /> إضافة مركبة </Button>
                        </>
                    )}
                </header>

                <main className="flex-grow overflow-y-auto bg-slate-50/50">
                    <AnimatePresence mode="wait">
                        {selectedVehicle ? (
                            <motion.div key="pricing" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }} className="p-4 space-y-4 bg-white h-full">
                                <div className="bg-slate-50 rounded-lg p-3 border">
                                   <p className="font-bold text-slate-800 text-lg">{selectedVehicle.product_name}</p>
                                   <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-sm text-slate-600 mt-1">
                                        <span className={cn("font-semibold px-2 py-0.5 rounded-full text-xs", selectedVehicle.condition === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}>{selectedVehicle.condition === 'new' ? 'جديد' : 'مستعمل'}</span>
                                        {selectedVehicle.model_year && <span className="font-semibold">{selectedVehicle.model_year}</span>}
                                        {selectedVehicle.color && <span className="font-semibold">{selectedVehicle.color}</span>}
                                    </div>
                                    <div className="font-mono text-xs text-slate-500 pt-2 flex items-center gap-x-2 flex-wrap" dir="rtl">
                                        <span><span className="font-sans font-bold text-slate-400">الشاسيه:</span> {selectedVehicle.chassis_no}</span>
                                        {selectedVehicle.engine_no && (
                                            <>
                                                <span className="mx-1 text-slate-300">|</span>
                                                <span><span className="font-sans font-bold text-slate-400">المحرك:</span> {selectedVehicle.engine_no}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <SimpleInput label="سعر البيع *" name="price" type="number" dir="ltr" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="h-14 text-lg font-mono font-bold" />
                            </motion.div>
                        ) : (
                            <motion.div key="list">
                                {(loading && initialLoad) ? <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin"/></div>
                                : filtered.length > 0 ? (
                                    <div className="divide-y divide-slate-100 bg-white">
                                        {filtered.map(v => (
                                            <div
                                                key={v.id}
                                                onClick={() => handleSelectClick(v)}
                                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-blue-50/50 transition-colors duration-200"
                                            >
                                                <div className="flex-grow">
                                                    <p className="font-bold text-slate-800">{v.product_name}</p>
                                                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-sm text-slate-600 mt-1">
                                                        <span className={cn("font-semibold px-2 py-0.5 rounded-full text-xs", v.condition === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}>{v.condition === 'new' ? 'جديد' : 'مستعمل'}</span>
                                                        {v.model_year && <span className="font-semibold">{v.model_year}</span>}
                                                        {v.color && <span className="font-semibold">{v.color}</span>}
                                                    </div>
                                                    <div className="font-mono text-xs text-slate-500 pt-2 flex items-center gap-x-2 flex-wrap" dir="rtl">
                                                        <span><span className="font-sans font-bold text-slate-400">الشاسيه:</span> {v.chassis_no}</span>
                                                        {v.engine_no && (
                                                            <>
                                                                <span className="mx-1 text-slate-300">|</span>
                                                                <span><span className="font-sans font-bold text-slate-400">المحرك:</span> {v.engine_no}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-slate-400 -rotate-180 shrink-0 ml-3" />
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-center py-16 text-slate-500"><p className="font-bold">لا توجد مركبات متاحة</p><p className="text-sm mt-1">يمكنك إضافة مركبة جديدة.</p></div>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </motion.div>
        </>)}</AnimatePresence>
    );
};

const AddCashPaymentSheet = ({ isOpen, onClose, onSave }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const { toast } = useToast();
    const [sheetHeight, setSheetHeight] = useState('85vh');

    const handleSave = () => {
        if (!amount || Number(amount) <= 0) {
            toast({ title: "مبلغ غير صالح", description: "الرجاء إدخال مبلغ صحيح.", variant: "destructive" });
            return;
        }
        onSave({ amount, description });
    };

    useEffect(() => {
        if (isOpen) {
            const calculatedHeight = window.innerHeight * 0.85;
            setSheetHeight(`${calculatedHeight}px`);
        } else {
            setTimeout(() => {
                setAmount('');
                setDescription('');
                setSheetHeight('85vh');
            }, 300);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>{isOpen && (<>
            <motion.div key="add-cash-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[65]" />
            <motion.div
                key="add-cash-sheet"
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="fixed bottom-0 left-0 right-0 bg-white z-[70] flex flex-col rounded-t-2xl border-t"
                style={{ height: sheetHeight }}
                dir="rtl"
            >
                <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between">
                    <Button variant="ghost" onClick={onClose} className="w-28">إلغاء</Button>
                    <h2 className="text-lg font-bold text-center flex-grow">إضافة دفعة نقدية</h2>
                    <Button onClick={handleSave} className="w-28 font-bold">حفظ الدفعة</Button>
                </header>
                <main className="flex-grow p-4 space-y-6 overflow-y-auto bg-slate-50/50">
                    <SimpleInput
                        label="المبلغ"
                        name="amount"
                        type="number"
                        dir="ltr"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="h-14 text-lg font-mono font-bold bg-white"
                    />
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="font-semibold px-1 text-slate-800">البيان (اختياري)</Label>
                        <Textarea
                             id="description"
                             name="description"
                             value={description}
                             onChange={(e) => setDescription(e.target.value)}
                             placeholder="مثال: دفعة تحت الحساب، عربون..."
                             className="min-h-[120px] text-base bg-white border-slate-200 shadow-sm"
                        />
                    </div>
                </main>
            </motion.div></>)}</AnimatePresence>
    );
};

const FinancingSheet = ({ isOpen, onClose, onSave, onAddNew, customer, fetchAllCustomerPaymentsForSelection, loading }) => {
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        if (isOpen && customer) {
            const loadData = async () => {
                const data = await fetchAllCustomerPaymentsForSelection(customer.id);
                setPayments(data);
            };
            loadData();
        } else {
             setTimeout(() => {
                setPayments([]);
                setSelectedPayment(null);
             }, 300);
        }
    }, [isOpen, customer, fetchAllCustomerPaymentsForSelection]);

    const handlePaymentClick = (payment) => {
        setSelectedPayment(payment);
    };

    const handleConfirm = () => {
        if (!selectedPayment) return;
        onSave({
            type: 'financing',
            amount: selectedPayment.amount_total,
            description: `${selectedPayment.pay_method || 'تمويل'} - ${selectedPayment.notes || ''}`,
            original_move_id: selectedPayment.id
        });
    };

    const handleBack = () => {
        setSelectedPayment(null);
    };

    const getFinancierIcon = (name) => {
      const lowerName = name?.toLowerCase() || '';
      if (lowerName.includes('myler') || lowerName.includes('مايلو')) return Tractor;
      if (lowerName.includes('aman') || lowerName.includes('امان')) return CreditCard;
      return Wallet;
    };

    return (
        <AnimatePresence>{isOpen && (
            <>
                <motion.div key="fin-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[65]" />
                <motion.div
                    key="fin-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white z-[70] flex flex-col rounded-t-2xl border-t"
                    dir="rtl"
                >
                    <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between gap-3 h-16">
                        {selectedPayment ? (
                            <>
                               <Button variant="ghost" onClick={handleBack} className="w-28 justify-start">رجوع</Button>
                               <h2 className="text-lg font-bold text-center flex-grow">تأكيد اختيار الدفعة</h2>
                               <Button onClick={handleConfirm} className="w-28 font-bold">تأكيد</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={onClose} className="w-28 justify-start">إلغاء</Button>
                                <h2 className="text-lg font-bold text-center flex-grow">الدفعات المتاحة للعميل</h2>
                                <Button variant="outline" className="h-11 shrink-0" onClick={onAddNew}>
                                    <UserPlus className="w-4 h-4 ml-2" /> إضافة جديد
                                </Button>
                            </>
                        )}
                    </header>
                    <main className="flex-grow overflow-y-auto bg-slate-50/50 relative">
                        <AnimatePresence mode="wait">
                            {selectedPayment ? (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="absolute inset-0 bg-white p-4 space-y-4"
                                >
                                    <div className="bg-slate-50 rounded-lg p-4 border text-center">
                                       <p className="text-sm text-slate-500">مبلغ الدفعة</p>
                                       <p className="font-mono font-bold text-4xl text-blue-600 mt-1">{Number(selectedPayment.amount_total).toLocaleString('ar-EG')}</p>
                                       <p className="text-sm text-slate-500 mt-1">جنيه مصري</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 border border-slate-200/80 space-y-3 text-sm">
                                      <div className="flex justify-between items-center"><span className="text-slate-500">البيان</span><span className="font-semibold text-slate-800 text-right">{selectedPayment.pay_method || 'دفعة'}</span></div>
                                      <div className="border-t"></div>
                                      <div className="flex justify-between items-center"><span className="text-slate-500">لحساب التاجر</span><span className="font-semibold text-slate-800 text-right">{selectedPayment.merchant_account || '---'}</span></div>
                                      <div className="border-t"></div>
                                      <div className="flex justify-between items-start"><span className="text-slate-500 pt-1">ملاحظات</span><p className="font-normal text-slate-700 text-right max-w-[70%]">{selectedPayment.notes || '---'}</p></div>
                                    </div>
                                    {selectedPayment.attachment_image && (
                                        <a href={selectedPayment.attachment_image} target="_blank" rel="noopener noreferrer" className="block">
                                           <div className="mt-4 p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors duration-200">
                                                <div className="flex items-center gap-3">
                                                    <img src={selectedPayment.attachment_image} alt="مرفق" className="w-12 h-12 rounded-md object-cover bg-slate-200"/>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">عرض المرفق</p>
                                                        <p className="text-xs text-slate-500">فتح في نافذة جديدة</p>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-5 h-5 text-slate-500" />
                                           </div>
                                        </a>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="list" className="h-full">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-3"/><span>جاري التحميل...</span></div>
                                    ) : payments.length > 0 ? (
                                        <div className="divide-y divide-slate-100 bg-white">{payments.map(payment => {
                                            const Icon = getFinancierIcon(payment.pay_method);
                                            return (
                                                <div key={payment.id} onClick={() => handlePaymentClick(payment)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 active:bg-blue-100 transition-colors">
                                                    <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border"><Icon className="w-6 h-6" /></div><div><p className="font-bold text-lg text-slate-800">{payment.pay_method || 'دفعة'}</p><p className="text-xs text-slate-500 mt-0.5 truncate max-w-40">{payment.notes || '---'}</p></div></div>
                                                    <div className="text-left flex flex-col items-end"><p className="font-mono font-bold text-2xl text-blue-600">{Number(payment.amount_total).toLocaleString('ar-EG')}</p><p className="text-xs text-slate-500 mt-0.5">ج.م</p></div>
                                                </div>
                                            )
                                        })}</div>
                                    ) : (
                                        <div className="text-center py-16 text-slate-500"><FileText className="w-10 h-10 mx-auto mb-3"/><p className="font-bold">لا توجد دفعات متاحة</p><p className="text-sm mt-1">هذا العميل ليس لديه دفعات مسجلة.</p></div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </motion.div>
            </>)}
        </AnimatePresence>
    );
};

const AddCustomFinancingSheet = ({ isOpen, onClose, onSave, customer, createCustomerPayment, loading }) => {
    const [selectedFinancier, setSelectedFinancier] = useState(null);
    const [amount, setAmount] = useState('');
    const [merchantAccount, setMerchantAccount] = useState('');
    const [notes, setNotes] = useState('');
    const [attachment, setAttachment] = useState(null);
    const { toast } = useToast();

    const financiers = ['مايلو', 'امان', 'الوكيل (مباشر)', 'حالا', 'كيان'];
    const merchantAccounts = ['شركة عابدين', 'معرض ابورجب', 'معرض جنو', 'احمد مختار كعبيش', 'معرض الوكيل', 'ذمم مدينة عملاء', 'اخري'];

    const handleFinancierSelect = (financierName) => {
        setSelectedFinancier(financierName);
    };

    const handleBackToSelection = () => {
        setSelectedFinancier(null);
        setAmount('');
        setMerchantAccount('');
        setNotes('');
        setAttachment(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
        }
    };

    const handleSave = async () => {
        if (!amount || !selectedFinancier || !merchantAccount) {
            toast({ title: "بيانات ناقصة", description: "الرجاء تعبئة جميع الحقول.", variant: "destructive" });
            return;
        }

        const { success } = await createCustomerPayment({
            partner_id: customer.id,
            pay_method: selectedFinancier,
            amount,
            mpatner_id: merchantAccount,
            notes,
            attach_img: attachment
        });

        if (success) {
            onSave();
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                handleBackToSelection();
            }, 300);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>{isOpen && (<>
            <motion.div key="add-fin-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[75]" />
            <motion.div
                key="add-fin-sheet"
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white z-[80] flex flex-col rounded-t-2xl border-t"
                dir="rtl"
            >
                <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between h-16">
                    <div className="w-24 flex justify-start">
                         <Button variant="ghost" onClick={selectedFinancier ? handleBackToSelection : onClose} disabled={loading}>
                            {selectedFinancier ? 'رجوع' : 'إلغاء'}
                        </Button>
                    </div>
                    <h2 className="text-lg font-bold text-center flex-grow">
                        {selectedFinancier ? `تمويل ${selectedFinancier}` : 'إضافة دفعة للعميل'}
                    </h2>
                    <div className="w-24 flex justify-end">
                        {selectedFinancier && <Button onClick={handleSave} className="font-bold" disabled={loading}>{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "حفظ"}</Button>}
                    </div>
                </header>

                <main className="flex-grow p-4 overflow-y-auto bg-slate-50">
                    {customer && (
                        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                            <div className="flex-shrink-0">
                                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <User className="w-8 h-8" />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {!selectedFinancier ? (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2 pt-6"
                            >
                                {financiers.map(name => (
                                    <Button
                                        key={name}
                                        variant="outline"
                                        className="w-full h-14 text-base font-medium justify-start p-4 border-slate-200"
                                        onClick={() => handleFinancierSelect(name)}
                                    >
                                        {name}
                                    </Button>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 pt-6"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-grow">
                                        <SimpleInput
                                            label="المبلغ"
                                            name="amount"
                                            type="number"
                                            dir="ltr"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="h-14 text-lg font-mono font-bold bg-slate-50"
                                        />
                                    </div>
                                    <div className="w-[45%] flex-shrink-0">
                                        <SimpleSelect
                                            label="لحساب التاجر"
                                            name="merchantAccount"
                                            value={merchantAccount}
                                            onChange={e => setMerchantAccount(e.target.value)}
                                        >
                                            <option value="" disabled>اختر حساب...</option>
                                            {merchantAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                                        </SimpleSelect>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="notes" className="font-semibold px-1 text-slate-800">ملاحظات</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="أضف تفاصيل إضافية..."
                                        className="min-h-[100px] text-base bg-slate-50 border-slate-200"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <Label className="font-semibold px-1 text-slate-800">إرفاق صورة (اختياري)</Label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </motion.div></>)}</AnimatePresence>
    );
};

const DatePickerSheet = ({ isOpen, onClose, value, onChange }) => {
    const [viewDate, setViewDate] = useState(value || new Date());
    const [selectedDate, setSelectedDate] = useState(value || new Date());

    useEffect(() => {
        if (isOpen) {
            const newDate = value || new Date();
            setViewDate(newDate);
            setSelectedDate(newDate);
        }
    }, [isOpen, value]);

    const handleConfirm = () => {
        onChange(selectedDate);
        onClose();
    };

    const changeMonth = (amount) => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-full h-12"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const isSelected = selectedDate.toDateString() === currentDate.toDateString();
            const isToday = today.toDateString() === currentDate.toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => setSelectedDate(currentDate)}
                    className={cn(
                        "w-full h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-150",
                        isSelected
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : isToday
                                ? "bg-slate-100 text-slate-900"
                                : "hover:bg-slate-100 text-slate-700"
                    )}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <AnimatePresence>{isOpen && (
            <>
                <motion.div key="date-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-[65]" />
                <motion.div
                    key="date-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    className="fixed bottom-0 left-0 right-0 h-auto bg-white z-[70] flex flex-col rounded-t-2xl border-t pb-4"
                    dir="rtl"
                >
                    <header className="flex-shrink-0 p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button size="icon" variant="ghost" onClick={() => changeMonth(-1)}><ChevronRight className="h-5 w-5" /></Button>
                            <h3 className="text-base font-bold text-slate-800 w-32 text-center">
                                {viewDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                            </h3>
                            <Button size="icon" variant="ghost" onClick={() => changeMonth(1)}><ChevronLeft className="h-5 w-5" /></Button>
                        </div>
                         <Button onClick={handleConfirm} className="font-bold">تأكيد</Button>
                    </header>
                    <main className="p-3">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
                            {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(day => <div key={day}>{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendar()}
                        </div>
                    </main>
                </motion.div>
            </>)}</AnimatePresence>
    );
};

const Step1_CustomerAndProducts = ({ customer, onSelectCustomer, items, setItems, onOpenVehicleSelector, onOpenVehicleEditor, invoiceDate, onDatePickerOpen }) => {
    const handleRemoveItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const total = items.reduce((acc, item) => acc + (Number(item.selling_price) || 0), 0);

    const InfoItem = ({ label, value, isMono, className }) => (
        <div className={className}>
            <p className="text-xs text-slate-500">{label}</p>
            {value ? (
                <p className={cn("text-sm font-medium text-slate-800", isMono && "font-mono")}>{value}</p>
            ) : (
                <p className="text-sm font-medium text-red-500">--</p>
            )}
        </div>
    );

    return (
        <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="border-b pb-6 mb-6">
                {customer ? (
                    <div className="-mx-4 px-4">
                        <div className="flex items-start justify-between pb-4">
                            <div className="flex items-center gap-4">
                                <User className="h-8 w-8 text-slate-600 flex-shrink-0" />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{customer.name || <span className="text-red-500">--</span>}</h2>
                                    <p className="text-sm text-slate-500">العميل المحدد للفاتورة الحالية</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={onSelectCustomer}
                                className="bg-white"
                            >
                                تغيير العميل
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-4 pr-12 border-t">
                            <InfoItem label="الهاتف" value={customer.phone1} isMono />
                            <InfoItem label="هاتف إضافي" value={customer.phone2} isMono />
                            <InfoItem label="العنوان" value={customer.address} className="col-span-full"/>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-xl bg-white">
                        <h3 className="text-lg font-semibold text-slate-700">الخطوة الأولى: تحديد العميل</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-4">ابدأ باختيار عميل موجود أو إضافة عميل جديد لإضافته إلى الفاتورة.</p>
                        <Button onClick={onSelectCustomer} className="h-11 px-6">
                            <User className="ml-2 h-4 w-4" />
                            اختيار العميل
                        </Button>
                    </div>
                )}
            </div>

            {customer && (
                 <div className="border-b pb-6 mb-8">
                    <div className="flex items-center justify-between gap-4 py-2">
                       <Label className="font-semibold text-slate-800 text-base">تاريخ الفاتورة</Label>
                       <Button
                           variant="outline"
                           onClick={onDatePickerOpen}
                           className="w-auto justify-start text-right font-normal bg-white h-11 shadow-sm border-slate-200 hover:bg-slate-50"
                       >
                           <span className="ml-3 text-base">{invoiceDate.toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                           <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                       </Button>
                    </div>
                 </div>
            )}

            <div className="space-y-6">
                <div className="text-center">
                    <Button onClick={onOpenVehicleSelector} variant="outline" className="h-12 w-full border-dashed bg-white shadow-sm hover:bg-slate-50" disabled={!customer}>
                        <Tractor className="w-5 h-5 ml-2" /> إضافة منتج / مركبة
                    </Button>
                </div>
                {items.length > 0 && (
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} onClick={() => onOpenVehicleEditor(item)} className="bg-white rounded-lg p-4 border shadow-sm cursor-pointer hover:border-blue-500 active:bg-slate-50 transition-colors duration-150">
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow pr-4">
                                        <p className="font-bold text-slate-800">{item.product_name}</p>
                                        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-sm text-slate-600 mt-1">
                                            <span className={cn("font-semibold px-2 py-0.5 rounded-full text-xs", item.condition === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}>{item.condition === 'new' ? 'جديد' : 'مستعمل'}</span>
                                            {item.model_year && <span className="font-semibold">{item.model_year}</span>}
                                            {item.color && <span className="font-semibold">{item.color}</span>}
                                        </div>
                                        <div className="font-mono text-xs text-slate-500 pt-2 flex items-center gap-x-2 flex-wrap" dir="rtl">
                                          <span><span className="font-sans font-bold text-slate-400">الشاسيه:</span> {item.chassis_no}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 self-end -mt-2 -mr-2"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}>
                                            <X className="h-5 w-5" />
                                        </Button>
                                        <span className="font-mono font-bold text-xl text-slate-900 mt-1">
                                            {Number(item.selling_price || 0).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-slate-500">ج.م</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {items.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border space-y-3 text-sm shadow-sm mt-6">
                        <div className="border-t my-2"></div>
                        <div className="flex justify-between items-center font-bold text-base text-slate-900"><span>المجموع الإجمالي</span><span className="font-mono text-lg">{total.toLocaleString()}</span></div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const Step2_Payments = ({ items, payments, setPayments, onAddCashClick, onAddOtherPaymentClick }) => {
    const handleRemovePayment = (paymentId) => {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
    };

    const totalInvoiceAmount = items.reduce((acc, item) => acc + (Number(item.selling_price) || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingAmount = totalInvoiceAmount - totalPaid;

    const getPaymentTypeStyle = (type) => {
        switch (type) {
            case 'cash':
                return "text-emerald-800 bg-emerald-100/80";
            case 'financing':
                return "text-blue-800 bg-blue-100/80";
            default:
                return "text-slate-800 bg-slate-100/80";
        }
    }

    const getPaymentTypeName = (type) => {
        switch (type) {
            case 'cash':
                return "نقــدي";
            case 'financing':
                return "تمويــل";
            default:
                return "غير محدد";
        }
    }

    return (
        <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center bg-slate-50/70 border-b-2 border-slate-200/60">
                    <span className="font-bold text-slate-700 text-lg">الإجمالي المطلوب</span>
                    <span className="font-mono font-bold text-3xl text-slate-900 tracking-tight">{totalInvoiceAmount.toLocaleString()}</span>
                </div>

                <div className="p-3 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 bg-white text-base font-semibold flex items-center justify-center gap-2" onClick={onAddCashClick}><Wallet className="w-5 h-5 text-slate-500"/><span>دفعة نقدية</span></Button>
                    <Button variant="outline" className="h-12 bg-white text-base font-semibold flex items-center justify-center gap-2" onClick={onAddOtherPaymentClick}><CreditCard className="w-5 h-5 text-slate-500"/><span>وسائل دفع</span></Button>
                </div>

                <div className="p-3 space-y-2 min-h-[120px]">
                    {payments.length > 0 ? (
                        payments.map(payment => (
                             <div key={payment.id} className="p-2.5 flex items-center justify-between bg-slate-50 rounded-md border border-slate-200/80">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3">
                                        <p className="font-bold font-mono text-slate-800 text-lg">{Number(payment.amount).toLocaleString()}</p>
                                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", getPaymentTypeStyle(payment.type))}>{getPaymentTypeName(payment.type)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 pr-px">{payment.description || '---'}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 self-start" onClick={() => handleRemovePayment(payment.id)}><X className="h-4 w-4"/></Button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 pt-5">
                            <Wallet size={32} className="mx-auto"/>
                            <p className="mt-2 font-semibold text-sm">لم يتم تسجيل أي دفعات</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50/70 border-t border-slate-200/60 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-600">إجمالي المدفوعات</span>
                        <span className="font-mono font-bold text-emerald-600 text-base">{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 my-1"></div>
                    <div className={cn(
                        "flex justify-between items-center font-bold text-lg",
                        remainingAmount === 0 && totalInvoiceAmount > 0 ? "text-green-600" : "text-red-600",
                        totalInvoiceAmount === 0 ? "text-slate-700" : ""
                    )}>
                        <span>المتبقي</span>
                        <span className="font-mono tracking-tighter">{remainingAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const Step3_DeferredPayment = ({ remainingAmount, note, onNoteChange }) => (
    <motion.div key="step3_deferred" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6 bg-white rounded-lg border shadow-sm space-y-6">
        <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border-4 border-white ring-2 ring-amber-200">
                <Wallet size={32} />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-800">فاتورة آجلة</h2>
            <p className="mt-2 text-base text-slate-600">
                المبلغ المتبقي على هذه الفاتورة هو:
            </p>
            <p className="mt-1 font-mono font-bold text-3xl text-red-600 tracking-tighter">
                {remainingAmount.toLocaleString()} ج.م
            </p>
        </div>
        <div className="space-y-1.5 pt-6 border-t border-slate-200">
            <Label htmlFor="payment_note" className="font-semibold px-1 text-slate-800">ملاحظات السداد (اختياري)</Label>
            <Textarea
                id="payment_note"
                name="payment_note"
                value={note}
                onChange={onNoteChange}
                placeholder="مثال: سيتم سداد المبلغ خلال أسبوع، موعد الاستحقاق..."
                className="min-h-[120px] text-base bg-slate-50 border-slate-200"
            />
        </div>
    </motion.div>
);

const Step4_Review = ({ customer, items, payments, invoiceDate }) => {
    const totalInvoiceAmount = items.reduce((acc, item) => acc + (Number(item.selling_price) || 0), 0);
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remainingAmount = totalInvoiceAmount - totalPaid;

    return (
        <motion.div key="step4-review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-lg border shadow-sm p-6 space-y-8" id="invoice-preview">
                <div className="flex justify-between items-start pb-6 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">فاتورة بيع</h1>
                        <p className="text-slate-500 mt-1">رقم الفاتورة: #12345</p>
                        <p className="text-slate-500">التاريخ: {invoiceDate.toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-slate-700">اسم معرضك</h2>
                        <p className="text-slate-500 text-sm">العنوان: شارعكم، مدينتكم</p>
                        <p className="text-slate-500 text-sm">الهاتف: 0123456789</p>
                    </div>
                </div>

                <div className="py-6 border-b">
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">بيانات العميل</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">الاسم:</span> <span className="font-bold text-slate-800">{customer?.name}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">الهاتف:</span> <span className="font-mono">{customer?.phone1}</span></div>
                        <div className="flex justify-between col-span-2"><span className="text-slate-500">العنوان:</span> <span className="font-semibold text-slate-800">{customer?.address}</span></div>
                    </div>
                </div>

                <div className="py-6 border-b">
                    <table className="w-full text-right">
                        <thead className="border-b">
                            <tr>
                                <th className="py-2 font-semibold text-slate-600">المنتج</th>
                                <th className="py-2 font-semibold text-slate-600 text-left">السعر (ج.م)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="py-3">
                                        <p className="font-bold text-slate-800">{item.product_name}</p>
                                        <p className="text-xs text-slate-500 font-mono" dir="ltr">{item.chassis_no}</p>
                                    </td>
                                    <td className="py-3 font-mono font-semibold text-left">{Number(item.selling_price).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between pt-6">
                    <div className="w-1/2 pr-4">
                         <h3 className="text-lg font-semibold text-slate-600 mb-3">المدفوعات</h3>
                         <div className="space-y-2">
                             {payments.map(p => (
                                 <div key={p.id} className="flex justify-between text-sm">
                                     <span className="text-slate-500">{p.description || 'دفعة نقدية'}</span>
                                     <span className="font-mono font-semibold text-emerald-600">{Number(p.amount).toLocaleString()}</span>
                                 </div>
                             ))}
                             {payments.length === 0 && <p className="text-sm text-slate-400">لم تسجل دفعات.</p>}
                         </div>
                    </div>
                    <div className="w-1/2 pl-4 space-y-3">
                        <div className="flex justify-between items-center text-base">
                            <span className="font-semibold text-slate-600">المجموع</span>
                            <span className="font-mono font-bold text-slate-800">{totalInvoiceAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                            <span className="font-semibold text-slate-600">إجمالي المدفوع</span>
                            <span className="font-mono font-bold text-emerald-600">{totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="border-t"></div>
                        <div className="flex justify-between items-center text-xl">
                            <span className="font-bold text-slate-800">المبلغ المتبقي</span>
                            <span className="font-mono font-extrabold text-red-600">{remainingAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-8 text-center text-xs text-slate-400">
                    <p>شكرًا لتعاملكم معنا!</p>
                </div>
            </div>
        </motion.div>
    );
};

const CreateInvoiceSheet = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [customer, setCustomer] = useState(null);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [isCustomerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const [isCustomerFormOpen, setCustomerFormOpen] = useState(false);
  const [newlyAddedCustomerId, setNewlyAddedCustomerId] = useState(null);
  const [items, setItems] = useState([]);
  const [isVehicleSelectorOpen, setVehicleSelectorOpen] = useState(false);
  const [isAddNewVehicleOpen, setAddNewVehicleOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [isCashSheetOpen, setCashSheetOpen] = useState(false);
  const [isFinancingSheetOpen, setFinancingSheetOpen] = useState(false);
  const [isAddCustomFinancingOpen, setAddCustomFinancingOpen] = useState(false);
  const [deferredPaymentNote, setDeferredPaymentNote] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const { loading, createSaleInvoice, fetchAllCustomerPaymentsForSelection, createCustomerPayment } = useAccountMoves();

  const totalSteps = 4;

  const totalInvoiceAmount = items.reduce((acc, item) => acc + (Number(item.selling_price) || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remainingAmount = totalInvoiceAmount - totalPaid;
  const isDeferred = remainingAmount > 0;

  const handleNext = async () => {
      if (currentStep === 2 && !isDeferred) {
          setCurrentStep(4);
          return;
      }
      if (currentStep < totalSteps) {
          setCurrentStep(s => s + 1);
      } else {
          const invoiceData = {
              customer_id: customer.id,
              invoice_date: invoiceDate,
              total_amount: totalInvoiceAmount,
              notes: deferredPaymentNote
          };
          const invoiceLines = items.map(item => ({
              product_id: item.id,
              selling_price: Number(item.selling_price)
          }));

          const { success } = await createSaleInvoice(invoiceData, invoiceLines, payments);
          if (success) {
             if (!isDeferred) {
                setTimeout(() => window.print(), 500);
             }
             onClose();
          }
      }
  };

  const handleBack = () => {
      if (currentStep === 4 && !isDeferred) {
          setCurrentStep(2);
          return;
      }
      if (currentStep > 1) {
          setCurrentStep(s => s - 1);
      } else {
          onClose();
      }
  };

  const handleCustomerConfirmed = (confirmedCustomer) => {
      setCustomer(confirmedCustomer);
      setCustomerToEdit(null);
      setCustomerSelectorOpen(false);
  };

  const handleAddNewCustomer = () => {
      setCustomerToEdit(null);
      setCustomerFormOpen(true);
  };

  const handleEditCustomer = (customerToEdit) => {
      setCustomerToEdit(customerToEdit);
      setCustomerFormOpen(true);
  };

  const handleCustomerFormSave = (savedCustomer) => {
      if (customer && savedCustomer.id === customer.id) {
          setCustomer(savedCustomer);
      }
      setCustomerToEdit(null);
      setCustomerFormOpen(false);
      setNewlyAddedCustomerId(savedCustomer.id);
  };

  const handleOpenVehicleEditor = (item) => {
    setItemToEdit(item);
    setVehicleSelectorOpen(true);
  };

  const handleVehicleSelected = (vehicleData) => {
      if (itemToEdit) {
          setItems(prevItems => prevItems.map(item =>
              item.id === itemToEdit.id ? { ...item, ...vehicleData } : item
          ));
      } else {
          setItems(prev => [...prev, vehicleData]);
      }
      setItemToEdit(null);
      setVehicleSelectorOpen(false);
  };

  const handleSaveCashPayment = (newPayment) => {
      setPayments(prev => [...prev, { id: Date.now(), type: 'cash', ...newPayment }]);
      setCashSheetOpen(false);
  };

  const handleSaveFinancingPayment = (newPayment) => {
    setPayments(prev => [...prev, { id: Date.now(), ...newPayment }]);
    setFinancingSheetOpen(false);
    setAddCustomFinancingOpen(false);
  };

  const handleSaveNewFinancingAndReopen = () => {
      setAddCustomFinancingOpen(false);
  };

  const handleAddNewVehicle = () => {
      setVehicleSelectorOpen(false);
      setAddNewVehicleOpen(true);
  };

  const handleVehicleCreated = () => {
      setAddNewVehicleOpen(false);
      setVehicleSelectorOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
        if (!isCustomerSelectorOpen && !isCustomerFormOpen && !customer) {
            setCustomerSelectorOpen(true);
        }
    } else {
        setTimeout(() => {
            setCurrentStep(1);
            setCustomer(null);
            setCustomerToEdit(null);
            setItems([]);
            setPayments([]);
            setDeferredPaymentNote('');
            setInvoiceDate(new Date());
            setCustomerSelectorOpen(false);
            setCustomerFormOpen(false);
            setVehicleSelectorOpen(false);
            setCashSheetOpen(false);
            setFinancingSheetOpen(false);
            setAddCustomFinancingOpen(false);
            setNewlyAddedCustomerId(null);
            setItemToEdit(null);
        }, 300);
    }
  }, [isOpen, isCustomerSelectorOpen, isCustomerFormOpen, customer]);

  const isFinalStep = currentStep === totalSteps;

  return (
    <>
      <Toaster />

      <AnimatePresence>{isOpen && <motion.div key="inv-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" />}</AnimatePresence>

      <AnimatePresence>{isOpen && (
        <motion.div initial={{ y: '100%' }} animate={{ y: '0%' }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.3, ease: [0.25, 1, 0.5, 1] }} className="fixed inset-0 h-screen bg-white z-50 flex flex-col" dir="rtl">
          <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm z-10 border-b">
            <div className="w-full mx-auto px-4 sm:px-6">
              <div className="flex justify-between items-center h-16">
                <Button onClick={handleBack} variant="ghost" className="w-20 justify-start">{currentStep > 1 ? "السابق" : "إغلاق"}</Button>
                <h2 className="text-lg font-bold">فاتورة جديدة ({currentStep}/{totalSteps})</h2>
                <Button onClick={handleNext} disabled={!customer || items.length === 0 || loading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full px-5 w-auto justify-center">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                     isFinalStep ? (isDeferred ? "حفظ الفاتورة" : <><Printer className="w-4 h-4 ml-2" /><span>طباعة</span></>) : (currentStep === 3 ? "متابعة للمراجعة" : "التالي")}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-grow overflow-y-auto p-4 sm:p-6 bg-white">
            <div className="w-full max-w-3xl mx-auto pb-10">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <Step1_CustomerAndProducts
                            customer={customer}
                            onSelectCustomer={() => setCustomerSelectorOpen(true)}
                            items={items}
                            setItems={setItems}
                            onOpenVehicleSelector={() => { setItemToEdit(null); setVehicleSelectorOpen(true); }}
                            onOpenVehicleEditor={handleOpenVehicleEditor}
                            invoiceDate={invoiceDate}
                            onDatePickerOpen={() => setDatePickerOpen(true)}
                        />
                    )}
                    {currentStep === 2 && <Step2_Payments items={items} payments={payments} setPayments={setPayments} onAddCashClick={() => setCashSheetOpen(true)} onAddOtherPaymentClick={() => setFinancingSheetOpen(true)} />}
                    {currentStep === 3 &&
                        <Step3_DeferredPayment
                            remainingAmount={remainingAmount}
                            note={deferredPaymentNote}
                            onNoteChange={(e) => setDeferredPaymentNote(e.target.value)}
                        />
                    }
                    {currentStep === 4 &&
                        <Step4_Review
                            customer={customer}
                            items={items}
                            payments={payments}
                            invoiceDate={invoiceDate}
                        />
                    }
                </AnimatePresence>
            </div>
          </main>
        </motion.div>
      )}</AnimatePresence>

      <CustomerSelectionSheet
        isOpen={isCustomerSelectorOpen}
        onClose={() => setCustomerSelectorOpen(false)}
        onCustomerConfirmed={handleCustomerConfirmed}
        onAddNew={handleAddNewCustomer}
        onEdit={handleEditCustomer}
        newlyAddedCustomerId={newlyAddedCustomerId}
        onClearHighlight={() => setNewlyAddedCustomerId(null)}
      />

      <PartnerFormSheet
        open={isCustomerFormOpen}
        onClose={() => {
          setCustomerFormOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={handleCustomerFormSave}
        partner={customerToEdit}
        mode={customerToEdit ? 'edit' : 'create'}
        defaultType="customer"
      />

      <VehicleSelectionSheet
        isOpen={isVehicleSelectorOpen}
        onClose={() => { setVehicleSelectorOpen(false); setItemToEdit(null); }}
        onVehicleSelect={handleVehicleSelected}
        onAddNew={handleAddNewVehicle}
        itemToEdit={itemToEdit}
        itemsInCart={items}
      />

      <AddNewVehicleSheet
        isOpen={isAddNewVehicleOpen}
        onClose={() => { setAddNewVehicleOpen(false); setVehicleSelectorOpen(true); }}
        onVehicleCreated={handleVehicleCreated}
      />

      <AddCashPaymentSheet
        isOpen={isCashSheetOpen}
        onClose={() => setCashSheetOpen(false)}
        onSave={handleSaveCashPayment}
      />

      <FinancingSheet
        isOpen={isFinancingSheetOpen}
        onClose={() => setFinancingSheetOpen(false)}
        onSave={handleSaveFinancingPayment}
        onAddNew={() => { setAddCustomFinancingOpen(true); }}
        customer={customer}
        fetchAllCustomerPaymentsForSelection={fetchAllCustomerPaymentsForSelection}
        loading={loading}
      />

      <AddCustomFinancingSheet
        isOpen={isAddCustomFinancingOpen}
        onClose={() => { setAddCustomFinancingOpen(false); }}
        onSave={handleSaveNewFinancingAndReopen}
        customer={customer}
        createCustomerPayment={createCustomerPayment}
        loading={loading}
      />

      <DatePickerSheet
        isOpen={isDatePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        value={invoiceDate}
        onChange={setInvoiceDate}
      />

      <style jsx global>{`
            @media print {
                body > *:not(#invoice-preview) {
                    display: none;
                }
                main, #invoice-preview {
                    display: block;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    height: auto;
                    padding: 20px;
                    margin: 0;
                    background-color: white !important;
                    border: none;
                    box-shadow: none;
                }
                header, footer {
                    display: none;
                }
            }
      `}</style>
    </>
  );
};

export default CreateInvoiceSheet;