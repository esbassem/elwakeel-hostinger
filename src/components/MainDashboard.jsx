
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  FileText, 
  Package, 
  LogOut, 
  ChevronRight, 
  Users, 
  Search, 
  LayoutGrid, 
  ShieldCheck, 
  Bell,
  Banknote,
  Gavel
} from 'lucide-react';
import KhaznaTool from '@/components/KhaznaTool';
import TeamManagement from '@/components/TeamManagement';
import FinanceTab from '@/components/FinanceTab';
import CollectionOfficerDashboard from '@/components/CollectionOfficerDashboard';
import AccountSearchBar from '@/components/AccountSearchBar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const MainDashboard = ({ user, onLogout }) => {
  const [activeTool, setActiveTool] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect Logic for customer_accountant
  useEffect(() => {
    if (user?.role === 'customer_accountant') {
      navigate('/customer-accounts', { replace: true });
      toast({
        title: "توجيه تلقائي",
        description: "تم توجيهك إلى لوحة حسابات العملاء المخصصة لصلاحياتك",
        duration: 3000,
      });
    }
  }, [user, navigate, toast]);

  const handleToolClick = (toolId, isAvailable = true) => {
    if (isAvailable) {
      setActiveTool(toolId);
    } else {
      toast({
        title: "قريباً",
        description: "هذه الأداة قيد التطوير وستتوفر قريباً بإذن الله",
        className: "bg-white border-stone-200"
      });
    }
  };

  const isAdmin = user?.role === 'admin';
  const isCollectionOfficer = user?.role === 'collection_officer' || isAdmin;
  
  // If user is customer_accountant (and not redirected yet for some reason), 
  // ensure they don't see unauthorized tools.
  const isCustomerAccountant = user?.role === 'customer_accountant';

  // Tools Configuration
  const mainTools = [
    {
      id: 'khazna',
      title: "الخزنة",
      description: "إدارة النقدية والمصروفات اليومية",
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-200",
      available: true,
      hidden: isCustomerAccountant
    },
    {
      id: 'finances',
      title: "التمويلات",
      description: "إدارة القروض والأقساط",
      icon: Banknote,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-200",
      available: true,
      hidden: isCustomerAccountant
    },
    {
      id: 'invoices',
      title: "الفواتير",
      description: "إنشاء وإدارة فواتير العملاء",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-200",
      available: false,
      hidden: isCustomerAccountant
    },
    {
      id: 'inventory',
      title: "المخزون",
      description: "متابعة البضائع والكميات",
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "hover:border-amber-200",
      available: false,
      hidden: isCustomerAccountant
    }
  ];

  // Conditional Tools
  if (isCollectionOfficer) {
    mainTools.splice(2, 0, { 
      id: 'collection',
      title: "التحصيل",
      description: "متابعة المتأخرات والديون",
      icon: Gavel,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "hover:border-red-200",
      available: true,
      badge: "Officer"
    });
  }

  // Explicitly add Customer Accounts tool for customer_accountant role
  // (Even though they are redirected, this satisfies the "show ONLY Customer Accounts tab" requirement if they stay)
  if (isCustomerAccountant) {
    mainTools.push({
      id: 'customer_accounts',
      title: "حسابات العملاء",
      description: "لوحة متابعة حسابات وتمويلات العملاء",
      icon: Gavel,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-200",
      available: true
    });
  }

  const adminTools = [
    {
      id: 'team',
      title: "الموظفين",
      description: "إدارة حسابات وصلاحيات الفريق",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "hover:border-purple-200",
      available: true
    },
    {
      id: 'permissions',
      title: "الصلاحيات",
      description: "تخصيص مستويات الوصول",
      icon: ShieldCheck,
      color: "text-slate-600",
      bg: "bg-slate-50",
      border: "hover:border-slate-200",
      available: false
    }
  ];

  const filteredMainTools = mainTools
    .filter(t => !t.hidden)
    .filter(t => t.title.includes(searchQuery));
    
  const filteredAdminTools = adminTools.filter(t => t.title.includes(searchQuery));

  const getToolTitle = (toolId) => {
    if (toolId === 'khazna') return 'الخزنة';
    if (toolId === 'finances') return 'التمويلات';
    if (toolId === 'collection') return 'لوحة التحصيل';
    if (toolId === 'team') return 'إدارة الفريق';
    if (toolId === 'customer_accounts') return 'حسابات العملاء';
    return 'الأدوات';
  };

  // If user is strictly customer_accountant, we return null briefly while redirect happens
  // or show a restricted view if redirect fails/is slow
  if (isCustomerAccountant) {
     // Safety fallback UI
     return (
       <div className="flex items-center justify-center min-h-screen bg-stone-50">
          <p className="text-stone-500">جاري التوجيه إلى لوحة الحسابات...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50 shrink-0">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Right Side: Logo & Breadcrumbs */}
            <div className="flex items-center gap-4">
              <div className="bg-stone-900 text-white p-2.5 rounded-xl shadow-lg shadow-stone-200">
                <LayoutGrid className="w-5 h-5" />
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium">
                <span 
                  onClick={() => setActiveTool(null)}
                  className={`cursor-pointer transition-colors ${activeTool ? 'text-stone-400 hover:text-stone-600' : 'text-stone-800'}`}
                >
                  الرئيسية
                </span>
                {activeTool && (
                  <>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                    <span className="text-stone-800 font-bold">
                      {getToolTitle(activeTool)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Center: Search Bar (Hidden when tool is active) */}
            <AnimatePresence>
              {!activeTool && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="hidden md:flex flex-1 max-w-md mx-8 relative group"
                >
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-stone-400 group-focus-within:text-stone-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pr-11 pl-4 py-2.5 bg-stone-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-stone-200 focus:ring-4 focus:ring-stone-100/50 transition-all placeholder:text-stone-400 font-medium"
                    placeholder="بحث في الأدوات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Left Side: User Profile */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-stone-400 hover:text-stone-600 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-[1px] bg-stone-100 mx-2"></div>
              
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-stone-700">{user?.name}</span>
                  <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">{user?.role || 'Employee'}</span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isAdmin ? 'bg-stone-900 text-white border-stone-700' : 'bg-white text-stone-600 border-stone-100 shadow-sm'}`}>
                   {user?.name?.charAt(0) || 'U'}
                </div>
              </div>

              <Button
                onClick={onLogout}
                variant="ghost"
                size="icon"
                className="text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 w-full mx-auto transition-all duration-300",
        !activeTool ? "max-w-7xl px-4 sm:px-6 lg:px-8 py-8" : "w-full"
      )}>
        <AnimatePresence mode="wait">
          {!activeTool ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <div className="relative rounded-3xl bg-stone-900 text-white p-8 sm:p-12 mb-8">
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
                </div>
                
                <div className="relative z-10 w-full flex flex-col items-center justify-center gap-8">
                   <div className="max-w-2xl text-center w-full">
                     <h2 className="text-3xl sm:text-4xl font-bold mb-4">مرحباً بك، {user?.name} 👋</h2>
                     <p className="text-stone-400 mb-8 text-lg font-medium">ابحث عن حساب للبدء أو قم بإضافة حساب جديد</p>
                     <div className="w-full">
                        <AccountSearchBar />
                     </div>
                   </div>
                </div>
              </div>

              {/* Main Tools Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                   <h3 className="text-xl font-bold text-stone-800">الأدوات الأساسية</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMainTools.map((tool, index) => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool} 
                      onClick={() => handleToolClick(tool.id, tool.available)}
                      index={index}
                      badge={tool.badge}
                    />
                  ))}
                  {filteredMainTools.length === 0 && (
                     <div className="col-span-full py-12 text-center text-stone-400 bg-white rounded-3xl border border-dashed border-stone-200">
                        لا توجد أدوات مطابقة للبحث
                     </div>
                  )}
                </div>
              </section>

              {/* Admin Tools Section */}
              {isAdmin && (
                <section>
                  <div className="flex items-center gap-3 mb-6 mt-8">
                     <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                     <h3 className="text-xl font-bold text-stone-800">إدارة النظام</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAdminTools.map((tool, index) => (
                      <ToolCard 
                        key={tool.id} 
                        tool={tool} 
                        onClick={() => handleToolClick(tool.id, tool.available)}
                        index={index}
                        badge="Admin"
                      />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="tool-content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                 {activeTool === 'khazna' && <KhaznaTool currentUser={user} />}
                 {activeTool === 'finances' && <FinanceTab currentUser={user} />}
                 {activeTool === 'collection' && <CollectionOfficerDashboard />}
                 {activeTool === 'team' && <TeamManagement currentUser={user} />}
                 {/* customer_accounts tool is technically not reachable here due to redirect, but provided for completeness */}
                 {activeTool === 'customer_accounts' && <CollectionOfficerDashboard />}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const ToolCard = ({ tool, onClick, index, badge }) => {
  const Icon = tool.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`
        group relative w-full text-right p-6 rounded-3xl bg-white border border-stone-100 shadow-sm 
        hover:shadow-xl hover:shadow-stone-200/40 hover:-translate-y-1 transition-all duration-300
        ${tool.available ? 'cursor-pointer' : 'cursor-default opacity-80'}
        ${tool.border}
      `}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-2xl ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7" />
        </div>
        
        {badge && (
          <span className="px-3 py-1 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
            {badge}
          </span>
        )}
        
        {!tool.available && (
          <span className="px-3 py-1 bg-stone-100 text-stone-400 text-[10px] font-bold rounded-full">
            قريباً
          </span>
        )}
      </div>
      
      <div className="space-y-2 relative z-10">
        <h3 className="text-lg font-bold text-stone-800 group-hover:text-stone-900 transition-colors">
          {tool.title}
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed font-medium">
          {tool.description}
        </p>
      </div>

      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none ${tool.bg.replace('bg-', 'bg-gradient-to-br from-white to-')}`} />
    </motion.button>
  );
};

export default MainDashboard;
