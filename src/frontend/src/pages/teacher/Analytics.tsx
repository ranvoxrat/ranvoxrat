import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BarChart2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_STYLE = {
  background: "oklch(0.18 0.014 260)",
  border: "1px solid oklch(0.28 0.02 260)",
  borderRadius: "8px",
  color: "oklch(0.95 0.01 260)",
  fontSize: "12px",
  padding: "8px 12px",
};

export default function TeacherAnalytics() {
  const { backend, isReady } = useBackend();
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => backend!.getClasses(),
    enabled: isReady,
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => backend!.getExams(),
    enabled: isReady,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["class-analytics", selectedClassId],
    queryFn: () => backend!.getClassAnalytics(BigInt(selectedClassId)),
    enabled: isReady && !!selectedClassId,
  });

  // Filter exams to selected class
  const classExams = selectedClassId
    ? exams.filter((e) => String(e.classId) === selectedClassId)
    : exams;

  // Chart data from exams
  const chartData = classExams.slice(0, 8).map((exam) => ({
    name: exam.title.length > 14 ? `${exam.title.slice(0, 14)}…` : exam.title,
    avg: analytics?.averageScore ?? 0,
  }));

  const isLoading = classesLoading || examsLoading;

  const totalStudents = classes.reduce((s, c) => s + c.studentIds.length, 0);
  const avgScore = analytics?.averageScore ?? 0;
  const topStudents = analytics?.topStudents ?? [];
  const failingStudents = analytics?.failingStudents ?? [];

  return (
    <AppLayout title="Analytics">
      <div className="space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Performance insights across your classes
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger data-ocid="teacher.analytics.class_select">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={String(c.classId)} value={String(c.classId)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            data-ocid="teacher.analytics.students.card"
            label="Total Students"
            value={isLoading ? "—" : totalStudents}
            icon={Users}
            loading={isLoading}
          />
          <StatCard
            data-ocid="teacher.analytics.avg.card"
            label="Avg Score"
            value={
              analyticsLoading
                ? "—"
                : selectedClassId
                  ? `${avgScore.toFixed(1)}%`
                  : "—"
            }
            icon={Award}
            loading={analyticsLoading && !!selectedClassId}
          />
          <StatCard
            data-ocid="teacher.analytics.exams.card"
            label="Total Exams"
            value={isLoading ? "—" : classExams.length}
            icon={BarChart2}
            loading={isLoading}
          />
          <StatCard
            data-ocid="teacher.analytics.classes.card"
            label="Classes"
            value={isLoading ? "—" : classes.length}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Exam averages bar chart */}
          <Card
            data-ocid="teacher.analytics.exam_averages.card"
            className="border-border bg-card"
          >
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Exam Score Averages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full rounded-lg" />
              ) : chartData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
                  No exam data for this class
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.28 0.02 260)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "oklch(0.55 0.01 260)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={CHART_STYLE}
                      cursor={{ fill: "oklch(0.22 0.02 260)" }}
                    />
                    <Bar
                      dataKey="avg"
                      fill="oklch(0.65 0.18 270)"
                      radius={[3, 3, 0, 0]}
                      name="Avg Score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Exam comparison table */}
          <Card
            data-ocid="teacher.analytics.exam_table.card"
            className="border-border bg-card"
          >
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-base font-semibold">
                Exam Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-8 w-full rounded" />
                  ))}
                </div>
              ) : classExams.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No exams available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-display uppercase tracking-wider">
                        Exam
                      </TableHead>
                      <TableHead className="text-xs font-display uppercase tracking-wider text-right">
                        Questions
                      </TableHead>
                      <TableHead className="text-xs font-display uppercase tracking-wider text-right">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classExams.slice(0, 6).map((exam, i) => (
                      <TableRow
                        key={String(exam.examId)}
                        data-ocid={`teacher.analytics.exam_table.item.${i + 1}`}
                        className="border-border"
                      >
                        <TableCell className="py-2">
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">
                            {exam.title}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {exam.questions.length}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize border-border text-muted-foreground"
                          >
                            {String(exam.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedClassId && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top 5 students */}
            <Card
              data-ocid="teacher.analytics.top_students.card"
              className="border-border bg-card"
            >
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-chart-3" />
                  Top 5 Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <Skeleton key={n} className="h-10 w-full rounded" />
                    ))}
                  </div>
                ) : topStudents.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No data yet"
                    description="Grade some submissions to see top performers."
                    className="py-8"
                  />
                ) : (
                  <div className="space-y-3">
                    {topStudents.slice(0, 5).map(([userId, score], i) => (
                      <div
                        key={userId.toText()}
                        data-ocid={`teacher.analytics.top_students.item.${i + 1}`}
                        className="flex items-center gap-3"
                      >
                        <span className="w-5 text-center font-mono text-xs text-muted-foreground shrink-0">
                          {i + 1}
                        </span>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-chart-3/20 text-chart-3 text-[10px] font-bold">
                            {userId.toText().slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-mono text-xs text-foreground truncate">
                              {userId.toText().slice(0, 16)}…
                            </p>
                            <span className="font-mono text-sm font-semibold text-chart-3 shrink-0 ml-2">
                              {score.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-chart-3"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom 5 students */}
            <Card
              data-ocid="teacher.analytics.failing_students.card"
              className="border-border bg-card"
            >
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-base font-semibold flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <Skeleton key={n} className="h-10 w-full rounded" />
                    ))}
                  </div>
                ) : failingStudents.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No data yet"
                    description="All students are performing well or no grades yet."
                    className="py-8"
                  />
                ) : (
                  <div className="space-y-3">
                    {failingStudents.slice(0, 5).map(([userId, score], i) => (
                      <div
                        key={userId.toText()}
                        data-ocid={`teacher.analytics.failing_students.item.${i + 1}`}
                        className="flex items-center gap-3"
                      >
                        <span className="w-5 text-center font-mono text-xs text-muted-foreground shrink-0">
                          {i + 1}
                        </span>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-destructive/20 text-destructive text-[10px] font-bold">
                            {userId.toText().slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-mono text-xs text-foreground truncate">
                              {userId.toText().slice(0, 16)}…
                            </p>
                            <span className="font-mono text-sm font-semibold text-destructive shrink-0 ml-2">
                              {score.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-destructive"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
