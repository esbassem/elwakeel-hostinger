-- Make sure the essential Accounts Receivable account exists and has the correct type
INSERT INTO public.accounts (name, account_type)
VALUES ('ذمم مدينة عملاء', 'receivable')
ON CONFLICT (name) DO UPDATE SET account_type = 'receivable';

-- Add the missing merchant/bank accounts that appear in the UI dropdown
INSERT INTO public.accounts (name, account_type)
VALUES
    ('شركة عابدين', 'bank'),
    ('معرض ابورجب', 'bank'),
    ('معرض جنو', 'bank'),
    ('احمد مختار كعبيش', 'bank'),
    ('معرض الوكيل', 'bank'),
    ('اخري', 'bank')
ON CONFLICT (name) DO NOTHING;
