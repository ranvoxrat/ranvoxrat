import {
  ExamStatus as ExamStatusEnum,
  ExternalBlob,
  QuestionType,
} from "@/backend";
import type { Exam, Question } from "@/backend.d";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
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
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

function formatDate(ts: bigint | undefined): string {
  if (!ts) return "Not scheduled";
  return new Date(Number(ts)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStr(
  status: (typeof ExamStatusEnum)[keyof typeof ExamStatusEnum],
): string {
  if (status === ExamStatusEnum.published) return "published";
  if (status === ExamStatusEnum.closed) return "closed";
  return "draft";
}

interface LocalQuestion {
  localId: string;
  type: "multipleChoice" | "shortAnswer" | "essay";
  text: string;
  options: string[];
  correctAnswer: string;
  pointValue: number;
}

function QuestionBuilder({
  questions,
  onChange,
}: {
  questions: LocalQuestion[];
  onChange: (q: LocalQuestion[]) => void;
}) {
  const addMC = () =>
    onChange([
      ...questions,
      {
        localId: `q_${Date.now()}`,
        type: "multipleChoice",
        text: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        pointValue: 1,
      },
    ]);

  const addEssay = () =>
    onChange([
      ...questions,
      {
        localId: `q_${Date.now()}`,
        type: "essay",
        text: "",
        options: [],
        correctAnswer: "",
        pointValue: 10,
      },
    ]);

  const remove = (id: string) =>
    onChange(questions.filter((q) => q.localId !== id));
  const update = (id: string, patch: Partial<LocalQuestion>) =>
    onChange(questions.map((q) => (q.localId === id ? { ...q, ...patch } : q)));
  const moveUp = (i: number) => {
    if (i === 0) return;
    const arr = [...questions];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    onChange(arr);
  };
  const moveDown = (i: number) => {
    if (i === questions.length - 1) return;
    const arr = [...questions];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Questions ({questions.length})
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={addMC}
            data-ocid="teacher.exam_builder.add_mc_button"
          >
            <Plus className="h-3 w-3" /> Multiple Choice
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={addEssay}
            data-ocid="teacher.exam_builder.add_essay_button"
          >
            <Plus className="h-3 w-3" /> Essay/Short Answer
          </Button>
        </div>
      </div>

      {questions.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
          Add questions using the buttons above
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.localId}
            data-ocid={`teacher.exam_builder.question.${i + 1}`}
            className="rounded-lg border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className="text-xs capitalize border-border text-muted-foreground"
              >
                {q.type === "multipleChoice"
                  ? "Multiple Choice"
                  : q.type === "essay"
                    ? "Essay"
                    : "Short Answer"}
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveDown(i)}
                  disabled={i === questions.length - 1}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => remove(q.localId)}
                  aria-label="Delete question"
                  data-ocid={`teacher.exam_builder.delete_question.${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Question Text</Label>
              <Textarea
                value={q.text}
                onChange={(e) => update(q.localId, { text: e.target.value })}
                placeholder="Enter question text…"
                className="min-h-[60px] text-sm resize-none"
                data-ocid={`teacher.exam_builder.question_text.${i + 1}`}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="space-y-1.5 w-24">
                <Label className="text-xs">Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={q.pointValue}
                  onChange={(e) =>
                    update(q.localId, { pointValue: Number(e.target.value) })
                  }
                  className="h-8 text-sm"
                  data-ocid={`teacher.exam_builder.points.${i + 1}`}
                />
              </div>
            </div>

            {q.type === "multipleChoice" && (
              <div className="space-y-2">
                <Label className="text-xs">
                  Options (select the correct one)
                </Label>
                {q.options.map((opt, oi) => (
                  <div
                    key={`opt_${q.localId}_${oi}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name={`correct_${q.localId}`}
                      checked={q.correctAnswer === String(oi)}
                      onChange={() =>
                        update(q.localId, { correctAnswer: String(oi) })
                      }
                      className="shrink-0 accent-primary"
                      aria-label={`Correct answer option ${oi + 1}`}
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...q.options];
                        newOpts[oi] = e.target.value;
                        update(q.localId, { options: newOpts });
                      }}
                      placeholder={`Option ${oi + 1}`}
                      className="h-8 text-sm flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ExamFormProps {
  exam?: Exam;
  classes: Array<{ classId: bigint; name: string }>;
  onClose: () => void;
}

function ExamFormDialog({ exam, classes, onClose }: ExamFormProps) {
  const { backend } = useBackend();
  const queryClient = useQueryClient();
  const answerKeyRef = useRef<HTMLInputElement>(null);
  const rubricRef = useRef<HTMLInputElement>(null);

  const isEdit = !!exam;
  const publishedEdit = isEdit && exam.status === ExamStatusEnum.published;

  const [title, setTitle] = useState(exam?.title ?? "");
  const [description, setDescription] = useState(exam?.description ?? "");
  const [classId, setClassId] = useState(exam ? String(exam.classId) : "");
  const [scheduledAt, setScheduledAt] = useState(
    exam?.scheduledAt
      ? new Date(Number(exam.scheduledAt)).toISOString().slice(0, 16)
      : "",
  );
  const [duration, setDuration] = useState(
    exam?.durationMinutes ? String(exam.durationMinutes) : "",
  );
  const [questions, setQuestions] = useState<LocalQuestion[]>(
    exam?.questions.map((q, i) => ({
      localId: `existing_${i}`,
      type:
        q.questionType === QuestionType.multipleChoice
          ? "multipleChoice"
          : q.questionType === QuestionType.essay
            ? "essay"
            : "shortAnswer",
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer ?? "",
      pointValue: Number(q.pointValue),
    })) ?? [],
  );
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const buildQuestions = (): Question[] =>
    questions.map((q, i) => ({
      questionId: BigInt(i),
      questionType:
        q.type === "multipleChoice"
          ? QuestionType.multipleChoice
          : q.type === "essay"
            ? QuestionType.essay
            : QuestionType.shortAnswer,
      text: q.text,
      options: q.options.filter(Boolean),
      correctAnswer: q.correctAnswer || undefined,
      pointValue: BigInt(q.pointValue),
    }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      let answerKeyBlob: ExternalBlob | null = null;
      let rubricBlob: ExternalBlob | null = null;

      if (answerKeyFile) {
        const bytes = new Uint8Array(await answerKeyFile.arrayBuffer());
        answerKeyBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
          setUploadProgress(p),
        );
      }
      if (rubricFile) {
        const bytes = new Uint8Array(await rubricFile.arrayBuffer());
        rubricBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
          setUploadProgress(p),
        );
      }

      const scheduledTs = scheduledAt
        ? BigInt(new Date(scheduledAt).getTime())
        : null;
      const durationMin = duration ? BigInt(Number.parseInt(duration)) : null;

      if (isEdit) {
        await backend!.updateExam(
          exam!.examId,
          title,
          description,
          buildQuestions(),
          answerKeyBlob,
          rubricBlob,
          scheduledTs,
          durationMin,
        );
      } else {
        await backend!.createExam(
          title,
          description,
          BigInt(classId),
          buildQuestions(),
          scheduledTs,
          durationMin,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success(isEdit ? "Exam updated" : "Exam created");
      onClose();
    },
    onError: () =>
      toast.error(isEdit ? "Failed to update exam" : "Failed to create exam"),
  });

  const publishMutation = useMutation({
    mutationFn: () => backend!.publishExam(exam!.examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success("Exam published");
      onClose();
    },
    onError: () => toast.error("Failed to publish exam"),
  });

  const valid = title.trim() && (isEdit || classId);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="teacher.exam_form.dialog"
        className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-display">
            {isEdit ? "Edit Exam" : "Create Exam"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-5">
            {/* Metadata */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-title">Exam Title *</Label>
                <Input
                  id="exam-title"
                  data-ocid="teacher.exam_form.title_input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="exam-desc">Description</Label>
                <Textarea
                  id="exam-desc"
                  data-ocid="teacher.exam_form.description_input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional exam instructions or description"
                  className="resize-none min-h-[72px] text-sm"
                />
              </div>

              {!isEdit && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="exam-class">Class *</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger
                      id="exam-class"
                      data-ocid="teacher.exam_form.class_select"
                    >
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem
                          key={String(c.classId)}
                          value={String(c.classId)}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="exam-schedule">Schedule Date/Time</Label>
                <Input
                  id="exam-schedule"
                  type="datetime-local"
                  data-ocid="teacher.exam_form.schedule_input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam-duration">
                  Duration (minutes, display only)
                </Label>
                <Input
                  id="exam-duration"
                  type="number"
                  min={1}
                  data-ocid="teacher.exam_form.duration_input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 90"
                />
              </div>
            </div>

            <Separator />

            {/* File uploads */}
            {!publishedEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Answer Key</Label>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 cursor-pointer hover:border-primary/50 transition-smooth text-left"
                    onClick={() => answerKeyRef.current?.click()}
                    data-ocid="teacher.exam_form.answer_key_upload"
                  >
                    <Upload className="h-4 w-4 text-primary/70 shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {answerKeyFile
                        ? answerKeyFile.name
                        : exam?.answerKeyRef
                          ? "Uploaded ✓ (replace?)"
                          : "Upload answer key…"}
                    </span>
                    <input
                      ref={answerKeyRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) =>
                        setAnswerKeyFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label>Rubric</Label>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 cursor-pointer hover:border-primary/50 transition-smooth text-left"
                    onClick={() => rubricRef.current?.click()}
                    data-ocid="teacher.exam_form.rubric_upload"
                  >
                    <Upload className="h-4 w-4 text-primary/70 shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {rubricFile
                        ? rubricFile.name
                        : exam?.rubricRef
                          ? "Uploaded ✓ (replace?)"
                          : "Upload rubric…"}
                    </span>
                    <input
                      ref={rubricRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) =>
                        setRubricFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </button>
                </div>
              </div>
            )}

            {!publishedEdit && <Separator />}

            {/* Question builder */}
            {!publishedEdit && (
              <QuestionBuilder questions={questions} onChange={setQuestions} />
            )}

            {publishedEdit && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <p>
                  This exam is published. You can only edit the title,
                  description, schedule, and duration. To modify questions or
                  files, close the exam first.
                </p>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="rounded-lg bg-primary/10 px-4 py-2 text-xs text-primary">
                Uploading… {uploadProgress}%
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t border-border gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="teacher.exam_form.cancel_button"
          >
            Cancel
          </Button>
          {isEdit && exam.status === ExamStatusEnum.draft && (
            <Button
              variant="outline"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="gap-2 border-chart-3/50 text-chart-3 hover:bg-chart-3/10"
              data-ocid="teacher.exam_form.publish_button"
            >
              <Rocket className="h-4 w-4" />
              {publishMutation.isPending ? "Publishing…" : "Publish"}
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!valid || saveMutation.isPending}
            data-ocid="teacher.exam_form.save_button"
          >
            {saveMutation.isPending
              ? "Saving…"
              : isEdit
                ? "Save Changes"
                : "Create Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherExams() {
  const { backend, isReady } = useBackend();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);

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

  const publishMutation = useMutation({
    mutationFn: (examId: bigint) => backend!.publishExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success("Exam published");
    },
    onError: () => toast.error("Failed to publish"),
  });

  const isLoading = examsLoading || classesLoading;

  const classMap = Object.fromEntries(
    classes.map((c) => [String(c.classId), c.name]),
  );

  return (
    <AppLayout title="Exams">
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Exams
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage all your exam papers and submissions
            </p>
          </div>
          <Button
            data-ocid="teacher.exams.add_button"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            data-ocid="teacher.exams.empty_state"
            icon={FileText}
            title="No exams yet"
            description="Create your first exam and assign it to a class."
            action={{
              label: "Create Exam",
              onClick: () => setCreateOpen(true),
              "data-ocid": "teacher.exams.empty_add_button",
            }}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-display text-xs uppercase tracking-wider">
                    Exam
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-display text-xs uppercase tracking-wider">
                    Class
                  </TableHead>
                  <TableHead className="hidden md:table-cell font-display text-xs uppercase tracking-wider">
                    Scheduled
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="hidden lg:table-cell font-display text-xs uppercase tracking-wider text-right">
                    Questions
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam, i) => {
                  const statusStr = getStatusStr(exam.status);
                  return (
                    <TableRow
                      key={String(exam.examId)}
                      data-ocid={`teacher.exams.item.${i + 1}`}
                      className="border-border hover:bg-muted/30 cursor-pointer"
                    >
                      <TableCell className="py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {exam.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exam.durationMinutes
                              ? `${exam.durationMinutes} min`
                              : "No duration"}{" "}
                            · {exam.questions.length} questions
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground"
                        >
                          {classMap[String(exam.classId)] ??
                            String(exam.classId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(exam.scheduledAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={statusStr} />
                          {!exam.answerKeyRef && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30"
                            >
                              No key
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right font-mono text-sm text-foreground">
                        {exam.questions.length}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            data-ocid={`teacher.exams.view_submissions.${i + 1}`}
                            aria-label="View submissions"
                          >
                            <Link
                              to="/teacher/submissions"
                              search={{ examId: String(exam.examId) }}
                            >
                              <Users className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            data-ocid={`teacher.exams.edit.${i + 1}`}
                            aria-label="Edit exam"
                            onClick={() => setEditExam(exam)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {exam.status === ExamStatusEnum.draft && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-chart-3 hover:bg-chart-3/10"
                              data-ocid={`teacher.exams.publish.${i + 1}`}
                              aria-label="Publish exam"
                              onClick={() =>
                                publishMutation.mutate(exam.examId)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {createOpen && (
        <ExamFormDialog
          classes={classes}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editExam && (
        <ExamFormDialog
          exam={editExam}
          classes={classes}
          onClose={() => setEditExam(null)}
        />
      )}
    </AppLayout>
  );
}
