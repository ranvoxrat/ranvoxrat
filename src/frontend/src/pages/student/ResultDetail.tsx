import type {
  Exam as BackendExam,
  QuestionFeedback,
  Result,
  Submission,
} from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  MessageSquare,
  Star,
  User,
} from "lucide-react";
import { useState } from "react";

function ScoreDonut({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-chart-3"
      : score >= 75
        ? "text-primary"
        : score >= 60
          ? "text-chart-2"
          : "text-destructive";
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display text-4xl font-bold tabular-nums ${color}`}>
        {score}
      </span>
      <span className="text-sm text-muted-foreground">/ 100</span>
    </div>
  );
}

function FeedbackBand({
  score,
  maxScore,
}: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const color =
    pct >= 90
      ? "bg-chart-3"
      : pct >= 75
        ? "bg-primary"
        : pct >= 60
          ? "bg-chart-2"
          : "bg-destructive";
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary">
      <div
        className={`h-1.5 rounded-full transition-smooth ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function QuestionFeedbackCard({
  qfb,
  questionText,
  studentAnswer,
  index,
}: {
  qfb: QuestionFeedback;
  questionText?: string;
  studentAnswer?: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 3);

  return (
    <Card
      data-ocid={`result.question.item.${index + 1}`}
      className="border-border bg-card"
    >
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex w-full items-start justify-between gap-3 text-left"
          data-ocid={`result.question.toggle.${index + 1}`}
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary mt-0.5">
              {index + 1}
            </span>
            <p className="text-sm font-semibold text-foreground leading-relaxed">
              {questionText ?? `Question ${index + 1}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-sm font-bold text-foreground">
              {qfb.score}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {studentAnswer && (
            <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Your Answer
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {studentAnswer}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Bot className="h-3 w-3 text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-primary/80 font-medium">
                AI Feedback
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {qfb.feedback}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ResultDetail() {
  const { submissionId } = useParams({
    from: "/student/results/$submissionId",
  });
  const { backend, isReady } = useBackend();

  const {
    data: submission,
    isLoading: loadingSub,
    error: subError,
  } = useQuery<Submission | null>({
    queryKey: ["submission-detail", submissionId],
    queryFn: async () => {
      if (!backend) return null;
      const subs = await backend.getMySubmissions();
      return subs.find((s) => String(s.submissionId) === submissionId) ?? null;
    },
    enabled: isReady && !!submissionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      return data.status === "submitted" || data.status === "grading"
        ? 8_000
        : false;
    },
  });

  const { data: result, isLoading: loadingResult } = useQuery<Result | null>({
    queryKey: ["submission-result", submissionId],
    queryFn: async () => {
      if (!backend || !submission) return null;
      return backend.getSubmissionResult(submission.submissionId);
    },
    enabled: isReady && !!submission,
  });

  const { data: exam } = useQuery<BackendExam | null>({
    queryKey: ["exam-detail", submission ? String(submission.examId) : ""],
    queryFn: async () => {
      if (!backend || !submission) return null;
      return backend.getExamDetail(submission.examId);
    },
    enabled: isReady && !!submission,
  });

  const isLoading = loadingSub || loadingResult;

  if (isLoading) {
    return (
      <AppLayout title="Loading Result…">
        <div className="mx-auto max-w-3xl space-y-4 p-6 md:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (subError || !submission) {
    return (
      <AppLayout title="Result Not Found">
        <div
          data-ocid="result.error_state"
          className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8"
        >
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            This result could not be found.
          </p>
          <Link to="/student/results">
            <Button variant="outline" data-ocid="result.error.back_button">
              Back to Results
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const questionMap = new Map(
    (exam?.questions ?? []).map((q) => [String(q.questionId), q]),
  );
  const answerMap = new Map(
    (submission.textAnswers ?? []).map((a) => [String(a.questionId), a.text]),
  );

  const hasFeedback = submission.aiFeedback && submission.aiFeedback.length > 0;
  const isGrading =
    submission.status === "submitted" || submission.status === "grading";
  const displayScore = result?.finalScore ?? submission.aiScore;
  const isOverridden =
    result !== null &&
    result !== undefined &&
    result.overriddenBy !== undefined;

  return (
    <AppLayout title="Feedback Report">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        {/* Back nav */}
        <div className="flex items-center gap-3">
          <Link to="/student/results">
            <Button
              variant="ghost"
              size="icon"
              data-ocid="result.back_button"
              aria-label="Back to results"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {exam?.title ?? "Exam Result"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Submitted{" "}
              {new Date(
                Number(submission.submittedAt) / 1_000_000,
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Grading in progress */}
        {isGrading && (
          <div
            data-ocid="result.grading.loading_state"
            className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div>
              <p className="text-sm font-medium text-foreground">
                AI grading in progress
              </p>
              <p className="text-xs text-muted-foreground">
                This page refreshes automatically. Your score will appear here
                shortly.
              </p>
            </div>
          </div>
        )}

        {/* Score summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card
            data-ocid="result.score.card"
            className="border-border bg-card sm:col-span-1"
          >
            <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {isOverridden ? "Final Score (Adjusted)" : "Score"}
              </p>
              {displayScore !== undefined ? (
                <ScoreDonut score={Math.round(displayScore)} />
              ) : (
                <span className="font-display text-3xl font-bold text-muted-foreground">
                  —
                </span>
              )}
              <StatusBadge status={submission.status as string} />
              {isOverridden && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-chart-2/20 text-chart-2 border-chart-2/30 mt-1"
                >
                  Teacher Override
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card sm:col-span-2">
            <CardContent className="p-5 space-y-4">
              {submission.aiScore !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Bot className="h-3 w-3" />
                      <span>AI Score</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {submission.aiScore}%
                    </span>
                  </div>
                  <FeedbackBand score={submission.aiScore} maxScore={100} />
                </div>
              )}

              {result && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star className="h-3 w-3" />
                        <span>Teacher Final Score</span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {result.finalScore}%
                      </span>
                    </div>
                    <FeedbackBand score={result.finalScore} maxScore={100} />
                  </div>
                </>
              )}

              <Separator className="bg-border" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                <span>{exam?.questions.length ?? "—"} questions · </span>
                <span>
                  {hasFeedback
                    ? `${submission.aiFeedback.length} question(s) with AI feedback`
                    : "Awaiting AI feedback"}
                </span>
              </div>

              {result?.teacherRemarks && (
                <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare className="h-3 w-3 text-chart-2" />
                    <span className="text-[10px] uppercase tracking-wider text-chart-2/80 font-medium">
                      Teacher Remarks
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.teacherRemarks}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-question feedback */}
        {hasFeedback && (
          <section data-ocid="result.questions.section">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Per-Question AI Feedback
              </h2>
            </div>
            <div className="space-y-3">
              {submission.aiFeedback.map((fb, i) => (
                <QuestionFeedbackCard
                  key={String(fb.questionId)}
                  qfb={fb}
                  questionText={questionMap.get(String(fb.questionId))?.text}
                  studentAnswer={answerMap.get(String(fb.questionId))}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {!hasFeedback && !isGrading && (
          <Card className="border-border bg-card">
            <CardContent
              data-ocid="result.feedback.empty_state"
              className="flex flex-col items-center justify-center gap-2 py-10 text-center"
            >
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-1" />
              <p className="text-sm font-medium text-foreground">
                No detailed feedback available
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                AI feedback was not generated for this submission. Contact your
                teacher for more details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
