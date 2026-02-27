import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  FileText, 
  Package, 
  LogOut, 
  ChevronRight, 
  Users, 
  ShieldCheck, 
  Banknote,
  Gavel
} from 'lucide-react';
import TeamManagement from '@/components/TeamManagement';
import FinanceTab from '@/components/FinanceTab';
import CollectionOfficerDashboard from '@/components/CollectionOfficerDashboard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const MainDashboard = ({ user, onLogout }) => {
  const [activeTool, setActiveTool] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'customer_accountant') {
      navigate('/customer-accounts', { replace: true });
      toast({ description: "تم توجيهك إلى لوحة حسابات العملاء." });
    }
  }, [user, navigate, toast]);

  const handleToolClick = (toolId, isAvailable = true) => {
    if (!isAvailable) {
      toast({ title: "قريباً", description: "هذه الأداة قيد التطوير." });
      return;
    }

    if (toolId === 'khazna') {
      navigate('/khazna-v2');
    } else {
      setActiveTool(toolId);
    }
  };
  
  const getToolData = (toolId) => {
      const allTools = [...mainTools, ...adminTools];
      return allTools.find(t => t.id === toolId);
  }

  const isAdmin = user?.role === 'admin';
  const isCollectionOfficer = user?.role === 'collection_officer' || isAdmin;
  const isCustomerAccountant = user?.role === 'customer_accountant';

  const mainTools = [
    { id: 'khazna', title: "الخزنة", description: "إدارة النقدية والمصروفات", icon: Wallet, available: true, hidden: isCustomerAccountant },
    { id: 'finances', title: "التمويلات", description: "إدارة القروض والأقساط", icon: Banknote, available: true, hidden: isCustomerAccountant },
    { id: 'collection', title: "التحصيل", description: "متابعة المتأخرات والديون", icon: Gavel, available: true, hidden: !isCollectionOfficer },
    { id: 'invoices', title: "الفواتير", description: "إنشاء وإدارة الفواتير", icon: FileText, available: false, hidden: isCustomerAccountant },
    { id: 'inventory', title: "المخزون", description: "متابعة البضائع والكميات", icon: Package, available: false, hidden: isCustomerAccountant },
  ];

  const adminTools = [
    { id: 'team', title: "الموظفين", description: "إدارة حسابات وصلاحيات الفريق", icon: Users, available: true },
    { id: 'permissions', title: "الصلاحيات", description: "تخصيص مستويات الوصول", icon: ShieldCheck, available: false },
  ];

  const filteredMainTools = mainTools.filter(t => !t.hidden);
  const filteredAdminTools = adminTools.filter(t => !t.hidden);

  if (isCustomerAccountant) {
    return <div className="flex items-center justify-center min-h-screen"><p>جاري التوجيه...</p></div>;
  }

  if (activeTool) {
    const toolData = getToolData(activeTool);
    const toolMap = {
      finances: <FinanceTab currentUser={user} />,
      collection: <CollectionOfficerDashboard />,
      team: <TeamManagement currentUser={user} />,
    };
    
    return (
       <motion.div key={activeTool} initial={{opacity: 0, scale: 0.98}} animate={{opacity: 1, scale: 1}} className="bg-background min-h-screen">
         <header className="flex items-center justify-between p-2.5 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setActiveTool(null)} className="rounded-full">
                    <ChevronRight className="w-6 h-6" />
                </Button>
                <div className="p-2 bg-secondary rounded-full">
                   {toolData && <toolData.icon className="w-5 h-5 text-foreground" />}
                </div>
            </div>
           <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">{toolData?.title}</h1>
           <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full">
                <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
         </header>
         <main className="p-4 sm:p-6">
            {toolMap[activeTool]}
         </main>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
        <div className="w-full flex justify-end items-center p-4">
            <Button variant="ghost" size="icon" onClick={onLogout} title="تسجيل الخروج" className="rounded-full">
                <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
        </div>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="px-2 py-8 sm:py-12">
                <h1 className="text-3xl text-muted-foreground">مرحباً بك،</h1>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">{user?.name}</h2>
            </div>
            
            <section className="pt-6">
              <h2 className="text-base font-semibold text-muted-foreground pb-3 px-2">الأدوات الأساسية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMainTools.map((tool) => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onClick={() => handleToolClick(tool.id, tool.available)}
                  />
                ))}
              </div>
            </section>

            {isAdmin && (
              <section className="mt-8">
                <h2 className="text-base font-semibold text-muted-foreground pb-3 px-2">إدارة النظام</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAdminTools.map((tool) => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool} 
                      onClick={() => handleToolClick(tool.id, tool.available)}
                    />
                  ))}
                </div>
              </section>
            )}

          </motion.div>
      </main>
    </div>
  );
};

const ToolCard = ({ tool, onClick }) => {
  const Icon = tool.icon;
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl transition-all border bg-secondary",
        {
          'opacity-60 cursor-default': !tool.available,
          'cursor-pointer hover:border-primary': tool.available 
        }
      )}
    >
      <div className="p-5 flex items-center gap-5">
        <Icon className="w-7 h-7 text-primary flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-base text-foreground mb-1">{tool.title}</h3>
          <p className="text-sm text-muted-foreground hidden sm:block sm:line-clamp-1">
            {tool.description}
          </p>
        </div>
        {tool.available ? (
          <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
        ) : (
          <span className="text-xs font-semibold text-muted-foreground/80">قريباً</span>
        )}
      </div>
    </div>
  );
};

export default MainDashboard;
