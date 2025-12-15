import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Search } from 'lucide-react';
import { useJobs, useJobBookmarks } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { JobForm } from '@/components/jobs/JobForm';
import { JobCard } from '@/components/jobs/JobCard';

const jobTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
];

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { data: jobs, isLoading } = useJobs();
  const { user, isAdminOrOfficer } = useAuth();
  const { bookmarks, toggleBookmark } = useJobBookmarks(user?.id ?? '');

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase()) ||
      job.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || job.job_type === typeFilter;
    
    return matchesSearch && matchesType;
  }) ?? [];

  const bookmarkedJobs = filteredJobs.filter(job => bookmarks.includes(job.id));
  const allJobs = filteredJobs;

  return (
    <AppLayout>
      <PageHeader title="Job Board" description="Internships and job opportunities">
        {isAdminOrOfficer && <JobForm />}
      </PageHeader>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {jobTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading jobs...</div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Jobs ({allJobs.length})</TabsTrigger>
              <TabsTrigger value="bookmarked">Saved ({bookmarkedJobs.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {allJobs.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No job postings"
                  description="Job and internship opportunities will appear here."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {allJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isBookmarked={bookmarks.includes(job.id)}
                      onToggleBookmark={() => toggleBookmark(job.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="bookmarked" className="mt-4">
              {bookmarkedJobs.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No saved jobs"
                  description="Bookmark jobs to save them for later."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {bookmarkedJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isBookmarked={true}
                      onToggleBookmark={() => toggleBookmark(job.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
