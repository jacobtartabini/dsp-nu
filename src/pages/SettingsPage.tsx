import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProfileEditDialog } from '@/components/members/ProfileEditDialog';
import { useMemberByUserId } from '@/hooks/useMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function SettingsPage() {
  const { profile, roles, user } = useAuth();
  const { data: fullProfile } = useMemberByUserId(user?.id || '');

  return (
    <AppLayout>
      <PageHeader title="Settings" description="Manage your account" />
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {fullProfile && <ProfileEditDialog profile={fullProfile} />}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <div className="flex gap-2 mt-1">
                  {profile?.status && <StatusBadge status={profile.status} />}
                  {roles.map(role => (
                    <span key={role} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ThemeToggle />
      </div>
    </AppLayout>
  );
}
