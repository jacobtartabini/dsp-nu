import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAllDues, useRecordDues, useDeleteDues } from '@/hooks/useDues';
import { useMembers } from '@/hooks/useMembers';
import { format } from 'date-fns';
import { Plus, DollarSign, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function DuesPage() {
  const { user, isAdminOrOfficer } = useAuth();
  const { data: allDues = [] } = useAllDues();
  const { data: members = [] } = useMembers();
  const recordDues = useRecordDues();
  const deleteDues = useDeleteDues();
  
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [semester, setSemester] = useState('');
  const [notes, setNotes] = useState('');

  if (!isAdminOrOfficer) {
    return (
      <AppLayout>
        <PageHeader title="Dues Management" description="Access restricted" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Only officers and admins can access dues management.
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedMember || !amount || !semester) return;
    
    recordDues.mutate({
      user_id: selectedMember,
      amount: parseFloat(amount),
      semester,
      notes: notes || undefined,
      created_by: user.id,
    }, {
      onSuccess: () => {
        setOpen(false);
        setSelectedMember('');
        setAmount('');
        setSemester('');
        setNotes('');
      }
    });
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  // Get current semester suggestion
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const suggestedSemester = currentMonth < 6 
    ? `Spring ${currentYear}` 
    : `Fall ${currentYear}`;

  // Calculate stats
  const totalCollected = allDues.reduce((sum, d) => sum + Number(d.amount), 0);
  const paidMemberIds = new Set(allDues.map(d => d.user_id));
  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <AppLayout>
      <PageHeader 
        title="Dues Management" 
        description="Track and record member dues payments"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCollected.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidMemberIds.size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Dues Payments
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Dues Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Member</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter(m => m.status === 'active' || m.status === 'new_mem' || m.status === 'shiny')
                        .map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder={suggestedSemester}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment method, etc."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={recordDues.isPending}>
                  {recordDues.isPending ? 'Recording...' : 'Record Payment'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No dues payments recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                allDues.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {getMemberName(payment.user_id)}
                    </TableCell>
                    <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>{payment.semester}</TableCell>
                    <TableCell>
                      {format(new Date(payment.paid_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this dues payment record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteDues.mutate(payment.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
