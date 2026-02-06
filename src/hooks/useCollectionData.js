
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useCollectionData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedCustomers, setGroupedCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch contracts with all related data needed for accurate metrics
      const { data: contractsData, error: fetchError } = await supabase
        .from('finance_contracts')
        .select(`
          *,
          accounts:beneficiary_account_id (
            id, name, nickname, phone1, phone2, address, national_id
          ),
          finance_installments (
            id,
            installment_number,
            installment_amount,
            installment_date,
            status,
            paid_at,
            total_paid_amount
          ),
          finance_installment_payments (
            id,
            paid_amount,
            payment_date,
            installment_id
          )
        `)
        .eq('status', 'approved');

      if (fetchError) throw fetchError;

      const customersMap = new Map();
      const contractsList = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      contractsData.forEach(contract => {
        const installments = contract.finance_installments || [];
        const payments = contract.finance_installment_payments || [];

        // --- Metric Calculations ---
        
        // 1. Total Paid (Sum of all actual payments linked to this finance)
        const totalPaid = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);

        // 2. Total Contract Amount (Prefer sum of installments for accuracy, else contract total)
        const sumInstallments = installments.reduce((sum, inst) => sum + (Number(inst.installment_amount) || 0), 0);
        const totalAmount = sumInstallments > 0 ? sumInstallments : (Number(contract.total_amount) || 0);

        // 3. Expected Paid (Sum of installments due by today)
        const expectedPaid = installments.reduce((sum, inst) => {
          const d = new Date(inst.installment_date);
          d.setHours(0, 0, 0, 0);
          if (d <= today) {
            return sum + (Number(inst.installment_amount) || 0);
          }
          return sum;
        }, 0);

        // 4. Overdue Amount
        const overdueAmount = Math.max(0, expectedPaid - totalPaid);

        // 5. Remaining Amount
        const totalRemaining = Math.max(0, totalAmount - totalPaid);

        // 6. Counts & Progress (Waterfall allocation logic)
        // Sort installments by date
        const sortedInstallments = [...installments].sort((a, b) => 
          new Date(a.installment_date) - new Date(b.installment_date)
        );

        let remainingCash = totalPaid;
        let paidCount = 0;
        let overdueCountInst = 0;
        let firstUnpaidIndex = -1;

        sortedInstallments.forEach((inst, index) => {
            const amount = Number(inst.installment_amount) || 0;
            const paidForThis = Math.min(remainingCash, amount);
            remainingCash = Math.max(0, remainingCash - paidForThis);
            
            const isFullyPaid = (amount - paidForThis) < 1.0;
            
            if (isFullyPaid) {
                paidCount++;
            } else {
                if (firstUnpaidIndex === -1) firstUnpaidIndex = index;
                
                const d = new Date(inst.installment_date);
                d.setHours(0, 0, 0, 0);
                if (d <= today) {
                    overdueCountInst++;
                }
            }
        });

        const nextDueInstallment = sortedInstallments[firstUnpaidIndex !== -1 ? firstUnpaidIndex : sortedInstallments.length - 1];

        const metrics = {
            totalAmount,
            totalPaid,
            expectedPaid,
            overdueAmount,
            totalRemaining,
            paidCount,
            overdueCountInst,
            totalInstallmentsCount: sortedInstallments.length,
            nextDueDate: nextDueInstallment?.installment_date,
            currentInstallmentNum: firstUnpaidIndex !== -1 ? firstUnpaidIndex + 1 : sortedInstallments.length
        };

        // --- Build Contract Object ---
        const contractObj = {
            ...contract,
            installments: sortedInstallments,
            metrics,
            customerName: contract.accounts?.name,
            customerNickname: contract.accounts?.nickname,
            customerId: contract.accounts?.id
        };
        contractsList.push(contractObj);

        // --- Group by Customer for Table View ---
        if (contract.accounts) {
            const acc = contract.accounts;
            if (!customersMap.has(acc.id)) {
                customersMap.set(acc.id, {
                    id: acc.id,
                    name: acc.name,
                    nickname: acc.nickname,
                    phone: acc.phone1 || acc.phone2,
                    details: acc,
                    totalOverdueAmount: 0,
                    totalOutstandingAmount: 0,
                    overdueCount: 0,
                    installments: []
                });
            }

            const customer = customersMap.get(acc.id);
            
            // Add contract-level totals to customer
            customer.totalOverdueAmount += overdueAmount;
            customer.totalOutstandingAmount += totalRemaining;

            // Add specific overdue installments to customer's list for the detailed table
            // We use the same waterfall logic per installment to determine which ones are *actually* overdue
            // Reset cash for this specific loop
            let custRemainingCash = totalPaid;
            sortedInstallments.forEach(inst => {
                const amount = Number(inst.installment_amount) || 0;
                const paidForThis = Math.min(custRemainingCash, amount);
                custRemainingCash = Math.max(0, custRemainingCash - paidForThis);
                const isPaid = (amount - paidForThis) < 1.0;
                
                if (!isPaid) {
                     const d = new Date(inst.installment_date);
                     d.setHours(0,0,0,0);
                     if (d <= today) {
                         customer.overdueCount++;
                         customer.installments.push({
                             id: inst.id,
                             contractId: contract.id,
                             number: inst.installment_number,
                             amount: amount,
                             paid: paidForThis,
                             remaining: amount - paidForThis,
                             dueDate: inst.installment_date,
                             contractName: contract.finance_name
                         });
                     }
                }
            });
        }
      });

      // Filter and Sort Customers
      const sortedCustomers = Array.from(customersMap.values())
        .filter(c => c.totalOverdueAmount > 0) // Only show customers with overdue amounts in the list
        .sort((a, b) => b.totalOverdueAmount - a.totalOverdueAmount);
      
      // Sort Installments within customers
      sortedCustomers.forEach(c => {
          c.installments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          // Set oldest due date
          if (c.installments.length > 0) {
              c.oldestDueDate = c.installments[0].dueDate;
          }
      });

      // Sort Contracts
      const sortedContracts = contractsList.sort((a, b) => b.metrics.overdueAmount - a.metrics.overdueAmount);

      setGroupedCustomers(sortedCustomers);
      setFilteredCustomers(sortedCustomers);
      setAllContracts(sortedContracts);

    } catch (err) {
      console.error('Error fetching collection data:', err);
      setError(err);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات التحصيل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterData = useCallback((filters) => {
    if (!groupedCustomers) return;
    
    let result = [...groupedCustomers];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) || 
        (c.nickname && c.nickname.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    setFilteredCustomers(result);
  }, [groupedCustomers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    customers: filteredCustomers,
    contracts: allContracts,
    filterData,
    refreshData: fetchData
  };
};
