import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChapterSetting } from '@/hooks/useChapterSettings';
import { useMyPaddleSubmission, useSubmitPaddle } from '@/hooks/usePaddleSubmissions';

export function PaddleSubmissionCard() {
  const { user } = useAuth();
  const { data: visible, isLoading: settingLoading } = useChapterSetting('paddle_submissions_visible');
  const { data: existing, isLoading: subLoading } = useMyPaddleSubmission();
  const submitPaddle = useSubmitPaddle();

  const [subjectName, setSubjectName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  if (settingLoading || !visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subjectName.trim() || !linkUrl.trim()) return;
    submitPaddle.mutate({
      user_id: user.id,
      subject_name: subjectName.trim(),
      link_url: linkUrl.trim(),
    });
  };

  if (subLoading) return null;

  if (existing) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Paddle Submission
            <Badge variant="secondary" className="ml-auto gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />Submitted
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Video of <span className="font-medium text-foreground">{existing.subject_name}</span>
          </p>
          <a
            href={existing.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
          >
            View submission <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Paddle Submission
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs">Who is the video of?</Label>
            <Input
              id="subject"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link" className="text-xs">Video Link</Label>
            <Input
              id="link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={submitPaddle.isPending}>
            {submitPaddle.isPending ? 'Submitting...' : 'Submit Paddle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
