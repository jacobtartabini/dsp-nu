import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, CalendarCheck, CheckCircle2, Users } from 'lucide-react';
import { useCoffeeChats } from '@/hooks/useCoffeeChats';
import { useMembers } from '@/hooks/useMembers';

const REQUIRED_CHATS = 50;

export function CoffeeChatDashboard() {
  const { data: allChats, isLoading } = useCoffeeChats();
  const { data: members } = useMembers();

  const newMembers = useMemo(() => {
    return members?.filter(m => m.status === 'new_member') || [];
  }, [members]);

  const memberStats = useMemo(() => {
    if (!allChats || !newMembers.length) return [];

    return newMembers.map(member => {
      const memberChats = allChats.filter(
        c => c.initiator_id === member.user_id || c.partner_id === member.user_id
      );

      const emailed = memberChats.filter(c => c.status === 'emailed').length;
      const scheduled = memberChats.filter(c => c.status === 'scheduled').length;
      const completed = memberChats.filter(c => c.status === 'completed').length;
      const total = memberChats.length;
      const progress = Math.round((completed / REQUIRED_CHATS) * 100);

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        pledgeClass: member.pledge_class,
        emailed,
        scheduled,
        completed,
        total,
        progress: Math.min(progress, 100),
      };
    }).sort((a, b) => b.completed - a.completed);
  }, [allChats, newMembers]);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>;
  }

  const totalCompleted = memberStats.reduce((sum, m) => sum + m.completed, 0);
  const totalScheduled = memberStats.reduce((sum, m) => sum + m.scheduled, 0);
  const totalEmailed = memberStats.reduce((sum, m) => sum + m.emailed, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{newMembers.length}</p>
              <p className="text-xs text-muted-foreground">New Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEmailed}</p>
              <p className="text-xs text-muted-foreground">Emailed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalScheduled}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Member Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Member Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {memberStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No new members found</p>
          ) : (
            <div className="space-y-4">
              {memberStats.map(member => (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      {member.pledgeClass && (
                        <p className="text-xs text-muted-foreground">{member.pledgeClass}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-600 border-blue-200 text-[10px] px-1.5">
                        <Mail className="h-3 w-3 mr-0.5" />{member.emailed}
                      </Badge>
                      <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px] px-1.5">
                        <CalendarCheck className="h-3 w-3 mr-0.5" />{member.scheduled}
                      </Badge>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px] px-1.5">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" />{member.completed}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={member.progress} className="flex-1 h-2" />
                    <span className="text-xs font-medium text-muted-foreground w-16 text-right">
                      {member.completed}/{REQUIRED_CHATS}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
