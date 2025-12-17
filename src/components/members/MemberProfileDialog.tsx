import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, GraduationCap, Linkedin, MapPin, Users, Heart } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useMembers } from '@/hooks/useMembers';

type Profile = Tables<'profiles'>;

interface MemberProfileDialogProps {
  member: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberProfileDialog({ member, open, onOpenChange }: MemberProfileDialogProps) {
  const { data: members } = useMembers();
  
  if (!member) return null;

  const extendedProfile = member as Profile & {
    pledge_class?: string;
    family?: string;
    big?: string;
    little?: string;
    hometown?: string;
  };

  const bigMember = members?.find(m => m.id === extendedProfile.big);
  const littleMember = members?.find(m => m.id === extendedProfile.little);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Member Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {member.first_name?.[0]}{member.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {member.first_name} {member.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={member.status} />
              </div>
              {member.positions && member.positions.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {member.positions.map((pos) => (
                    <Badge key={pos} variant="secondary" className="text-xs">
                      {pos}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${member.email}`} className="hover:underline">
                  {member.email}
                </a>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone}</span>
                </div>
              )}
              {extendedProfile.hometown && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{extendedProfile.hometown}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Academic</h3>
            <div className="space-y-2 text-sm">
              {member.major && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>{member.major}</span>
                </div>
              )}
              {member.graduation_year && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>Class of {member.graduation_year}</span>
                </div>
              )}
            </div>
          </div>

          {/* Chapter Info */}
          {(extendedProfile.pledge_class || extendedProfile.family || bigMember || littleMember) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Chapter</h3>
              <div className="space-y-2 text-sm">
                {extendedProfile.pledge_class && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Pledge Class: {extendedProfile.pledge_class}</span>
                  </div>
                )}
                {extendedProfile.family && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>Family: {extendedProfile.family}</span>
                  </div>
                )}
                {bigMember && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Big:</span>
                    <span>{bigMember.first_name} {bigMember.last_name}</span>
                  </div>
                )}
                {littleMember && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Little:</span>
                    <span>{littleMember.first_name} {littleMember.last_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Committees */}
          {member.committees && member.committees.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Committees</h3>
              <div className="flex gap-1 flex-wrap">
                {member.committees.map((committee) => (
                  <Badge key={committee} variant="outline" className="text-xs">
                    {committee}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn */}
          {member.linkedin_url && (
            <Button asChild variant="outline" className="w-full gap-2">
              <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
                View LinkedIn Profile
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
