import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Class {
    name: string;
    createdAt: Timestamp;
    studentIds: Array<UserId>;
    classId: ClassId;
    teacherId: UserId;
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type ResultId = bigint;
export type SubmissionId = bigint;
export interface PerformanceRecord {
    examTitle: string;
    submittedAt: Timestamp;
    finalScore?: number;
    examId: ExamId;
}
export type ExamId = bigint;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Exam {
    status: ExamStatus;
    title: string;
    answerKeyRef?: ExternalBlob;
    createdAt: Timestamp;
    rubricRef?: ExternalBlob;
    description: string;
    classId: ClassId;
    durationMinutes?: bigint;
    teacherId: UserId;
    questions: Array<Question>;
    examId: ExamId;
    scheduledAt?: Timestamp;
}
export type ClassId = bigint;
export interface Submission {
    status: SubmissionStatus;
    studentId: UserId;
    textAnswers: Array<AnswerEntry>;
    submittedAt: Timestamp;
    aiFeedback: Array<QuestionFeedback>;
    submissionId: SubmissionId;
    examId: ExamId;
    aiScore?: number;
    fileRef?: ExternalBlob;
}
export interface QuestionFeedback {
    feedback: string;
    score: number;
    questionId: QuestionId;
}
export interface ActivityLog {
    action: string;
    actorName: string;
    actorId: UserId;
    logId: LogId;
    timestamp: Timestamp;
    details: string;
}
export type QuestionId = bigint;
export interface ClassAnalytics {
    topStudents: Array<[UserId, number]>;
    examCount: bigint;
    failingStudents: Array<[UserId, number]>;
    submissionCount: bigint;
    averageScore: number;
}
export interface DashboardStats {
    pendingSubmissions: bigint;
    recentActivityCount: bigint;
    totalStudents: bigint;
    totalAdmins: bigint;
    totalTeachers: bigint;
    activeExams: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type LogId = bigint;
export type UserId = Principal;
export interface Result {
    teacherRemarks: string;
    overriddenBy?: UserId;
    gradedAt: Timestamp;
    resultId: ResultId;
    finalScore: number;
    submissionId: SubmissionId;
}
export interface Question {
    pointValue: bigint;
    text: string;
    correctAnswer?: string;
    questionType: QuestionType;
    questionId: QuestionId;
    options: Array<string>;
}
export interface UserProfile {
    name: string;
    createdAt: Timestamp;
    role: UserRole;
    email: string;
}
export interface AnswerEntry {
    text: string;
    questionId: QuestionId;
}
export enum ExamStatus {
    closed = "closed",
    published = "published",
    draft = "draft"
}
export enum QuestionType {
    shortAnswer = "shortAnswer",
    essay = "essay",
    multipleChoice = "multipleChoice"
}
export enum SubmissionStatus {
    graded = "graded",
    submitted = "submitted",
    grading = "grading"
}
export enum UserRole {
    admin = "admin",
    teacher = "teacher",
    student = "student"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createClass(name: string): Promise<Class>;
    createExam(title: string, description: string, classId: ClassId, questions: Array<Question>, scheduledAt: Timestamp | null, durationMinutes: bigint | null): Promise<Exam>;
    getActivityLogs(): Promise<Array<ActivityLog>>;
    getAssignedExams(): Promise<Array<Exam>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getClassAnalytics(classId: ClassId): Promise<ClassAnalytics>;
    getClasses(): Promise<Array<Class>>;
    getDashboardStats(): Promise<DashboardStats>;
    getExamDetail(examId: ExamId): Promise<Exam | null>;
    getExams(): Promise<Array<Exam>>;
    getMySubmissions(): Promise<Array<Submission>>;
    getPerformanceHistory(): Promise<Array<PerformanceRecord>>;
    getSubmissionResult(submissionId: SubmissionId): Promise<Result | null>;
    getSubmissions(examId: ExamId): Promise<Array<Submission>>;
    getUserProfile(user: UserId): Promise<UserProfile | null>;
    getUsers(): Promise<Array<[UserId, UserProfile]>>;
    inviteUser(targetPrincipal: UserId, name: string, email: string, role: UserRole): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    overrideScore(submissionId: SubmissionId, finalScore: number, teacherRemarks: string): Promise<void>;
    publishExam(examId: ExamId): Promise<void>;
    resetUserPassword(targetPrincipal: UserId): Promise<string>;
    saveCallerUserProfile(name: string, email: string): Promise<void>;
    setOpenAIKey(key: string): Promise<void>;
    submitExam(examId: ExamId, textAnswers: Array<AnswerEntry>, fileRef: ExternalBlob | null): Promise<Submission>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    triggerAIGrading(submissionId: SubmissionId): Promise<void>;
    updateClass(classId: ClassId, name: string): Promise<void>;
    updateExam(examId: ExamId, title: string, description: string, questions: Array<Question>, answerKeyRef: ExternalBlob | null, rubricRef: ExternalBlob | null, scheduledAt: Timestamp | null, durationMinutes: bigint | null): Promise<void>;
    updateUserRole(targetPrincipal: UserId, role: UserRole): Promise<void>;
}
