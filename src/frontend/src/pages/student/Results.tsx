import type {
  Exam as BackendExam,
  PerformanceRecord,
  Submission,
} from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, ChevronRight, ClipboardList, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_TOOLTIP_STYLE = {
  background: "oklch(0.18 0.014 260)",
  border: "1px solid oklch(0.28 0.02 260)",
  borderRadius: "8px",
  color: "oklch(0.95 0.01 260)",
  fontSize: "12px",
  padding: "8px 12px",
};

function ScoreComparison({ ai, final }: { ai?: number; final?: number }) {
  if (final === undefined)
    return <span className="text-sm text-muted-foreground">Pending</span>;
  const diff = (final ?? 0) - (ai ?? 0);
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm font-semibold text-foreground">
        {final}%
      </span>
      {diff !== 0 && ai !== undefined && (
        <span
          className={`text-[10px] font-medium ${diff > 0 ? "text-chart-3" : "text-destructive"}`}
        >
          ({diff > 0 ? "+" : ""}
          {diff} override)
        </span>
      )}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export default function StudentResults() {
  const { backend, isReady } = useBackend();

  const {
    data: submissions,
    isLoading: loadingSubs,
    error: subsError,
  } = useQuery<Submission[]>({
    queryKey: ["student-submissions"],
    queryFn: async () => {
      if (!backend) return [];
      return backend.getMySubmissions();
    },
    enabled: isReady,
    refetchInterval: 10_000,
  });

  const { data: performance, isLoading: loadingPerf } = useQuery<
    PerformanceRecord[]
  >({
    queryKey: ["student-performance"],
    queryFn: async () => {
      if (!backend) return [];
      return backend.getPerformanceHistory();
    },
    enabled: isReady,
  });

  // Also fetch exams to get titles
  const { data: exams } = useQuery<BackendExam[]>({
    queryKey: ["student-assigned-exams"],
    queryFn: async () => {
      if (!backend) return [];
      return backend.getAssignedExams();
    },
    enabled: isReady,
  });

  const examMap = new Map((exams ?? []).map((e) => [String(e.examId), e]));

  const gradedSubs = (submissions ?? []).filter(
    (s) =>
      s.aiScore !== undefined ||
      s.status === "graded" ||
      s.status === "submitted",
  );

  const avgScore =
    gradedSubs.length > 0
      ? Math.round(
          gradedSubs.reduce((sum, s) => sum + (s.aiScore ?? 0), 0) /
            gradedSubs.length,
        )
      : 0;

  const bestScore =
    gradedSubs.length > 0
      ? Math.max(...gradedSubs.map((s) => s.aiScore ?? 0))
      : 0;

  const chartData = (performance ?? [])
    .sort((a, b) => Number(a.submittedAt) - Number(b.submittedAt))
    .map((rec) => ({
      name:
        rec.examTitle.length > 12
          ? `${rec.examTitle.slice(0, 12)}…`
          : rec.examTitle,
      score: rec.finalScore ?? 0,
    }));

  const isLoading = loadingSubs || loadingPerf;

  return (
    <AppLayout title="My Results">
      <div className="space-y-8 p-6 md:p-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            My Results
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-generated scores and teacher feedback
          </p>
        </div>

        {subsError && (
          <div
            data-ocid="student.results.error_state"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive"
          >
            Failed to load results. Please try refreshing.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            data-ocid="student.results.avg.card"
            label="My Average"
            value={isLoading ? "—" : `${avgScore}%`}
            icon={Award}
          />
          <StatCard
            data-ocid="student.results.exams.card"
            label="Exams Taken"
            value={isLoading ? "—" : gradedSubs.length}
            icon={ClipboardList}
          />
          <StatCard
            data-ocid="student.results.best.card"
            label="Best Score"
            value={isLoading ? "—" : `${bestScore}%`}
            icon={TrendingUp}
          />
          <StatCard
            data-ocid="student.results.pass.card"
            label="Pass Rate"
            value={
              isLoading || gradedSubs.length === 0
                ? "—"
                : (`${Math.round((gradedSubs.filter((s) => (s.aiScore ?? 0) >= 60).length / gradedSubs.length) * 100)}%` as string)
            }
            icon={Award}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Performance chart */}
          <Card
            data-ocid="student.results.chart.card"
            className="border-border bg-card"
          >
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-base font-semibold">
                Score History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPerf ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : chartData.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No performance data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="scoreGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="oklch(0.65 0.18 270)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="oklch(0.65 0.18 270)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.28 0.02 260)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      cursor={{
                        stroke: "oklch(0.65 0.18 270)",
                        strokeWidth: 1,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="oklch(0.65 0.18 270)"
                      strokeWidth={2}
                      fill="url(#scoreGrad)"
                      dot={{
                        fill: "oklch(0.65 0.18 270)",
                        r: 3,
                        strokeWidth: 0,
                      }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Results list */}
          <div
            className="lg:col-span-2 space-y-4"
            data-ocid="student.results.list"
          >
            {isLoading ? (
              <>
                <ResultSkeleton />
                <ResultSkeleton />
                <ResultSkeleton />
              </>
            ) : gradedSubs.length === 0 ? (
              <EmptyState
                data-ocid="student.results.empty_state"
                icon={ClipboardList}
                title="No results yet"
                description="Complete an exam to see your AI-graded results here."
              />
            ) : (
              gradedSubs.map((sub, i) => {
                const exam = examMap.get(String(sub.examId));
                const hasFeedback = sub.aiFeedback && sub.aiFeedback.length > 0;
                return (
                  <div
                    key={String(sub.submissionId)}
                    data-ocid={`student.results.item.${i + 1}`}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-semibold text-foreground truncate">
                          {exam?.title ?? `Exam #${String(sub.examId)}`}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Submitted{" "}
                          {new Date(
                            Number(sub.submittedAt) / 1_000_000,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={sub.status as string} />
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-4">
                      {sub.aiScore !== undefined && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                            AI Score
                          </p>
                          <span className="font-mono text-sm text-muted-foreground">
                            {sub.aiScore}%
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          Final
                        </p>
                        <ScoreComparison ai={sub.aiScore} final={undefined} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                          Feedback
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            hasFeedback
                              ? "bg-chart-3/20 text-chart-3 border-chart-3/30 text-[10px]"
                              : "bg-muted text-muted-foreground border-border text-[10px]"
                          }
                        >
                          {hasFeedback ? "Available" : "Pending"}
                        </Badge>
                      </div>
                    </div>

                    {hasFeedback && sub.aiFeedback[0] && (
                      <div className="rounded-lg bg-secondary/50 px-3 py-2.5 mb-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-primary/10 text-primary border-primary/30"
                          >
                            AI Feedback
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {sub.aiFeedback[0].feedback}
                        </p>
                      </div>
                    )}

                    <Link
                      to="/student/results/$submissionId"
                      params={{ submissionId: String(sub.submissionId) }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
                        data-ocid={`student.results.view_detail.${i + 1}`}
                      >
                        View full feedback report
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
