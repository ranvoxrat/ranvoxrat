import {
  ExamStatus as ExamStatusEnum,
  SubmissionStatus as SubStatusEnum,
} from "@/backend";
import type { Exam, Question, QuestionFeedback, Submission } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "@/hooks/use-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageSquare,
  RotateCcw,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function getSubStatusStr(
  status: (typeof SubStatusEnum)[keyof typeof SubStatusEnum],
): string {
  if (status === SubStatusEnum.graded) return "graded";
  if (status === SubStatusEnum.grading) return "grading";
  return "submitted";
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SubmissionDetailSheet({
  submission,
  exam,
  onClose,
}: {
  submission: Submission | null;
  exam: Exam | null;
  onClose: () => void;
}) {
  const { backend } = useBackend();
  const queryClient = useQueryClient();
  const [overrideScore, setOverrideScore] = useState("");
  const [remarks, setRemarks] = useState("");

  const aiGradeMutation = useMutation({
    mutationFn: () => backend!.triggerAIGrading(submission!.submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("AI grading triggered");
    },
    onError: () => toast.error("Failed to trigger AI grading"),
  });

  const overrideMutation = useMutation({
    mutationFn: () =>
      backend!.overrideScore(
        submission!.submissionId,
        Number.parseFloat(overrideScore),
        remarks,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Score overridden successfully");
      setOverrideScore("");
      setRemarks("");
      onClose();
    },
    onError: () => toast.error("Failed to override score"),
  });

  if (!submission || !exam) return null;

  const feedbackMap: Record<string, QuestionFeedback> = Object.fromEntries(
    submission.aiFeedback.map((f) => [String(f.questionId), f]),
  );
  const answerMap: Record<string, string> = Object.fromEntries(
    submission.textAnswers.map((a) => [String(a.questionId), a.text]),
  );
  const statusStr = getSubStatusStr(submission.status);

  return (
    <Sheet open={!!submission} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        data-ocid="teacher.submission_detail.sheet"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
        side="right"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="font-display text-base">
                Submission Review
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exam.title} · Submitted {formatDate(submission.submittedAt)}
              </p>
            </div>
            <StatusBadge status={statusStr} />
          </div>

          <div className="flex items-center gap-3 mt-3">
            {submission.aiScore !== undefined && (
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">AI Score:</span>
                <span className="font-mono text-sm font-semibold text-primary">
                  {submission.aiScore}%
                </span>
              </div>
            )}
            {submission.status === SubStatusEnum.submitted && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 text-xs"
                onClick={() => aiGradeMutation.mutate()}
                disabled={aiGradeMutation.isPending}
                data-ocid="teacher.submission_detail.trigger_ai_button"
              >
                {aiGradeMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Trigger AI Grading
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-5">
            {/* Per-question feedback */}
            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold text-foreground">
                Answers & AI Feedback
              </h3>
              {exam.questions.map((q: Question, qi: number) => {
                const feedback = feedbackMap[String(q.questionId)];
                const answer = answerMap[String(q.questionId)];
                return (
                  <div
                    key={String(q.questionId)}
                    data-ocid={`teacher.submission_detail.question.${qi + 1}`}
                    className="rounded-lg border border-border bg-card p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        Q{qi + 1}. {q.text}
                      </p>
                      {feedback && (
                        <Badge className="shrink-0 font-mono text-xs bg-primary/20 text-primary border-primary/30">
                          {feedback.score}/{Number(q.pointValue)}
                        </Badge>
                      )}
                    </div>

                    {answer ? (
                      <div className="rounded bg-background/70 px-3 py-2 text-sm text-foreground border border-border/50">
                        {answer}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No answer provided
                      </p>
                    )}

                    {feedback?.feedback && (
                      <div className="flex gap-2 rounded bg-primary/5 border border-primary/20 px-3 py-2">
                        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feedback.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {exam.questions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No questions in this exam
                </p>
              )}
            </div>

            {/* File submission */}
            {submission.fileRef && (
              <div className="space-y-2">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  Submitted File
                </h3>
                <a
                  href={submission.fileRef.getDirectURL()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-primary hover:bg-muted/50 transition-smooth"
                  data-ocid="teacher.submission_detail.file_link"
                >
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  View Submitted File
                </a>
              </div>
            )}

            {/* Override section */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h3 className="font-display text-sm font-semibold text-foreground">
                  Override Grade
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="override-score" className="text-xs">
                    Final Score (%)
                  </Label>
                  <Input
                    id="override-score"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(e.target.value)}
                    placeholder={
                      submission.aiScore !== undefined
                        ? `AI: ${submission.aiScore}`
                        : "Enter score"
                    }
                    data-ocid="teacher.submission_detail.override_score_input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-xs">
                  Teacher Remarks
                </Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add feedback or remarks for the student…"
                  className="resize-none min-h-[72px] text-sm"
                  data-ocid="teacher.submission_detail.remarks_textarea"
                />
              </div>
              <Button
                className="gap-2"
                onClick={() => overrideMutation.mutate()}
                disabled={!overrideScore || overrideMutation.isPending}
                data-ocid="teacher.submission_detail.save_override_button"
              >
                {overrideMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Override
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function TeacherSubmissions() {
  const { backend, isReady } = useBackend();
  const search = useSearch({ strict: false }) as { examId?: string };
  const [selectedExamId, setSelectedExamId] = useState<string>(
    search.examId ?? "",
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => backend!.getExams(),
    enabled: isReady,
  });

  const selectedExam =
    exams.find((e) => String(e.examId) === selectedExamId) ?? null;

  const { data: submissions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["submissions", selectedExamId],
    queryFn: () => backend!.getSubmissions(BigInt(selectedExamId)),
    enabled: isReady && !!selectedExamId,
  });

  const isLoading = examsLoading || (!!selectedExamId && subsLoading);

  function shortId(sub: Submission): string {
    return `STU-${String(sub.studentId.toText()).slice(0, 6).toUpperCase()}`;
  }

  return (
    <AppLayout title="Submissions">
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Submissions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and grade student submissions
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger data-ocid="teacher.submissions.exam_select">
                <SelectValue placeholder="Select an exam…" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={String(e.examId)} value={String(e.examId)}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedExamId ? (
          <EmptyState
            data-ocid="teacher.submissions.no_exam_state"
            icon={ClipboardList}
            title="Select an exam"
            description="Choose an exam from the dropdown above to see its submissions."
          />
        ) : isLoading ? (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            data-ocid="teacher.submissions.empty_state"
            icon={ClipboardList}
            title="No submissions yet"
            description="Students haven't submitted answers for this exam."
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {selectedExam && (
              <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-3">
                <p className="font-display text-sm font-semibold text-foreground">
                  {selectedExam.title}
                </p>
                <Badge
                  variant="outline"
                  className="text-xs border-border text-muted-foreground"
                >
                  {submissions.length} submissions
                </Badge>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-display text-xs uppercase tracking-wider">
                    Student
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-display text-xs uppercase tracking-wider">
                    Submitted
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wider">
                    AI Score
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub, i) => {
                  const statusStr = getSubStatusStr(sub.status);
                  return (
                    <TableRow
                      key={String(sub.submissionId)}
                      data-ocid={`teacher.submissions.item.${i + 1}`}
                      className="border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
                              {shortId(sub).slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground font-mono truncate">
                              {shortId(sub)}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                              {sub.studentId.toText().slice(0, 16)}…
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(sub.submittedAt)}
                      </TableCell>
                      <TableCell>
                        {sub.aiScore !== undefined ? (
                          <span className="font-mono text-sm font-semibold text-primary">
                            {sub.aiScore}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={statusStr} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1.5 text-primary"
                          data-ocid={`teacher.submissions.review.${i + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(sub);
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <SubmissionDetailSheet
        submission={selectedSubmission}
        exam={selectedExam}
        onClose={() => setSelectedSubmission(null)}
      />
    </AppLayout>
  );
}
