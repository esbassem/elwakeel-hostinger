
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
        setLoading(true);
        try {
            // 1. Get all payment moves for the customer
            const { data: moves, error: movesError } = await supabase
                .from('account_moves')
                .select('id, notes, pay_method, amount_total, attachment_image')
                .eq('partner_id', customerId)
                .eq('move_type', 'payment')
                .eq('state', 'posted')
                .order('id', { ascending: false });

            if (movesError) throw new Error(`فشل جلب قيود الدفعات: ${movesError.message}`);
            if (!moves || moves.length === 0) return [];

            const moveIds = moves.map(m => m.id);

            // 2. Get all debit lines for these moves
            const { data: lines, error: linesError } = await supabase
                .from('account_move_lines')
                .select('move_id, account_id')
                .in('move_id', moveIds)
                .gt('debit', 0);

            if (linesError) throw new Error(`فشل جلب سطور الدفعات: ${linesError.message}`);
            if (!lines || lines.length === 0) {
                 return moves.map(move => ({...move, merchant_account: 'غير محدد'}));
            }

            const accountIds = [...new Set(lines.map(l => l.account_id))];

            // 3. Get account names
            const { data: accounts, error: accountsError } = await supabase
                .from('account_accounts')
                .select('id, name')
                .in('id', accountIds);
                
            if (accountsError) throw new Error(`فشل جلب أسماء الحسابات: ${accountsError.message}`);

            const accountNamesById = accounts.reduce((acc, account) => {
                acc[account.id] = account.name;
                return acc;
            }, {});

            // 4. Map merchant account name to each move
            const merchantAccountByMoveId = lines.reduce((acc, line) => {
                acc[line.move_id] = accountNamesById[line.account_id];
                return acc; 
            }, {});

            // 5. Combine all data
            const formattedData = moves.map(move => ({
                ...move,
                merchant_account: merchantAccountByMoveId[move.id] || 'غير محدد',
            }));

            return formattedData;

        } catch (error) {
            console.error("Error fetching customer payments:", error.message);
            toast({ title: "خطأ", description: error.message || "فشل جلب دفعات العميل المتاحة", variant: "destructive" });
            return [];
        } finally {
            setLoading(false);
        }
    }, [toast, setLoading]);


    const createCustomerPayment = useCallback(async (paymentData) => {
        setLoading(true);
        let move_id = null;
        let attachmentImageUrl = null;

        try {
            // 1. Validation
            if (!paymentData.partner_id || !paymentData.amount || !paymentData.pay_method || !paymentData.mpatner_id) {
                throw new Error("البيانات الأساسية للدفع غير مكتملة (العميل، المبلغ، طريقة الدفع، حساب التاجر).");
            }
            if (Number(paymentData.amount) <= 0) {
                throw new Error("مبلغ الدفعة يجب أن يكون أكبر من صفر.");
            }

            // 2. Handle File Upload
            if (paymentData.attach_img) {
                const file = paymentData.attach_img;
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${paymentData.partner_id}/finance_${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('account-id-cards')
                    .upload(filePath, file);

                if (uploadError) {
                    throw new Error(`فشل رفع المرفق: ${uploadError.message}`);
                }
                
                const { data: urlData } = supabase.storage
                    .from('account-id-cards')
                    .getPublicUrl(filePath);

                attachmentImageUrl = urlData.publicUrl;
            }

            // 3. Get Account IDs
            const requiredAccounts = ['ذمم مدينة عملاء', paymentData.mpatner_id];
            const accountIds = await getAccountIds(requiredAccounts);
            const receivableAccountId = accountIds['ذمم مدينة عملاء'];
            const merchantAccountId = accountIds[paymentData.mpatner_id];

            // 4. Create Main Account Move
            const { data: move, error: moveError } = await supabase
                .from('account_moves')
                .insert({
                    name: `دفعة تمويل - ${paymentData.pay_method}`,
                    move_type: 'payment',
                    partner_id: paymentData.partner_id,
                    date: new Date().toISOString(),
                    amount_total: paymentData.amount,
                    notes: paymentData.notes,
                    pay_method: paymentData.pay_method,
                    state: 'posted',
                    attachment_image: attachmentImageUrl,
                })
                .select('id')
                .single();

            if (moveError) {
                console.error("Error creating payment move:", moveError);
                throw new Error(`فشل إنشاء قيد الدفعة الرئيسي: ${moveError.message}`);
            }
            move_id = move.id;

            // 5. Create Move Lines
            const moveLinesPayload = [
                {
                    move_id: move_id,
                    account_id: merchantAccountId,
                    partner_id: paymentData.partner_id, 
                    debit: paymentData.amount,
                    credit: 0,
                    price: 0,
                    name: `إيداع تمويل ${paymentData.pay_method} للعميل`,
                },
                {
                    move_id: move_id,
                    account_id: receivableAccountId,
                    partner_id: paymentData.partner_id,
                    debit: 0,
                    credit: paymentData.amount,
                    price: 0,
                    name: `دفعة من ${paymentData.pay_method}`,
                },
            ];

            const { error: linesError } = await supabase
                .from('account_move_lines')
                .insert(moveLinesPayload);

            if (linesError) {
                console.error("Error creating payment move lines:", linesError);
                throw new Error(`فشل إنشاء سطور قيد الدفعة: ${linesError.message}`);
            }
            
            toast({
                title: "تم بنجاح",
                description: "تم تسجيل دفعة التمويل بنجاح.",
                className: "bg-green-50 border-green-200"
            });
            setLoading(false);
            return { success: true, error: null };

        } catch (error) {
            console.error("Full error in createCustomerPayment:", error);

            if (move_id) {
                await supabase.from('account_moves').delete().eq('id', move_id);
            }

            toast({
                title: "فشل",
                description: error.message || "حدث خطأ غير متوقع أثناء حفظ الدفعة.",
                variant: "destructive"
            });
            setLoading(false);
            return { success: false, error: error.message };
        }
    }, [toast, setLoading]);
    
    const addPaymentsToInvoice = useCallback(async (invoiceId, payments) => {
    setLoading(true);
    let createdPaymentMoveIds = [];

    try {
        // --- 1. VALIDATIONS ---
        if (!invoiceId) throw new Error("يجب تحديد الفاتورة.");
        if (!payments || payments.length === 0) throw new Error("يجب إضافة دفعة واحدة على الأقل.");

        const { data: invoice, error: invoiceError } = await supabase
            .from('account_moves')
            .select('partner_id, amount_total')
            .eq('id', invoiceId)
            .single();
        
        if (invoiceError || !invoice) throw new Error("الفاتورة المستهدفة غير موجودة.");

        const { partner_id: customer_id, amount_total: totalInvoiceAmount } = invoice;
        
        for(const p of payments) {
            if (Number(p.amount || 0) <= 0) throw new Error("قيمة كل دفعة يجب أن تكون أكبر من صفر.");
        }

        // --- 2. GET ACCOUNTS & INVOICE RECEIVABLE LINE ---
        const accountIds = await getAccountIds(['ذمم مدينة عملاء', 'الخزنة']);
        const receivableAccountId = accountIds['ذمم مدينة عملاء'];
        const cashAccountId = accountIds['الخزنة'];

        const { data: saleReceivableLine, error: lineError } = await supabase
            .from('account_move_lines')
            .select('id')
            .eq('move_id', invoiceId)
            .eq('account_id', receivableAccountId)
            .gt('debit', 0)
            .single();

        if (lineError || !saleReceivableLine) throw new Error("خطأ حرج: تعذر العثور على سطر ذمم العميل الخاص بالفاتورة.");
        const sale_receivable_line_id = saleReceivableLine.id;

        // --- 3. HANDLE PAYMENTS & ALLOCATIONS ---
        for (const payment of payments) {
            if (payment.type === 'cash') {
                const { data: paymentMove, error: paymentMoveError } = await supabase
                    .from('account_moves').insert({
                        name: `Customer Payment - ${new Date().toISOString()}`,
                        move_type: 'payment',
                        partner_id: customer_id,
                        date: new Date().toISOString(),
                        amount_total: payment.amount,
                        notes: payment.description,
                        pay_method: 'cash',
                        state: 'posted',
                    }).select('id').single();
                
                if (paymentMoveError) throw new Error(`فشل إنشاء قيد الدفعة النقدية: ${paymentMoveError.message}`);
                createdPaymentMoveIds.push(paymentMove.id);
                
                const { data: pLines, error: pLinesError } = await supabase.from('account_move_lines').insert([
                    { move_id: paymentMove.id, account_id: cashAccountId, debit: payment.amount, credit: 0, price: 0, name: 'دفعة نقدية من العميل' },
                    { move_id: paymentMove.id, account_id: receivableAccountId, partner_id: customer_id, debit: 0, credit: payment.amount, price: 0, name: 'تسديد على الحساب' }
                ]).select('id, account_id, credit');
                    
                if (pLinesError) throw new Error(`فشل إنشاء سطور الدفعة النقدية: ${pLinesError.message}`);
                
                const pReceivableLine = pLines.find(l => l.account_id === receivableAccountId && l.credit > 0);
                if (!pReceivableLine) throw new Error("خطأ حرج: تعذر العثور على سطر ذمم الدفعة النقدية.");
                
                const { error: allocError } = await supabase.from('payment_allocations').insert({
                    payment_move_line_id: pReceivableLine.id,
                    invoice_move_line_id: sale_receivable_line_id,
                    allocated_amount: payment.amount,
                });

                if (allocError) throw new Error(`فشل ربط الدفعة النقدية بالفاتورة: ${allocError.message}`);

            } else if (payment.type === 'financing' && payment.original_move_id) {
                const { data: originalLine, error: findLineError } = await supabase
                    .from('account_move_lines').select('id, credit')
                    .eq('move_id', payment.original_move_id)
                    .eq('account_id', receivableAccountId)
                    .eq('partner_id', customer_id)
                    .gt('credit', 0)
                    .maybeSingle();

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
                    notes: payment.description || 'تخصيص دفعة تمويل على فاتورة قائمة'
                });
                if (allocError) throw new Error(`فشل إنشاء تخصيص دفعة التمويل: ${allocError.message}`);
            }
        }

        toast({ title: "نجاح", description: "تم تسجيل الدفعات بنجاح." });
        setLoading(false);
        return { success: true };

    } catch (error) {
        console.error("Error during adding payments to invoice:", error);
        
        if (createdPaymentMoveIds.length > 0) {
            await supabase.from('account_moves').delete().in('id', createdPaymentMoveIds);
        }
        
        toast({ title: "فشل", description: error.message, variant: "destructive" });
        setLoading(false);
        return { success: false, error: error.message };
    }
}, [toast]);


    return {
        loading,
        createSaleInvoice,
        fetchAllCustomerPaymentsForSelection,
        createCustomerPayment,
        addPaymentsToInvoice
    };
};
