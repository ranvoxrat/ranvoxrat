import { ExamStatus as ExamStatusEnum } from "@/backend";
import type { ExamStatus, SubmissionStatus } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  TrendingUp,
} from "lucide-react";

function getStatusString(status: ExamStatus): string {
  if (status === ExamStatusEnum.published) return "published";
  if (status === ExamStatusEnum.closed) return "closed";
  return "draft";
}

function timeAgo(ts: bigint): string {
  const diffMs = Date.now() - Number(ts);
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default function TeacherDashboard() {
  const { userProfile } = useAuth();
  const { backend, isReady } = useBackend();

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => backend!.getExams(),
    enabled: isReady,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => backend!.getClasses(),
    enabled: isReady,
  });

  const isLoading = examsLoading || classesLoading;
  const activeExams = exams.filter(
    (e) => e.status === ExamStatusEnum.published,
  );
  const recentExams = [...exams]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 3);

  return (
    <AppLayout title="Teacher Dashboard">
      <div className="space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Welcome back,{" "}
              <span className="text-primary">
                {userProfile?.name?.split(" ").slice(-1)[0] ?? "Professor"}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeExams.length} active exams · {classes.length} classes
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="gap-2">
              <Link
                to="/teacher/exams"
                data-ocid="teacher.dashboard.create_exam_button"
              >
                <Plus className="h-4 w-4" />
                Create Exam
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            data-ocid="teacher.stats.classes.card"
            label="My Classes"
            value={isLoading ? "—" : classes.length}
            icon={BookOpen}
            loading={isLoading}
          />
          <StatCard
            data-ocid="teacher.stats.exams.card"
            label="Total Exams"
            value={isLoading ? "—" : exams.length}
            icon={FileText}
            loading={isLoading}
          />
          <StatCard
            data-ocid="teacher.stats.active.card"
            label="Active Exams"
            value={isLoading ? "—" : activeExams.length}
            icon={Award}
            loading={isLoading}
          />
          <StatCard
            data-ocid="teacher.stats.classes_size.card"
            label="Total Classes"
            value={isLoading ? "—" : classes.length}
            icon={Clock}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent exams */}
          <Card
            data-ocid="teacher.recent_exams.card"
            className="lg:col-span-2 border-border bg-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Recent Exams
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                >
                  <Link to="/teacher/exams">View all</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </>
              ) : recentExams.length === 0 ? (
                <div
                  data-ocid="teacher.recent_exams.empty_state"
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No exams yet.{" "}
                  <Link
                    to="/teacher/exams"
                    className="text-primary hover:underline"
                  >
                    Create your first exam →
                  </Link>
                </div>
              ) : (
                recentExams.map((exam, i) => {
                  const statusStr = getStatusString(exam.status);
                  return (
                    <div
                      key={String(exam.examId)}
                      data-ocid={`teacher.recent_exams.item.${i + 1}`}
                      className="rounded-lg border border-border bg-background/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {exam.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exam.questions.length} questions ·{" "}
                            {exam.durationMinutes
                              ? `${exam.durationMinutes} min`
                              : "No duration set"}
                          </p>
                        </div>
                        <StatusBadge status={statusStr} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            statusStr === "closed"
                              ? 100
                              : statusStr === "published"
                                ? 60
                                : 0
                          }
                          className="h-1.5 flex-1"
                        />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {timeAgo(exam.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card
            data-ocid="teacher.quick_links.card"
            className="border-border bg-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "Manage Classes",
                  to: "/teacher/classes",
                  icon: BookOpen,
                  ocid: "teacher.quick_links.classes_button",
                },
                {
                  label: "Create Exam",
                  to: "/teacher/exams",
                  icon: FileText,
                  ocid: "teacher.quick_links.exams_button",
                },
                {
                  label: "View Analytics",
                  to: "/teacher/analytics",
                  icon: TrendingUp,
                  ocid: "teacher.quick_links.analytics_button",
                },
                {
                  label: "Review Submissions",
                  to: "/teacher/submissions",
                  icon: Award,
                  ocid: "teacher.quick_links.submissions_button",
                },
              ].map(({ label, to, icon: Icon, ocid }) => (
                <Button
                  key={to}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Link to={to} data-ocid={ocid}>
                    <Icon className="h-4 w-4 text-primary/70" />
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Classes overview */}
        {classes.length > 0 && (
          <Card
            data-ocid="teacher.classes_overview.card"
            className="border-border bg-card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  My Classes
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                >
                  <Link to="/teacher/classes">Manage</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {classes.slice(0, 4).map((cls, i) => (
                  <div
                    key={String(cls.classId)}
                    data-ocid={`teacher.classes_overview.item.${i + 1}`}
                    className="rounded-lg border border-border bg-background/50 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                          {cls.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {cls.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cls.studentIds.length} students
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
