import { useState } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Progress } from '@/components/ui/progress';
import { Award, Download, TrendingUp, Vote, Users, CheckCircle, XCircle, LayoutDashboard, Clock, Plus, DollarSign, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMembers, useMemberPoints } from '@/hooks/useMembers';
import { useAuth } from '@/contexts/AuthContext';
import { exportToCSV } from '@/lib/csv';
import { GrantPointsDialog } from '@/components/points/GrantPointsDialog';
import { useEOPCandidates, useMyVotes, useVoteCounts } from '@/hooks/useEOP';
import { EOPCandidateForm } from '@/components/eop/EOPCandidateForm';
import { EOPCandidateCard } from '@/components/eop/EOPCandidateCard';
import { useServiceHours, useLogServiceHours, useAllServiceHours, useVerifyServiceHours } from '@/hooks/useServiceHours';
import { useAllDues, useRecordDues } from '@/hooks/useDues';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categories = ['chapter', 'rush', 'fundraising', 'service', 'brotherhood', 'professionalism', 'dei'] as const;

export default function ChapterPage() {
  const { user, isAdminOrOfficer } = useAuth();
  const { data: members } = useMembers();
  const { data: myPoints } = useMemberPoints(user?.id ?? '');
  const { data: candidates } = useEOPCandidates();
  const { data: myVotes } = useMyVotes();
  const { data: voteCounts } = useVoteCounts();
  const { data: myHours = [] } = useServiceHours(user?.id);
  const { data: allHours = [] } = useAllServiceHours();
  const verifyHours = useVerifyServiceHours();
  const logHours = useLogServiceHours();
  const { data: allDues = [] } = useAllDues();
  const recordDues = useRecordDues();

  const [activeTab, setActiveTab] = useState('standing');
  const [logHoursOpen, setLogHoursOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [duesOpen, setDuesOpen] = useState(false);
  const [duesUserId, setDuesUserId] = useState('');
  const [duesAmount, setDuesAmount] = useState('');
  const [duesSemester, setDuesSemester] = useState('');
  const [duesNotes, setDuesNotes] = useState('');

  // Fetch all points for leaderboard
  const { data: allPoints } = useQuery({
    queryKey: ['all-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // EOP - only show if there are open voting candidates
  const openVoting = candidates?.filter(c => c.voting_open) || [];
  const hasActiveEOP = openVoting.length > 0;

  const getMyVote = (candidateId: string) => {
    return myVotes?.find(v => v.candidate_id === candidateId)?.vote;
  };

  // Calculate totals by member
  const memberTotals = members?.map(member => {
    const memberPoints = allPoints?.filter(p => p.user_id === member.user_id) ?? [];
    const total = memberPoints.reduce((sum, p) => sum + p.points, 0);
    const byCategory = memberPoints.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.points;
      return acc;
    }, {} as Record<string, number>);
    
    return { member, total, byCategory };
  }).sort((a, b) => b.total - a.total) ?? [];

  // My totals
  const myTotal = myPoints?.reduce((sum, p) => sum + p.points, 0) ?? 0;
  const myByCategory = myPoints?.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.points;
    return acc;
  }, {} as Record<string, number>) ?? {};

  // Service hours stats
  const myTotalHours = myHours.reduce((sum, h) => sum + Number(h.hours), 0);
  const myVerifiedHours = myHours.filter(h => h.verified).reduce((sum, h) => sum + Number(h.hours), 0);

  const getMemberName = (userId: string) => {
    const member = members?.find(m => m.user_id === userId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  const handleExportPoints = () => {
    if (!memberTotals) return;
    const exportData = memberTotals.map(({ member, total, byCategory }) => ({
      'First Name': member.first_name,
      'Last Name': member.last_name,
      Email: member.email,
      'Total Points': total,
      Chapter: byCategory.chapter || 0,
      Rush: byCategory.rush || 0,
      Fundraising: byCategory.fundraising || 0,
      Service: byCategory.service || 0,
      Brotherhood: byCategory.brotherhood || 0,
      Professionalism: byCategory.professionalism || 0,
      'DE&I': byCategory.dei || 0,
    }));
    exportToCSV(exportData, 'points-report');
  };

  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !hours || !description || !serviceDate) return;
    
    logHours.mutate({
      user_id: user.id,
      hours: parseFloat(hours),
      description,
      service_date: serviceDate,
    }, {
      onSuccess: () => {
        setLogHoursOpen(false);
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

  const handleRecordDues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !duesUserId || !duesAmount || !duesSemester) return;
    
    recordDues.mutate({
      user_id: duesUserId,
      amount: parseFloat(duesAmount),
      semester: duesSemester,
      notes: duesNotes || undefined,
      created_by: user.id,
    }, {
      onSuccess: () => {
        setDuesOpen(false);
        setDuesUserId('');
        setDuesAmount('');
        setDuesSemester('');
        setDuesNotes('');
      }
    });
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Chapter" 
        description="Member standing, accountability, and governance"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="standing" className="gap-2">
            <Award className="h-4 w-4" />
            Standing
          </TabsTrigger>
          {hasActiveEOP && (
            <TabsTrigger value="eop" className="gap-2">
              <Vote className="h-4 w-4" />
              EOP Voting
            </TabsTrigger>
          )}
          {isAdminOrOfficer && (
            <TabsTrigger value="admin" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        {/* Standing Tab - Points & Service Hours Overview */}
        <TabsContent value="standing" className="space-y-6">
          {/* My Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  My Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{myTotal}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Service Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{myTotalHours.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">{myVerifiedHours.toFixed(1)} verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {(myTotalHours - myVerifiedHours).toFixed(1)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-center h-full">
                <Dialog open={logHoursOpen} onOpenChange={setLogHoursOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Service Hours
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Service Hours</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLogHours} className="space-y-4">
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
              </CardContent>
            </Card>
          </div>

          {/* Points by Category */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Points Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                  {categories.map(cat => (
                    <div key={cat} className="space-y-1 text-center">
                      <CategoryBadge category={cat} />
                      <div className="text-xl font-semibold">{myByCategory[cat] || 0}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Points History */}
          {myPoints && myPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Points</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myPoints.slice(0, 5).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(entry.created_at), 'MMM d')}
                        </TableCell>
                        <TableCell>
                          <CategoryBadge category={entry.category} />
                        </TableCell>
                        <TableCell>{entry.reason}</TableCell>
                        <TableCell className="text-right font-medium">
                          <Badge variant={entry.points > 0 ? 'default' : 'destructive'}>
                            {entry.points > 0 ? '+' : ''}{entry.points}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Chapter Leaderboard
              </CardTitle>
              {isAdminOrOfficer && (
                <Button variant="outline" size="sm" onClick={handleExportPoints} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {memberTotals.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No points yet"
                  description="Points will appear here as members earn them."
                />
              ) : (
                <div className="space-y-3">
                  {memberTotals.slice(0, 10).map(({ member, total }, index) => {
                    const maxPoints = memberTotals[0]?.total || 1;
                    return (
                      <div key={member.id} className="flex items-center gap-4">
                        <div className="w-8 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback>
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {member.first_name} {member.last_name}
                          </div>
                          <Progress value={(total / maxPoints) * 100} className="h-2 mt-1" />
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {total} pts
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EOP Voting Tab - Only visible when active */}
        {hasActiveEOP && (
          <TabsContent value="eop" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="grid gap-4 md:grid-cols-2 flex-1 mr-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Vote className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{openVoting.length}</p>
                      <p className="text-sm text-muted-foreground">Open for Voting</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{myVotes?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Your Votes Cast</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {isAdminOrOfficer && <EOPCandidateForm />}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openVoting.map((candidate) => (
                <EOPCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  myVote={getMyVote(candidate.id)}
                  voteCounts={isAdminOrOfficer ? voteCounts?.[candidate.id] : undefined}
                  isOfficer={isAdminOrOfficer}
                />
              ))}
            </div>
          </TabsContent>
        )}

        {/* Admin Tab - Only for admins/officers */}
        {isAdminOrOfficer && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <GrantPointsDialog />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Dialog open={duesOpen} onOpenChange={setDuesOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2">
                        <DollarSign className="h-4 w-4" />
                        Record Dues Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Dues Payment</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRecordDues} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="member">Member</Label>
                          <Select value={duesUserId} onValueChange={setDuesUserId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                              {members?.map((member) => (
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
                            value={duesAmount}
                            onChange={(e) => setDuesAmount(e.target.value)}
                            placeholder="100.00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="semester">Semester</Label>
                          <Input
                            id="semester"
                            value={duesSemester}
                            onChange={(e) => setDuesSemester(e.target.value)}
                            placeholder="Fall 2024"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            value={duesNotes}
                            onChange={(e) => setDuesNotes(e.target.value)}
                            placeholder="Payment notes..."
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={recordDues.isPending}>
                          {recordDues.isPending ? 'Recording...' : 'Record Payment'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <EOPCandidateForm />
                </CardContent>
              </Card>
            </div>

            {/* Pending Service Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Service Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allHours.filter(h => !h.verified).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No pending service hours
                        </TableCell>
                      </TableRow>
                    ) : (
                      allHours.filter(h => !h.verified).map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {getMemberName(entry.user_id)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.service_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>{Number(entry.hours).toFixed(1)}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(entry.id)}
                              disabled={verifyHours.isPending}
                            >
                              Verify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Dues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Recent Dues Payments
                </CardTitle>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No dues payments recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      allDues.slice(0, 10).map((payment) => (
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </AppLayout>
  );
}
