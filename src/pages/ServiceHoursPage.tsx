import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceHours, useLogServiceHours, useAllServiceHours, useVerifyServiceHours } from '@/hooks/useServiceHours';
import { useMembers } from '@/hooks/useMembers';
import { format } from 'date-fns';
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ServiceHoursPage() {
  const { user, isAdminOrOfficer } = useAuth();
  const { data: myHours = [] } = useServiceHours(user?.id);
  const { data: allHours = [] } = useAllServiceHours();
  const { data: members = [] } = useMembers();
  const logHours = useLogServiceHours();
  const verifyHours = useVerifyServiceHours();
  
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !hours || !description || !serviceDate) return;
    
    logHours.mutate({
      user_id: user.id,
      hours: parseFloat(hours),
      description,
      service_date: serviceDate,
    }, {
      onSuccess: () => {
        setOpen(false);
        setHours('');
        setDescription('');
        setServiceDate('');
      }
    });
  };

  const handleVerify = (id: string) => {
    if (!user?.id) return;
    verifyHours.mutate({ id, verified_by: user.id });
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  const myTotalHours = myHours.reduce((sum, h) => sum + Number(h.hours), 0);
  const myVerifiedHours = myHours.filter(h => h.verified).reduce((sum, h) => sum + Number(h.hours), 0);

  const displayHours = isAdminOrOfficer ? allHours : myHours;

  return (
    <AppLayout>
      <PageHeader 
        title="Service Hours" 
        description="Track and log your volunteer hours"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTotalHours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{myVerifiedHours.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(myTotalHours - myVerifiedHours).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isAdminOrOfficer ? 'All Service Hours' : 'My Service Hours'}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Hours
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Service Hours</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="2.5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Service Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the service activity..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={logHours.isPending}>
                  {logHours.isPending ? 'Logging...' : 'Log Hours'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {isAdminOrOfficer && <TableHead>Member</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                {isAdminOrOfficer && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayHours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdminOrOfficer ? 6 : 4} className="text-center text-muted-foreground">
                    No service hours logged yet
                  </TableCell>
                </TableRow>
              ) : (
                displayHours.map((entry) => (
                  <TableRow key={entry.id}>
                    {isAdminOrOfficer && (
                      <TableCell className="font-medium">
                        {getMemberName(entry.user_id)}
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(entry.service_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{Number(entry.hours).toFixed(1)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell>
                      {entry.verified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    {isAdminOrOfficer && (
                      <TableCell>
                        {!entry.verified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(entry.id)}
                            disabled={verifyHours.isPending}
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    )}
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
