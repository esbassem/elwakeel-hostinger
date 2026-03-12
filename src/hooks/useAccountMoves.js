
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';

// Helper function to get account IDs by name
const getAccountIds = async (accountNames) => {
    const { data, error } = await supabase
        .from('account_accounts')
        .select('id, name')
        .in('name', accountNames);

    if (error) {
        console.error('Error fetching account IDs:', error);
        throw new Error('تعذر جلب معرفات الحسابات المحاسبية.');
    }

    const accountIdMap = data.reduce((acc, account) => {
        acc[account.name] = account.id;
        return acc;
    }, {});

    accountNames.forEach(name => {
        if (!accountIdMap[name]) {
            throw new Error(`الحساب "${name}" غير موجود. الرجاء مراجعة شجرة الحسابات.`);
        }
    });

    return accountIdMap;
};


export const useAccountMoves = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const createSaleInvoice = useCallback(async (invoiceData, invoiceLines, payments) => {
        setLoading(true);

        // --- 1. VALIDATIONS ---
        try {
            if (!invoiceData.customer_id) throw new Error("يجب تحديد العميل لحفظ الفاتورة.");
            if (!invoiceLines || invoiceLines.length === 0) throw new Error("الفاتورة يجب أن تحتوي على منتج واحد على الأقل.");
            if (invoiceData.total_amount <= 0) throw new Error("مبلغ الفاتورة الإجمالي يجب أن يكون أكبر من صفر.");

            const linesTotal = invoiceLines.reduce((sum, line) => sum + Number(line.selling_price || 0), 0);
            if (Math.abs(linesTotal - invoiceData.total_amount) > 0.01) {
                throw new Error(`إجمالي سطور الفاتورة (${linesTotal}) لا يساوي إجمالي الفاتورة (${invoiceData.total_amount}).`);
            }
            
            if (payments && payments.length > 0) {
                const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                if (paymentsTotal > invoiceData.total_amount + 0.01) {
                    throw new Error(`إجمالي الدفعات (${paymentsTotal}) أكبر من إجمالي الفاتورة (${invoiceData.total_amount}).`);
                }
                for(const p of payments) {
                    if (Number(p.amount || 0) <= 0) throw new Error("قيمة كل دفعة يجب أن تكون أكبر من صفر.");
                }
            }
        } catch (validationError) {
            toast({ title: "بيانات غير صالحة", description: validationError.message, variant: "destructive" });
            setLoading(false);
            return { success: false, error: validationError.message };
        }

        let sale_move_id = null;
        try {
            const accountIds = await getAccountIds(['ذمم مدينة عملاء', 'إيرادات المبيعات', 'الخزنة']);
            const receivableAccountId = accountIds['ذمم مدينة عملاء'];
            const salesAccountId = accountIds['إيرادات المبيعات'];
            const cashAccountId = accountIds['الخزنة'];

            // --- 2. CREATE INVOICE MOVE ---
            const { data: saleMove, error: saleMoveError } = await supabase
                .from('account_moves').insert({
                    name: `فاتورة بيع - ${new Date().toISOString()}`,
                    move_type: 'sale',
                    partner_id: invoiceData.customer_id,
                    invoice_date: invoiceData.invoice_date,
                    date: new Date().toISOString(),
                    amount_total: invoiceData.total_amount,
                    notes: invoiceData.notes,
                    state: 'posted',
                }).select('id').single();

            if (saleMoveError) throw new Error(`فشل إنشاء قيد الفاتورة: ${saleMoveError.message}`);
            sale_move_id = saleMove.id;

            // --- 3. CREATE INVOICE LINES ---
            const saleMoveLinesPayload = [];
            invoiceLines.forEach(line => {
                saleMoveLinesPayload.push({
                    move_id: sale_move_id,
                    account_id: salesAccountId,
                    debit: 0,
                    credit: line.selling_price,
                    price: line.selling_price, // Price for product line
                    vehicle_id: line.product_id,
                    name: 'بيع مركبة',
                });
            });
            saleMoveLinesPayload.push({
                move_id: sale_move_id,
                account_id: receivableAccountId,
                partner_id: invoiceData.customer_id,
                debit: invoiceData.total_amount,
                credit: 0,
                price: 0, // FIX: Added price=0 for non-product line
                name: 'مديونية العميل',
            });

            const { data: insertedLines, error: linesError } = await supabase
                .from('account_move_lines').insert(saleMoveLinesPayload).select('id, account_id, debit');

            if (linesError) throw new Error(`فشل إنشاء سطور الفاتورة: ${linesError.message}`);
            
            // --- 4. LOCATE RECEIVABLE LINE ---
            const saleReceivableLine = insertedLines.find(l => l.account_id === receivableAccountId && l.debit > 0);
            if (!saleReceivableLine) throw new Error("خطأ حرج: تعذر العثور على سطر ذمم العميل الخاص بالفاتورة.");
            const sale_receivable_line_id = saleReceivableLine.id;
            
            // --- 5. HANDLE PAYMENTS & ALLOCATIONS ---
            if (payments && payments.length > 0) {
                for (const payment of payments) {
                    if (payment.type === 'cash') {
                        const { data: paymentMove, error: paymentMoveError } = await supabase
                            .from('account_moves').insert({
                                name: `Customer Payment - ${new Date().toISOString()}`,
                                move_type: 'payment',
                                partner_id: invoiceData.customer_id,
                                date: new Date().toISOString(),
                                amount_total: payment.amount,
                                notes: payment.description,
                                pay_method: 'cash',
                                state: 'posted',
                            }).select('id').single();
                        
                        if (paymentMoveError) throw new Error(`فشل إنشاء قيد الدفعة النقدية: ${paymentMoveError.message}`);
                        
                        const { data: pLines, error: pLinesError } = await supabase.from('account_move_lines').insert([
                            { move_id: paymentMove.id, account_id: cashAccountId, debit: payment.amount, credit: 0, price: 0, name: 'دفعة نقدية من العميل' }, // FIX: Added price=0
                            { move_id: paymentMove.id, account_id: receivableAccountId, partner_id: invoiceData.customer_id, debit: 0, credit: payment.amount, price: 0, name: 'تسديد على الحساب' } // FIX: Added price=0
                        ]).select('id, account_id, credit');
                            
                        if (pLinesError) throw new Error(`فشل إنشاء سطور الدفعة النقدية: ${pLinesError.message}`);
                        const pReceivableLine = pLines.find(l => l.account_id === receivableAccountId && l.credit > 0);
                        if (!pReceivableLine) throw new Error("خطأ حرج: تعذر العثور على سطر ذمم الدفعة النقدية.");
                        
                        await supabase.from('payment_allocations').insert({
                            payment_move_line_id: pReceivableLine.id,
                            invoice_move_line_id: sale_receivable_line_id,
                            allocated_amount: payment.amount,
                        });

                    } else if (payment.type === 'financing' && payment.original_move_id) {
                        const { data: originalLine, error: findLineError } = await supabase
                            .from('account_move_lines').select('id, credit')
                            .eq('move_id', payment.original_move_id).eq('account_id', receivableAccountId)
                            .eq('partner_id', invoiceData.customer_id).gt('credit', 0).maybeSingle();

                        if (findLineError) throw new Error(`خطأ أثناء البحث عن حركة التمويل الأصلية: ${findLineError.message}`);
                        if (!originalLine) throw new Error('لم يتم العثور على حركة التمويل الأصلية، أو أنها لا تخص هذا العميل.');
                        
                        const { data: existingAllocs, error: existingAllocsError } = await supabase
                            .from('payment_allocations').select('allocated_amount')
                            .eq('payment_move_line_id', originalLine.id);
                        
                        if (existingAllocsError) throw new Error(`فشل جلب التخصيصات السابقة: ${existingAllocsError.message}`);

                        const alreadyAllocated = existingAllocs.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
                        const remainingAvailable = originalLine.credit - alreadyAllocated;

                        if (payment.amount > remainingAvailable + 0.01) {
                            throw new Error(`المبلغ المطلوب (${payment.amount}) أكبر من الرصيد المتاح في الدفعة الأصلية (${remainingAvailable}).`);
                        }
                        
                        const { error: allocError } = await supabase.from('payment_allocations').insert({
                            payment_move_line_id: originalLine.id,
                            invoice_move_line_id: sale_receivable_line_id,
                            allocated_amount: payment.amount,
                            notes: payment.description || 'تخصيص دفعة تمويل سابقة على الفاتورة'
                        });
                        if (allocError) throw new Error(`فشل إنشاء تخصيص دفعة التمويل: ${allocError.message}`);
                    }
                }
            }

            toast({ title: "نجاح", description: `تم إنشاء الفاتورة بنجاح.` });
            setLoading(false);
            return { success: true, sale_move_id };

        } catch (error) {
            console.error("Error during sale invoice creation:", error);
            if (sale_move_id) {
                await supabase.from('account_moves').delete().eq('id', sale_move_id);
            }
            toast({ title: "فشل", description: error.message, variant: "destructive" });
            setLoading(false);
            return { success: false, error: error.message };
        }
    }, [toast]);


    const fetchAllCustomerPaymentsForSelection = useCallback(async (customerId) => {
        if (!customerId) return [];
        try {
            const { data, error } = await supabase
                .from('account_moves').select(`id, notes, pay_method, amount_total`)
                .eq('partner_id', customerId).eq('move_type', 'payment').eq('state', 'posted');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching customer payments:", error.message);
            toast({ title: "خطأ", description: "فشل جلب دفعات العميل المتاحة", variant: "destructive" });
            return [];
        }
    }, [toast]);

    const createCustomerPayment = useCallback(async (paymentData) => {
        console.error("createCustomerPayment is not fully implemented.", paymentData);
        toast({
            title: "وظيفة غير مكتملة",
            description: "منطق إنشاء دفعة تمويل جديدة من الصفر لم يتم تنفيذه بالكامل بعد.",
            variant: "destructive",
        });
        return { success: false, error: "Not Implemented" };
    }, [toast]);

    return {
        loading,
        createSaleInvoice,
        fetchAllCustomerPaymentsForSelection,
        createCustomerPayment,
    };
};
