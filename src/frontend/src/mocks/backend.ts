import type { backendInterface, UserProfile, Class, Exam, Submission, Result, ActivityLog, DashboardStats, ClassAnalytics, PerformanceRecord } from "../backend";
import { ExamStatus, QuestionType, SubmissionStatus, UserRole, UserRole__1 } from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const mockPrincipal = Principal.fromText("aaaaa-aa");
const now = BigInt(Date.now()) * BigInt(1_000_000);

const mockUserProfile: UserProfile = {
  name: "Alice Johnson",
  createdAt: now,
  role: UserRole.teacher,
  email: "alice@school.edu",
};

const mockClass: Class = {
  classId: BigInt(1),
  name: "Advanced Mathematics",
  teacherId: mockPrincipal,
  studentIds: [mockPrincipal],
  createdAt: now,
};

const mockExam: Exam = {
  examId: BigInt(1),
  title: "Midterm Exam — Calculus",
  description: "Covers derivatives, integrals, and limits.",
  classId: BigInt(1),
  teacherId: mockPrincipal,
  status: ExamStatus.published,
  createdAt: now,
  scheduledAt: now,
  durationMinutes: BigInt(90),
  questions: [
    {
      questionId: BigInt(1),
      text: "Explain the concept of a derivative and its geometric interpretation.",
      questionType: QuestionType.essay,
      pointValue: BigInt(20),
      options: [],
      correctAnswer: undefined,
    },
    {
      questionId: BigInt(2),
      text: "What is the integral of x^2?",
      questionType: QuestionType.shortAnswer,
      pointValue: BigInt(10),
      options: [],
      correctAnswer: "x^3/3 + C",
    },
    {
      questionId: BigInt(3),
      text: "Which of the following is the derivative of sin(x)?",
      questionType: QuestionType.multipleChoice,
      pointValue: BigInt(5),
      options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
      correctAnswer: "cos(x)",
    },
  ],
};

const mockSubmission: Submission = {
  submissionId: BigInt(1),
  examId: BigInt(1),
  studentId: mockPrincipal,
  status: SubmissionStatus.graded,
  submittedAt: now,
  textAnswers: [
    { questionId: BigInt(1), text: "A derivative represents the rate of change of a function at a given point..." },
    { questionId: BigInt(2), text: "x^3/3 + C" },
    { questionId: BigInt(3), text: "cos(x)" },
  ],
  aiFeedback: [
    { questionId: BigInt(1), score: 17, feedback: "Good explanation of the geometric interpretation. Could elaborate more on the limit definition." },
    { questionId: BigInt(2), score: 10, feedback: "Correct answer with proper constant of integration." },
    { questionId: BigInt(3), score: 5, feedback: "Correct." },
  ],
  aiScore: 32,
};

const mockResult: Result = {
  resultId: BigInt(1),
  submissionId: BigInt(1),
  finalScore: 32,
  teacherRemarks: "Well done! Strong understanding of core calculus concepts.",
  gradedAt: now,
  overriddenBy: undefined,
};

const mockActivityLogs: ActivityLog[] = [
  { logId: BigInt(1), actorId: mockPrincipal, actorName: "Alice Johnson", action: "CREATE_EXAM", details: "Created exam: Midterm Exam — Calculus", timestamp: now },
  { logId: BigInt(2), actorId: mockPrincipal, actorName: "Bob Smith", action: "SUBMIT_EXAM", details: "Submitted exam: Midterm Exam — Calculus", timestamp: now - BigInt(3_600_000_000_000) },
  { logId: BigInt(3), actorId: mockPrincipal, actorName: "Alice Johnson", action: "OVERRIDE_SCORE", details: "Overrode score for submission #2", timestamp: now - BigInt(7_200_000_000_000) },
];

const mockDashboardStats: DashboardStats = {
  totalTeachers: BigInt(8),
  totalStudents: BigInt(142),
  totalAdmins: BigInt(2),
  activeExams: BigInt(5),
  pendingSubmissions: BigInt(23),
  recentActivityCount: BigInt(47),
};

const mockClassAnalytics: ClassAnalytics = {
  examCount: BigInt(4),
  submissionCount: BigInt(89),
  averageScore: 74.2,
  topStudents: [[mockPrincipal, 95], [mockPrincipal, 91]],
  failingStudents: [[mockPrincipal, 42]],
};

const mockPerformanceHistory: PerformanceRecord[] = [
  { examId: BigInt(1), examTitle: "Midterm Exam — Calculus", finalScore: 32, submittedAt: now },
  { examId: BigInt(2), examTitle: "Quiz 1 — Limits", finalScore: 18, submittedAt: now - BigInt(7_200_000_000_000) },
  { examId: BigInt(3), examTitle: "Practice Test — Integrals", submittedAt: now - BigInt(14_400_000_000_000) },
];

export const mockBackend: backendInterface = {
  assignCallerUserRole: async () => undefined,
  createClass: async (name) => ({ ...mockClass, name }),
  createExam: async (title, description) => ({ ...mockExam, title, description }),
  getActivityLogs: async () => mockActivityLogs,
  getAssignedExams: async () => [mockExam, { ...mockExam, examId: BigInt(2), title: "Final Exam — Linear Algebra", status: ExamStatus.draft }],
  getCallerUserProfile: async () => mockUserProfile,
  getCallerUserRole: async () => UserRole__1.user,
  getClassAnalytics: async () => mockClassAnalytics,
  getClasses: async () => [mockClass, { ...mockClass, classId: BigInt(2), name: "Linear Algebra 101" }],
  getDashboardStats: async () => mockDashboardStats,
  getExamDetail: async () => mockExam,
  getExams: async () => [mockExam, { ...mockExam, examId: BigInt(2), title: "Final Exam — Linear Algebra", status: ExamStatus.draft }],
  getMySubmissions: async () => [mockSubmission],
  getPerformanceHistory: async () => mockPerformanceHistory,
  getSubmissionResult: async () => mockResult,
  getSubmissions: async () => [mockSubmission, { ...mockSubmission, submissionId: BigInt(2), aiScore: 28, status: SubmissionStatus.graded }],
  getUserProfile: async () => mockUserProfile,
  getUsers: async () => [
    [mockPrincipal, { name: "Alice Johnson", email: "alice@school.edu", role: UserRole.teacher, createdAt: now }],
    [mockPrincipal, { name: "Bob Smith", email: "bob@school.edu", role: UserRole.student, createdAt: now }],
    [mockPrincipal, { name: "Carol White", email: "carol@school.edu", role: UserRole.admin, createdAt: now }],
  ],
  inviteUser: async () => undefined,
  isCallerAdmin: async () => true,
  overrideScore: async () => undefined,
  publishExam: async () => undefined,
  resetUserPassword: async () => "tempPass123",
  saveCallerUserProfile: async () => undefined,
  setOpenAIKey: async () => undefined,
  submitExam: async () => mockSubmission,
  transform: async (input) => ({ status: BigInt(200), body: new Uint8Array(), headers: [] }),
  triggerAIGrading: async () => undefined,
  updateClass: async () => undefined,
  updateExam: async () => undefined,
  updateUserRole: async () => undefined,
  _immutableObjectStorageBlobsAreLive: async () => [],
  _immutableObjectStorageBlobsToDelete: async () => [],
  _immutableObjectStorageConfirmBlobDeletion: async () => undefined,
  _immutableObjectStorageCreateCertificate: async () => ({ ok: "" } as never),
  _immutableObjectStorageRefillCashier: async () => ({ ok: null } as never),
  _immutableObjectStorageUpdateGatewayPrincipals: async () => undefined,
  _initializeAccessControl: async () => undefined,
};
