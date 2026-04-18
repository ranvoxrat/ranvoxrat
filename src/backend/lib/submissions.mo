import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import Common "../types/common";
import SubTypes "../types/submissions";

module {
  public type SubmissionMap = Map.Map<Common.SubmissionId, SubTypes.Submission>;
  public type ResultMap = Map.Map<Common.ResultId, SubTypes.Result>;

  public func getById(submissions : SubmissionMap, subId : Common.SubmissionId) : ?SubTypes.Submission {
    submissions.get(subId);
  };

  public func getByExam(submissions : SubmissionMap, examId : Common.ExamId) : [SubTypes.Submission] {
    submissions.values().filter(func(s) { s.examId == examId }).toArray();
  };

  public func getByStudent(submissions : SubmissionMap, studentId : Common.UserId) : [SubTypes.Submission] {
    submissions.values().filter(func(s) { Principal.equal(s.studentId, studentId) }).toArray();
  };

  public func getByStudentAndExam(submissions : SubmissionMap, studentId : Common.UserId, examId : Common.ExamId) : ?SubTypes.Submission {
    submissions.values().find(func(s) {
      Principal.equal(s.studentId, studentId) and s.examId == examId
    });
  };

  public func create(
    submissions : SubmissionMap,
    nextId : Nat,
    studentId : Common.UserId,
    examId : Common.ExamId,
    textAnswers : [SubTypes.AnswerEntry],
    fileRef : ?Storage.ExternalBlob,
  ) : SubTypes.Submission {
    let sub : SubTypes.Submission = {
      submissionId = nextId;
      studentId;
      examId;
      textAnswers;
      fileRef;
      aiScore = null;
      aiFeedback = [];
      status = #submitted;
      submittedAt = Time.now();
    };
    submissions.add(nextId, sub);
    sub;
  };

  public func updateAIGrading(
    submissions : SubmissionMap,
    subId : Common.SubmissionId,
    aiScore : Float,
    aiFeedback : [SubTypes.QuestionFeedback],
  ) {
    switch (submissions.get(subId)) {
      case (?sub) {
        submissions.add(subId, { sub with aiScore = ?aiScore; aiFeedback; status = #graded });
      };
      case null { Runtime.trap("Submission not found") };
    };
  };

  public func markGrading(submissions : SubmissionMap, subId : Common.SubmissionId) {
    switch (submissions.get(subId)) {
      case (?sub) {
        submissions.add(subId, { sub with status = #grading });
      };
      case null { Runtime.trap("Submission not found") };
    };
  };

  public func getResultBySubmission(results : ResultMap, subId : Common.SubmissionId) : ?SubTypes.Result {
    results.values().find(func(r) { r.submissionId == subId });
  };

  public func createOrUpdateResult(
    results : ResultMap,
    nextId : Nat,
    subId : Common.SubmissionId,
    finalScore : Float,
    teacherRemarks : Text,
    overriddenBy : ?Common.UserId,
  ) : SubTypes.Result {
    // Check if result already exists for this submission
    let existingOpt = results.values().find(func(r) { r.submissionId == subId });
    switch (existingOpt) {
      case (?existing) {
        let updated : SubTypes.Result = {
          existing with
          finalScore;
          teacherRemarks;
          overriddenBy;
          gradedAt = Time.now();
        };
        results.add(existing.resultId, updated);
        updated;
      };
      case null {
        let result : SubTypes.Result = {
          resultId = nextId;
          submissionId = subId;
          finalScore;
          teacherRemarks;
          overriddenBy;
          gradedAt = Time.now();
        };
        results.add(nextId, result);
        result;
      };
    };
  };
};
