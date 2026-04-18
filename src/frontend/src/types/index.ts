export type UserRole = "admin" | "teacher" | "student";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  description: string;
  studentCount: number;
  createdAt: number;
}

export interface Exam {
  id: string;
  title: string;
  classId: string;
  teacherId: string;
  scheduledDate: number;
  duration: number;
  status: "draft" | "published" | "closed";
  answerKeyUploaded: boolean;
  submissionCount: number;
  createdAt: number;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  aiScore: number | null;
  finalScore: number | null;
  feedback: string | null;
  status: "pending" | "graded" | "reviewed";
  submittedAt: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface SystemAnalytics {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  activeExams: number;
  totalSubmissions: number;
  averageScore: number;
  aiGradingCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: number;
}
