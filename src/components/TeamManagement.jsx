
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Trash2, Shield, User, Search, Mail, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/customSupabaseClient';
import GlobalLayoutWrapper from '@/components/GlobalLayoutWrapper';

const TeamManagement = ({ currentUser }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', username: '', email: '', password: '', role: 'employee' });
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching employees:', error);
      toast({ title: "خطأ", description: "تعذر تحميل بيانات الموظفين", variant: "destructive" });
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.username || !newEmployee.password || !newEmployee.name) return;
    
    const { error } = await supabase
      .from('app_users')
      .insert([newEmployee]);

    if (error) {
      if (error.code === '23505') { // Unique violation
         toast({ title: "خطأ", description: "اسم المستخدم موجود بالفعل", variant: "destructive" });
      } else {
         toast({ title: "خطأ", description: "تعذر إضافة الموظف", variant: "destructive" });
      }
      return;
    }

    toast({ 
      title: "تم الحفظ", 
      description: `تم إضافة الموظف ${newEmployee.name} بنجاح`,
      className: "bg-white border-stone-200"
    });
    
    setIsDialogOpen(false);
    setNewEmployee({ name: '', username: '', email: '', password: '', role: 'employee' });
    fetchEmployees(); // Refresh list
  };

  const handleDelete = async (id) => {
    const toDelete = employees.find(e => e.id === id);
    
    if (toDelete.role === 'admin') {
       const adminCount = employees.filter(e => e.role === 'admin').length;
       if (adminCount <= 1) {
          toast({ title: "لا يمكن الحذف", description: "يجب أن يبقى مدير واحد على الأقل في النظام", variant: "destructive" });
          return;
       }
    }
    
    if (toDelete.username === currentUser.username) {
         toast({ title: "تنبيه", description: "لا يمكنك حذف حسابك الحالي أثناء استخدامه", variant: "destructive" });
         return;
    }

    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "خطأ", description: "تعذر حذف الحساب", variant: "destructive" });
    } else {
      toast({ title: "تم الحذف", description: "تم حذف حساب الموظف" });
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
             <Shield className="w-3 h-3" />
             مدير
          </span>
        );
      case 'customer_accountant':
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
             <Briefcase className="w-3 h-3" />
             محاسب عملاء
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
             موظف
          </span>
        );
    }
  };

  return (
    <GlobalLayoutWrapper className="space-y-8 pb-20">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-stone-900 text-white shadow-xl flex flex-col p-8 w-full"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-stone-800/50 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>إدارة النظام</span>
            </div>
            <h2 className="text-3xl font-bold">فريق العمل</h2>
            <p className="text-stone-400 max-w-md">أضف موظفين جدد وامنحهم صلاحيات الوصول إلى أدوات النظام.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-stone-900 hover:bg-stone-200 font-bold px-6 py-6 rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-1">
                <UserPlus className="w-5 h-5" />
                <span>إضافة موظف جديد</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
               <div className="bg-stone-900 p-6">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        إضافة حساب جديد
                    </DialogTitle>
                  </DialogHeader>
               </div>
               
               <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-stone-500 mb-1.5 block">الاسم الكامل</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-3 bg-stone-50 rounded-xl border-2 border-transparent focus:border-stone-900/10 focus:bg-white transition-all font-medium"
                      placeholder="مثال: محمد أحمد"
                      value={newEmployee.name}
                      onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                    />
                  </div>
                  
                   <div>
                    <label className="text-xs font-bold text-stone-500 mb-1.5 block">البريد الإلكتروني (اختياري)</label>
                    <input 
                      type="email" 
                      className="w-full p-3 bg-stone-50 rounded-xl border-2 border-transparent focus:border-stone-900/10 focus:bg-white transition-all font-medium"
                      placeholder="name@example.com"
                      value={newEmployee.email}
                      onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-stone-500 mb-1.5 block">اسم المستخدم</label>
                        <input 
                          required
                          type="text" 
                          dir="ltr"
                          className="w-full p-3 bg-stone-50 rounded-xl border-2 border-transparent focus:border-stone-900/10 focus:bg-white transition-all font-medium"
                          placeholder="username"
                          value={newEmployee.username}
                          onChange={e => setNewEmployee({...newEmployee, username: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-stone-500 mb-1.5 block">كلمة المرور</label>
                        <input 
                          required
                          type="text" 
                          dir="ltr"
                          className="w-full p-3 bg-stone-50 rounded-xl border-2 border-transparent focus:border-stone-900/10 focus:bg-white transition-all font-medium"
                          placeholder="123456"
                          value={newEmployee.password}
                          onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
                        />
                     </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-500 mb-1.5 block">نوع الحساب</label>
                    <div className="flex bg-stone-50 p-1 rounded-xl gap-1">
                       <button
                         type="button"
                         onClick={() => setNewEmployee({...newEmployee, role: 'employee'})}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newEmployee.role === 'employee' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                       >
                         موظف
                       </button>
                       <button
                         type="button"
                         onClick={() => setNewEmployee({...newEmployee, role: 'customer_accountant'})}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newEmployee.role === 'customer_accountant' ? 'bg-white shadow-sm text-blue-600' : 'text-stone-400 hover:text-stone-600'}`}
                       >
                         محاسب عملاء
                       </button>
                       <button
                         type="button"
                         onClick={() => setNewEmployee({...newEmployee, role: 'admin'})}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newEmployee.role === 'admin' ? 'bg-stone-800 shadow-sm text-white' : 'text-stone-400 hover:text-stone-600'}`}
                       >
                         مدير
                       </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full py-6 mt-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold">
                     حفظ الحساب
                  </Button>
               </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Search & Stats */}
      <div className="flex items-center gap-4">
         <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
               type="text" 
               placeholder="بحث عن موظف..."
               className="w-full pl-4 pr-11 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-100 transition-all text-sm font-medium"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="bg-white border border-stone-200 px-4 py-3 rounded-xl text-sm font-bold text-stone-600 shadow-sm">
            {loading ? '...' : filteredEmployees.length} حساب
         </div>
      </div>

      {/* Employee List */}
      <div className="grid gap-3">
        {loading ? (
           <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mb-4"></div>
              <p className="text-stone-400 text-sm">جاري تحميل البيانات...</p>
           </div>
        ) : (
          <AnimatePresence>
             {filteredEmployees.map((employee) => (
               <motion.div
                 key={employee.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, height: 0 }}
                 className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:border-stone-200 transition-all flex items-center justify-between group"
               >
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold uppercase ${
                        employee.role === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                     }`}>
                        {employee.name.charAt(0)}
                     </div>
                     <div>
                        <h3 className="font-bold text-stone-800 text-lg">{employee.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                           <span className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                              <User className="w-3 h-3" />
                              {employee.username}
                           </span>
                           {employee.email && (
                             <span className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                                <Mail className="w-3 h-3" />
                                {employee.email}
                             </span>
                           )}
                           {getRoleBadge(employee.role)}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <div className="text-right mr-4 hidden sm:block">
                        <span className="text-[10px] text-stone-400 block mb-1">كلمة المرور</span>
                        <code className="bg-stone-50 px-2 py-1 rounded text-stone-600 text-xs font-mono border border-stone-200">{employee.password}</code>
                     </div>

                     {(employee.username !== currentUser?.username || employees.length > 1) && (
                        <button 
                          onClick={() => handleDelete(employee.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-stone-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="حذف الحساب"
                        >
                           <Trash2 className="w-5 h-5" />
                        </button>
                     )}
                  </div>
               </motion.div>
             ))}
          </AnimatePresence>
        )}
        
        {!loading && filteredEmployees.length === 0 && (
           <div className="text-center py-10 text-stone-400">
              لا توجد حسابات مطابقة للبحث
           </div>
        )}
      </div>
    </GlobalLayoutWrapper>
  );
};

export default TeamManagement;
