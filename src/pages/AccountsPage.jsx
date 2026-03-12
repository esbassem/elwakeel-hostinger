
import { useEffect, useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useForm, Controller } from "react-hook-form";

const AccountForm = ({ account, accounts, onSave, onCancel }) => {
    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: account || {
            code: '',
            name: '',
            parent_id: null,
            account_type: 'asset',
            notes: '',
            is_active: true
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" {...register("code", { required: "Code is required" })} />
                {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
            </div>
            <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name", { required: "Name is required" })} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
                <Label htmlFor="parent_id">Parent Account</Label>
                <Controller
                    name="parent_id"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a parent account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>None</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            <div>
                <Label htmlFor="account_type">Account Type</Label>
                 <Controller
                    name="account_type"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asset">Asset</SelectItem>
                                <SelectItem value="liability">Liability</SelectItem>
                                <SelectItem value="equity">Equity</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register("notes")} />
            </div>
            <div className="flex items-center space-x-2">
                <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                         <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
                <Label htmlFor="is_active">Active</Label>
            </div>
            <DialogFooter>
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            </DialogFooter>
        </form>
    );
};


const AccountsPage = () => {
    const { loading, fetchAccounts, createAccount, updateAccount } = useAccounts();
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [editingAccount, setEditingAccount] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const loadAccounts = async () => {
            const data = await fetchAccounts();
            setAccounts(data);
            setFilteredAccounts(data);
        };
        loadAccounts();
    }, []);

    useEffect(() => {
        let result = accounts;
        if (searchTerm) {
            result = result.filter(acc =>
                acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterType !== 'all') {
            result = result.filter(acc => acc.account_type === filterType);
        }
        if (filterStatus !== 'all') {
            result = result.filter(acc => acc.is_active.toString() === filterStatus);
        }
        setFilteredAccounts(result);
    }, [searchTerm, filterType, filterStatus, accounts]);

    const handleSaveAccount = async (data) => {
        if (editingAccount) {
            const updatedAccount = await updateAccount(editingAccount.id, data);
            if (updatedAccount) {
                setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
            }
        } else {
            const newAccount = await createAccount(data);
            if (newAccount) {
                setAccounts([...accounts, newAccount]);
            }
        }
        setIsFormOpen(false);
        setEditingAccount(null);
    };
    
    const handleToggleActive = async (account) => {
        const updatedAccount = await updateAccount(account.id, { is_active: !account.is_active });
        if (updatedAccount) {
            setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Accounts</h1>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditingAccount(null); setIsFormOpen(true); }}>Add Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
                        </DialogHeader>
                        <AccountForm
                            account={editingAccount}
                            accounts={accounts}
                            onSave={handleSaveAccount}
                            onCancel={() => { setIsFormOpen(false); setEditingAccount(null); }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Input
                    placeholder="Search by name or code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {loading ? <p>Loading...</p> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Parent Account</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAccounts.map(account => {
                             const parentAccount = accounts.find(acc => acc.id === account.parent_id);
                             return (
                                <TableRow key={account.id}>
                                    <TableCell>{account.code}</TableCell>
                                    <TableCell>{account.name}</TableCell>
                                    <TableCell>{account.account_type}</TableCell>
                                    <TableCell>{parentAccount ? parentAccount.name : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={account.is_active}
                                            onCheckedChange={() => handleToggleActive(account)}
                                        />
                                    </TableCell>
                                    <TableCell>{account.notes}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => { setEditingAccount(account); setIsFormOpen(true); }}>
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                             );
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

export default AccountsPage;
