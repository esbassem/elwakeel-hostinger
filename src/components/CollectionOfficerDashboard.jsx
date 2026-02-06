import React, { useState } from 'react';
import { Search, Filter, Users, FileText, ChevronDown, Check } from 'lucide-react';
import { useCollectionData } from '@/hooks/useCollectionData';
import CollectionClientsList from './CollectionClientsList';
import CollectionCustomerModal from './CollectionCustomerModal';
import FinanceDetailsModal from './FinanceDetailsModal';
import OverdueAmountsSummary from './OverdueAmountsSummary';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

const CollectionOfficerDashboard = ({ currentUser }) => {
  const { loading, error, customers, contracts, filterData, refreshData } = useCollectionData();
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [selectedFinanceId, setSelectedFinanceId] = useState(null);

  // View state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('customers'); // 'customers' | 'finance_accounts'

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterData({ search: term });
  };

  const handleItemClick = (item) => {
    // Determine which modal to open based on the clicked item type
    if (item.contractId && (viewMode === 'finance_accounts' || item.type === 'contract_card')) {
      // Open Finance Details directly if clicking a contract card
      setSelectedFinanceId(item.contractId);
      setFinanceModalOpen(true);
    } else {
      // Open Customer Modal if clicking a customer row or fallback
      // Find full customer object if we only have partial data
      const targetId = item.customerId || item.id;
      const customerObj = customers.find(c => c.id === targetId);
      
      if (customerObj) {
        setSelectedCustomer(customerObj);
        setModalOpen(true);
      } else if (item.customerId) {
         // Fallback if customer not found in main list (e.g. filtered out) but we have ID
         // Ideally we would fetch it, but for now we try to use what we have
         setSelectedCustomer(item); // Item might be partial
         setModalOpen(true);
      }
    }
  };

  const currentCount = viewMode === 'customers' ? (customers?.length || 0) : (contracts?.length || 0);

  return (
    <div className="min-h-screen bg-slate-50/50 p-2 lg:p-4 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          
          {/* RIGHT COLUMN: Summary Card */}
          <div className="lg:col-span-1 space-y-3">
            <OverdueAmountsSummary
              viewMode={viewMode}
              customers={customers || []}
              contracts={contracts || []}
            />

          </div>

          {/* LEFT COLUMN: Main Content Area */}
          <div className="lg:col-span-2 space-y-3">
             
             {/* Header Toolbar */}
             <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-2 items-center sticky top-2 z-20">
                
                {/* Title & View Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 hover:bg-slate-50 border border-transparent hover:border-slate-200">
                        {viewMode === 'customers' ? (
                            <><Users className="w-4 h-4 text-indigo-600" /><span className="text-sm font-bold text-slate-700">العملاء</span></>
                        ) : (
                            <><FileText className="w-4 h-4 text-indigo-600" /><span className="text-sm font-bold text-slate-700">حسابات التمويل</span></>
                        )}
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56" dir="rtl">
                      <DropdownMenuItem 
                        onClick={() => setViewMode('customers')}
                        className="flex items-center gap-2 cursor-pointer p-2"
                      >
                        <div className={`p-1 rounded ${viewMode === 'customers' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                           <Users className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">عرض حسب العملاء</span>
                            <span className="text-[10px] text-slate-400">قائمة المتأخرات المجمعة</span>
                        </div>
                        {viewMode === 'customers' && <Check className="w-3 h-3 mr-auto text-indigo-600" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setViewMode('finance_accounts')}
                        className="flex items-center gap-2 cursor-pointer p-2"
                      >
                         <div className={`p-1 rounded ${viewMode === 'finance_accounts' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                           <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">حسابات التمويل</span>
                            <span className="text-[10px] text-slate-400">عرض بطاقات العقود</span>
                        </div>
                        {viewMode === 'finance_accounts' && <Check className="w-3 h-3 mr-auto text-indigo-600" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {!loading && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                        {currentCount}
                      </span>
                  )}
                </div>

                <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />

                {/* Search Input */}
                <div className="relative flex-1 w-full">
                   <div className="absolute right-2 top-0 bottom-0 flex items-center justify-center pointer-events-none z-10">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                   </div>
                   <Input 
                     placeholder={viewMode === 'customers' ? "بحث باسم العميل..." : "بحث برقم العقد..."}
                     className="w-full h-8 pr-8 pl-2 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-md text-xs text-right transition-all"
                     value={searchTerm}
                     onChange={handleSearch}
                   />
                </div>

                {/* Filter Dropdown */}
                <div className="w-full sm:w-[110px]">
                   <Select defaultValue="all">
                      <SelectTrigger className="h-8 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-md text-right text-xs" dir="rtl">
                         <div className="flex items-center gap-1.5 text-slate-600">
                             <Filter className="w-3 h-3" />
                             <SelectValue placeholder="الكل" />
                         </div>
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                         <SelectItem value="all">الكل</SelectItem>
                         <SelectItem value="overdue">متأخرات</SelectItem>
                         <SelectItem value="warning">إنذارات</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>

             {/* Dynamic Content List */}
             <div className="min-h-[400px]">
                <CollectionClientsList 
                  customers={customers} 
                  contracts={contracts}
                  loading={loading} 
                  onCustomerSelect={handleItemClick}
                  viewMode={viewMode}
                />
             </div>
          </div>

        </div>
      </div>

      {/* Detail Modal (Customer) */}
      <CollectionCustomerModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={selectedCustomer}
      />

      {/* Detail Modal (Finance) */}
      <FinanceDetailsModal 
        isOpen={financeModalOpen}
        onClose={() => setFinanceModalOpen(false)}
        financeId={selectedFinanceId}
        currentUser={currentUser}
      />

    </div>
  );
};

export default CollectionOfficerDashboard;