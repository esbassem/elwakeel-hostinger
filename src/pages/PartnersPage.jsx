
import { useEffect, useState } from "react";
import { usePartners } from "@/hooks/usePartners";
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

const PartnerForm = ({ partner, onSave, onCancel }) => {
    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: partner || {
            name: '',
            nickname: '',
            phone1: '',
            phone2: '',
            address: '',
            national_id: '',
            email: '',
            birth_date: null,
            job: '',
            job_address: '',
            notes: '',
            account_type: 'customer',
            is_active: true,
            legacy_ref_id: null,
            id_card_front: '',
            id_card_back: '',
            id_card_image: ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" {...register("name", { required: "Name is required" })} />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input id="nickname" {...register("nickname")} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="phone1">Phone 1</Label>
                    <Input id="phone1" {...register("phone1")} />
                </div>
                <div>
                    <Label htmlFor="phone2">Phone 2</Label>
                    <Input id="phone2" {...register("phone2")} />
                </div>
            </div>
             <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="national_id">National ID</Label>
                    <Input id="national_id" {...register("national_id")} />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" {...register("email")} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="birth_date">Birth Date</Label>
                    <Input id="birth_date" type="date" {...register("birth_date")} />
                </div>
                 <div>
                    <Label htmlFor="job">Job</Label>
                    <Input id="job" {...register("job")} />
                </div>
            </div>
            <div>
                <Label htmlFor="job_address">Job Address</Label>
                <Input id="job_address" {...register("job_address")} />
            </div>
            <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register("notes")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="supplier">Supplier</SelectItem>
                                    <SelectItem value="company">Company</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div>
                    <Label htmlFor="legacy_ref_id">Legacy Ref ID</Label>
                    <Input id="legacy_ref_id" type="number" {...register("legacy_ref_id", { valueAsNumber: true })} />
                </div>
            </div>
            <div>
                <Label htmlFor="id_card_front">ID Card Front</Label>
                <Input id="id_card_front" {...register("id_card_front")} />
            </div>
            <div>
                <Label htmlFor="id_card_back">ID Card Back</Label>
                <Input id="id_card_back" {...register("id_card_back")} />
            </div>
            <div>
                <Label htmlFor="id_card_image">ID Card Image</Label>
                <Input id="id_card_image" {...register("id_card_image")} />
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


const PartnersPage = () => {
    const { loading, fetchPartners, createPartner, updatePartner } = usePartners();
    const [partners, setPartners] = useState([]);
    const [filteredPartners, setFilteredPartners] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [editingPartner, setEditingPartner] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const loadPartners = async () => {
            const data = await fetchPartners();
            setPartners(data);
            setFilteredPartners(data);
        };
        loadPartners();
    }, []);

    useEffect(() => {
        let result = partners;
        if (searchTerm) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.phone1 && p.phone1.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (filterType !== 'all') {
            result = result.filter(p => p.account_type === filterType);
        }
        if (filterStatus !== 'all') {
            result = result.filter(p => p.is_active.toString() === filterStatus);
        }
        setFilteredPartners(result);
    }, [searchTerm, filterType, filterStatus, partners]);

    const handleSavePartner = async (data) => {
        if (editingPartner) {
            const updatedPartner = await updatePartner(editingPartner.id, data);
            if (updatedPartner) {
                setPartners(partners.map(p => p.id === updatedPartner.id ? updatedPartner : p));
            }
        } else {
            const newPartner = await createPartner(data);
            if (newPartner) {
                setPartners([...partners, newPartner]);
            }
        }
        setIsFormOpen(false);
        setEditingPartner(null);
    };
    
    const handleToggleActive = async (partner) => {
        const updatedPartner = await updatePartner(partner.id, { is_active: !partner.is_active });
        if (updatedPartner) {
            setPartners(partners.map(p => p.id === updatedPartner.id ? updatedPartner : p));
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Partners</h1>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditingPartner(null); setIsFormOpen(true); }}>Add Partner</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add Partner'}</DialogTitle>
                        </DialogHeader>
                        <PartnerForm
                            partner={editingPartner}
                            onSave={handleSavePartner}
                            onCancel={() => { setIsFormOpen(false); setEditingPartner(null); }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <Input
                    placeholder="Search by name or phone"
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
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                            <TableHead>Name</TableHead>
                            <TableHead>Nickname</TableHead>
                            <TableHead>Phone 1</TableHead>
                            <TableHead>Account Type</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPartners.map(partner => (
                            <TableRow key={partner.id}>
                                <TableCell>{partner.name}</TableCell>
                                <TableCell>{partner.nickname}</TableCell>
                                <TableCell>{partner.phone1}</TableCell>
                                <TableCell>{partner.account_type}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={partner.is_active}
                                        onCheckedChange={() => handleToggleActive(partner)}
                                    />
                                </TableCell>
                                <TableCell>{new Date(partner.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => { setEditingPartner(partner); setIsFormOpen(true); }}>
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

export default PartnersPage;
