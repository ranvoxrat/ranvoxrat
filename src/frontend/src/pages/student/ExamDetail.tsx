import { ExternalBlob } from "@/backend";
import type {
  AnswerEntry,
  Exam as BackendExam,
  Question,
  QuestionType,
  Submission,
} from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "@/hooks/use-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  Send,
  Timer,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function useCountdown(durationMinutes: number | null) {
  const [secondsLeft, setSecondsLeft] = useState(
    durationMinutes !== null ? durationMinutes * 60 : null,
  );

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const id = setInterval(
      () => setSecondsLeft((s) => (s !== null ? s - 1 : null)),
      1000,
    );
    return () => clearInterval(id);
  }, [secondsLeft]);

  const formatted =
    secondsLeft !== null
      ? `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`
      : null;

  const isLow = secondsLeft !== null && secondsLeft < 300;

  return { formatted, isLow, secondsLeft };
}

function QuestionBlock({
  question,
  index,
  answer,
  onChange,
}: {
  question: Question;
  index: number;
  answer: string;
  onChange: (val: string) => void;
}) {
  const isMC =
    (question.questionType as unknown as string) === "multipleChoice";
  const isEssay = (question.questionType as unknown as string) === "essay";

  return (
    <Card
      data-ocid={`exam.question.item.${index + 1}`}
      className="border-border bg-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {index + 1}
          </span>
          <div className="flex-1">
            <CardTitle className="font-display text-sm font-semibold text-foreground leading-relaxed">
              {question.text}
            </CardTitle>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] bg-secondary text-muted-foreground border-border capitalize"
              >
                {isMC ? "Multiple Choice" : isEssay ? "Essay" : "Short Answer"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {Number(question.pointValue)} pts
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isMC && question.options.length > 0 ? (
          <RadioGroup
            value={answer}
            onValueChange={onChange}
            data-ocid={`exam.question.radio.${index + 1}`}
          >
            {question.options.map((opt) => (
              <div
                key={opt}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-secondary/40 transition-smooth cursor-pointer"
              >
                <RadioGroupItem
                  value={opt}
                  id={`q${index}-opt-${opt}`}
                  data-ocid={`exam.question.option.${index + 1}`}
                />
                <Label
                  htmlFor={`q${index}-opt-${opt}`}
                  className="text-sm text-foreground cursor-pointer flex-1"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isEssay ? "Write your essay answer here…" : "Enter your answer…"
            }
            rows={isEssay ? 6 : 3}
            data-ocid={`exam.question.textarea.${index + 1}`}
            className="bg-secondary/30 border-border resize-none text-sm"
          />
        )}
      </CardContent>
    </Card>
  );
}

type SubmitSuccess = {
  submissionId: bigint;
  examId: bigint;
};

function SubmissionSuccess({ sub }: { sub: SubmitSuccess }) {
  return (
    <AppLayout title="Exam Submitted">
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-chart-3/20">
          <CheckCircle2 className="h-10 w-10 text-chart-3" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Submission Confirmed
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Your answers have been submitted. AI grading will begin shortly and
          you'll see your results once complete.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/student/results/$submissionId"
            params={{ submissionId: String(sub.submissionId) }}
          >
            <Button
              data-ocid="exam.success.view_results_button"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              View Results
            </Button>
          </Link>
          <Link to="/student">
            <Button
              variant="outline"
              data-ocid="exam.success.back_button"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Exams
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

export default function ExamDetail() {
  const { examId } = useParams({ from: "/student/exam/$examId" });
  const queryClient = useQueryClient();
  const { backend, isReady } = useBackend();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Set<string>>(
    new Set(),
  );
  const [submitted, setSubmitted] = useState<SubmitSuccess | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: exam,
    isLoading,
    error,
  } = useQuery<BackendExam | null>({
    queryKey: ["exam-detail", examId],
    queryFn: async () => {
      if (!backend) return null;
      return backend.getExamDetail(BigInt(examId));
    },
    enabled: isReady && !!examId,
  });

  // Check if already submitted
  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["student-submissions"],
    queryFn: async () => {
      if (!backend) return [];
      return backend.getMySubmissions();
    },
    enabled: isReady,
  });

  const existingSubmission = submissions?.find(
    (s) => String(s.examId) === examId,
  );

  const duration = exam?.durationMinutes ? Number(exam.durationMinutes) : null;
  const { formatted: timerDisplay, isLow: timerLow } = useCountdown(duration);

  const updateAnswer = useCallback((qid: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    setValidationErrors((prev) => {
      const next = new Set(prev);
      next.delete(qid);
      return next;
    });
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!backend || !exam) throw new Error("Not ready");
      const textAnswers: AnswerEntry[] = exam.questions.map((q) => ({
        questionId: q.questionId,
        text: answers[String(q.questionId)] ?? "",
      }));
      let fileRef: ExternalBlob | null = null;
      if (attachedFile) {
        const bytes = new Uint8Array(await attachedFile.arrayBuffer());
        fileRef = ExternalBlob.fromBytes(bytes);
      }
      return backend.submitExam(exam.examId, textAnswers, fileRef);
    },
    onSuccess: (sub) => {
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["student-assigned-exams"] });
      setSubmitted({ submissionId: sub.submissionId, examId: sub.examId });
      toast.success("Exam submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit exam. Please try again.");
    },
  });

  function handleSubmit() {
    if (!exam) return;
    const errors = new Set<string>();
    for (const q of exam.questions) {
      const qid = String(q.questionId);
      const val = answers[qid] ?? "";
      if (!val.trim()) {
        errors.add(qid);
      }
    }
    if (errors.size > 0) {
      setValidationErrors(errors);
      toast.error(
        `Please answer all ${errors.size} unanswered question(s) before submitting.`,
      );
      return;
    }
    submitMutation.mutate();
  }

  if (submitted) {
    return <SubmissionSuccess sub={submitted} />;
  }

  if (isLoading) {
    return (
      <AppLayout title="Loading Exam…">
        <div className="space-y-4 p-6 md:p-8">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="border-border bg-card">
              <CardHeader>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (error || !exam) {
    return (
      <AppLayout title="Exam Not Found">
        <div
          data-ocid="exam.error_state"
          className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8"
        >
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            This exam could not be loaded or no longer exists.
          </p>
          <Link to="/student">
            <Button variant="outline" data-ocid="exam.error.back_button">
              Back to Exams
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const answeredCount = exam.questions.filter(
    (q) => (answers[String(q.questionId)] ?? "").trim().length > 0,
  ).length;

  const totalPoints = exam.questions.reduce(
    (sum, q) => sum + Number(q.pointValue),
    0,
  );

  return (
    <AppLayout title={exam.title}>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        {/* Exam header */}
        <div className="flex items-start gap-4">
          <Link to="/student">
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              data-ocid="exam.back_button"
              aria-label="Back to exams"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {exam.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              {timerDisplay && (
                <div
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-smooth ${
                    timerLow
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                  data-ocid="exam.timer"
                >
                  <Timer className="h-3 w-3" />
                  <span className="font-mono">{timerDisplay}</span>
                  <span className="text-[10px] opacity-70">
                    remaining (display only)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {exam.questions.length} questions · {totalPoints} pts total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Already submitted warning */}
        {existingSubmission && (
          <div
            data-ocid="exam.already_submitted.error_state"
            className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Already submitted
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You've already submitted this exam.{" "}
                <Link
                  to="/student/results/$submissionId"
                  params={{
                    submissionId: String(existingSubmission.submissionId),
                  }}
                  className="text-primary underline underline-offset-2"
                >
                  View your results
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {exam.questions.map((q, i) => {
            const qid = String(q.questionId);
            const hasError = validationErrors.has(qid);
            return (
              <div key={qid}>
                <QuestionBlock
                  question={q}
                  index={i}
                  answer={answers[qid] ?? ""}
                  onChange={(val) => updateAnswer(qid, val)}
                />
                {hasError && (
                  <p
                    data-ocid={`exam.question.field_error.${i + 1}`}
                    className="mt-1.5 flex items-center gap-1.5 px-1 text-xs text-destructive"
                  >
                    <AlertCircle className="h-3 w-3" />
                    This question requires an answer.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit section */}
        <div className="sticky bottom-0 rounded-xl border border-border bg-card/95 backdrop-blur p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {answeredCount}
            </span>
            {" / "}
            <span>{exam.questions.length}</span> answered
            {validationErrors.size > 0 && (
              <span className="ml-2 text-destructive">
                · {validationErrors.size} unanswered
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setAttachedFile(file);
              if (file) toast.success(`Attached: ${file.name}`);
            }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="exam.attach_file_button"
              disabled={!!existingSubmission}
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
              {attachedFile ? attachedFile.name.slice(0, 20) : "Attach File"}
            </Button>
            {attachedFile && (
              <button
                type="button"
                aria-label="Remove attached file"
                className="rounded-full p-0.5 hover:bg-muted text-muted-foreground"
                onClick={() => {
                  setAttachedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !!existingSubmission}
            data-ocid="exam.submit_button"
            className="gap-2 min-w-36"
          >
            {submitMutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Answers
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
