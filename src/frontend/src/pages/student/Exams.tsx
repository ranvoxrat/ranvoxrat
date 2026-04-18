import type { Exam as BackendExam, ExamStatus } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  ListChecks,
} from "lucide-react";

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(ts: bigint): number {
  const now = Date.now();
  const examDate = Number(ts) / 1_000_000;
  return Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
}

function ExamCardSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

function UpcomingExamCard({
  exam,
  index,
}: { exam: BackendExam; index: number }) {
  const days = exam.scheduledAt ? daysUntil(exam.scheduledAt) : null;
  const isUrgent = days !== null && days <= 1;

  return (
    <Card
      data-ocid={`student.upcoming.item.${index + 1}`}
      className="border-border bg-card group hover:border-primary/40 transition-smooth"
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <StatusBadge status={exam.status as string} />
          {isUrgent && (
            <Badge
              className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]"
              variant="outline"
            >
              {days === 0 ? "Today" : "Tomorrow"}
            </Badge>
          )}
        </div>
        <h3 className="mb-1 font-display text-sm font-semibold text-foreground leading-snug">
          {exam.title}
        </h3>
        {exam.description && (
          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
            {exam.description}
          </p>
        )}
        <div className="mb-4 space-y-1.5">
          {exam.scheduledAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {formatDate(exam.scheduledAt)} at {formatTime(exam.scheduledAt)}
              </span>
            </div>
          )}
          {exam.durationMinutes && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{Number(exam.durationMinutes)} min</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ListChecks className="h-3 w-3 shrink-0" />
            <span>{exam.questions.length} questions</span>
          </div>
        </div>
        <Link
          to="/student/exam/$examId"
          params={{ examId: String(exam.examId) }}
        >
          <Button
            size="sm"
            className="w-full gap-1.5 font-semibold"
            data-ocid={`student.upcoming.begin.${index + 1}`}
          >
            Begin Examination
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function PastExamRow({ exam, index }: { exam: BackendExam; index: number }) {
  return (
    <div
      data-ocid={`student.past.item.${index + 1}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-smooth"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <CheckCircle2 className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">
          {exam.title}
        </p>
        {exam.scheduledAt && (
          <p className="text-xs text-muted-foreground">
            {formatDate(exam.scheduledAt)}
          </p>
        )}
      </div>
      <StatusBadge status={exam.status as string} />
      <Link to="/student/exam/$examId" params={{ examId: String(exam.examId) }}>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          data-ocid={`student.past.view.${index + 1}`}
          aria-label="View exam"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

export default function StudentExams() {
  const { userProfile } = useAuth();
  const { backend, isReady } = useBackend();

  const {
    data: exams,
    isLoading,
    error,
  } = useQuery<BackendExam[]>({
    queryKey: ["student-assigned-exams"],
    queryFn: async () => {
      if (!backend) return [];
      return backend.getAssignedExams();
    },
    enabled: isReady,
  });

  const upcoming = (exams ?? []).filter(
    (e) => e.status === ("published" as ExamStatus),
  );
  const past = (exams ?? []).filter(
    (e) => e.status === ("closed" as ExamStatus),
  );

  return (
    <AppLayout title="My Exams">
      <div className="space-y-8 p-6 md:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Hello, {userProfile?.name?.split(" ")[0] ?? "Student"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading your exams…"
              : `You have ${upcoming.length} upcoming exam${upcoming.length !== 1 ? "s" : ""}.`}
          </p>
        </div>

        {error && (
          <div
            data-ocid="student.exams.error_state"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive"
          >
            Failed to load exams. Please try refreshing.
          </div>
        )}

        <Tabs defaultValue="upcoming" data-ocid="student.exams.tabs">
          <TabsList className="mb-6 bg-secondary/60">
            <TabsTrigger
              value="upcoming"
              data-ocid="student.exams.upcoming.tab"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Upcoming
              {upcoming.length > 0 && (
                <Badge
                  className="ml-2 bg-primary/20 text-primary border-primary/30 text-[10px]"
                  variant="outline"
                >
                  {upcoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="past"
              data-ocid="student.exams.past.tab"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Past Exams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <ExamCardSkeleton key={n} />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <EmptyState
                data-ocid="student.upcoming.empty_state"
                icon={GraduationCap}
                title="No upcoming exams"
                description="You're all caught up! New exams will appear here once your teacher publishes them."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((exam, i) => (
                  <UpcomingExamCard
                    key={String(exam.examId)}
                    exam={exam}
                    index={i}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {isLoading ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : past.length === 0 ? (
              <EmptyState
                data-ocid="student.past.empty_state"
                icon={CheckCircle2}
                title="No completed exams yet"
                description="Exams you've completed will appear here."
              />
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                {past.map((exam, i) => (
                  <PastExamRow
                    key={String(exam.examId)}
                    exam={exam}
                    index={i}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
