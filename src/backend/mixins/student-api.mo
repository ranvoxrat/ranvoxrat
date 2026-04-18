import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import ClassTypes "../types/classes";
import ExamTypes "../types/exams";
import SubTypes "../types/submissions";
import UserTypes "../types/users";
import LogTypes "../types/logs";
import SubLib "../lib/submissions";
import ExamLib "../lib/exams";
import ClassLib "../lib/classes";
import LogLib "../lib/logs";
import UserLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  classes : Map.Map<Common.ClassId, ClassTypes.Class>,
  exams : Map.Map<Common.ExamId, ExamTypes.Exam>,
  submissions : Map.Map<Common.SubmissionId, SubTypes.Submission>,
  results : Map.Map<Common.ResultId, SubTypes.Result>,
  activityLogs : List.List<LogTypes.ActivityLog>,
  counters : Common.Counters,
) {
  public type PerformanceRecord = {
    examId : Common.ExamId;
    examTitle : Text;
    finalScore : ?Float;
    submittedAt : Common.Timestamp;
  };

  // Helper: verify caller is a student
  private func requireStudent(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) { p };
      case null { Runtime.trap("User profile not found") };
    };
    if (profile.role != #student) {
      Runtime.trap("Unauthorized: Students only");
    };
  };

  public query ({ caller }) func getAssignedExams() : async [ExamTypes.Exam] {
    requireStudent(caller);
    let myClasses = ClassLib.getByStudent(classes, caller);
    let classIds = myClasses.map(func(c) { c.classId });
    ExamLib.getPublishedForStudent(exams, classIds);
  };

  public query ({ caller }) func getExamDetail(examId : Common.ExamId) : async ?ExamTypes.Exam {
    requireStudent(caller);
    let exam = switch (ExamLib.getById(exams, examId)) {
      case (?e) { e };
      case null { return null };
    };
    // Verify student is enrolled in the exam's class
    let cls = switch (ClassLib.getById(classes, exam.classId)) {
      case (?c) { c };
      case null { return null };
    };
    let isEnrolled = cls.studentIds.find(func(s) { Principal.equal(s, caller) }) != null;
    if (not isEnrolled) {
      Runtime.trap("Unauthorized: You are not enrolled in this class");
    };
    ?exam;
  };

  public shared ({ caller }) func submitExam(
    examId : Common.ExamId,
    textAnswers : [SubTypes.AnswerEntry],
    fileRef : ?Storage.ExternalBlob,
  ) : async SubTypes.Submission {
    requireStudent(caller);

    // Verify exam exists and is published
    let exam = switch (ExamLib.getById(exams, examId)) {
      case (?e) { e };
      case null { Runtime.trap("Exam not found") };
    };
    if (exam.status != #published) {
      Runtime.trap("Exam is not currently accepting submissions");
    };

    // Verify student is enrolled
    let cls = switch (ClassLib.getById(classes, exam.classId)) {
      case (?c) { c };
      case null { Runtime.trap("Class not found") };
    };
    let isEnrolled = cls.studentIds.find(func(s) { Principal.equal(s, caller) }) != null;
    if (not isEnrolled) {
      Runtime.trap("You are not enrolled in this class");
    };

    // Enforce one submission per student per exam
    let existingOpt = SubLib.getByStudentAndExam(submissions, caller, examId);
    if (existingOpt != null) {
      Runtime.trap("You have already submitted this exam");
    };

    let nextId = counters.nextSubmissionId;
    counters.nextSubmissionId += 1;
    let sub = SubLib.create(submissions, nextId, caller, examId, textAnswers, fileRef);

    let actorName = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) { p.name };
      case null { "Student" };
    };
    let nextLogId = counters.nextLogId;
    counters.nextLogId += 1;
    LogLib.append(activityLogs, nextLogId, caller, actorName, "submitExam", "Student submitted exam " # examId.toText());

    sub;
  };

  public query ({ caller }) func getMySubmissions() : async [SubTypes.Submission] {
    requireStudent(caller);
    SubLib.getByStudent(submissions, caller);
  };

  public query ({ caller }) func getSubmissionResult(submissionId : Common.SubmissionId) : async ?SubTypes.Result {
    requireStudent(caller);
    // Verify the submission belongs to the caller
    let sub = switch (SubLib.getById(submissions, submissionId)) {
      case (?s) { s };
      case null { return null };
    };
    if (not Principal.equal(sub.studentId, caller)) {
      Runtime.trap("Unauthorized: This submission does not belong to you");
    };
    SubLib.getResultBySubmission(results, submissionId);
  };

  public query ({ caller }) func getPerformanceHistory() : async [PerformanceRecord] {
    requireStudent(caller);
    let mySubmissions = SubLib.getByStudent(submissions, caller);
    mySubmissions.map<SubTypes.Submission, PerformanceRecord>(func(sub) {
      let examTitle = switch (ExamLib.getById(exams, sub.examId)) {
        case (?e) { e.title };
        case null { "Unknown Exam" };
      };
      let finalScore = switch (SubLib.getResultBySubmission(results, sub.submissionId)) {
        case (?r) { ?r.finalScore };
        case null { sub.aiScore };
      };
      {
        examId = sub.examId;
        examTitle;
        finalScore;
        submittedAt = sub.submittedAt;
      };
    });
  };
};
