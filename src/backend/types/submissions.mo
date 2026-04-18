import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type SubmissionStatus = {
    #submitted;
    #grading;
    #graded;
  };

  public type AnswerEntry = {
    questionId : Common.QuestionId;
    text : Text;
  };

  public type QuestionFeedback = {
    questionId : Common.QuestionId;
    feedback : Text;
    score : Float;
  };

  public type Submission = {
    submissionId : Common.SubmissionId;
    studentId : Common.UserId;
    examId : Common.ExamId;
    textAnswers : [AnswerEntry];
    fileRef : ?Storage.ExternalBlob;
    aiScore : ?Float;
    aiFeedback : [QuestionFeedback];
    status : SubmissionStatus;
    submittedAt : Common.Timestamp;
  };

  public type Result = {
    resultId : Common.ResultId;
    submissionId : Common.SubmissionId;
    finalScore : Float;
    teacherRemarks : Text;
    overriddenBy : ?Common.UserId;
    gradedAt : Common.Timestamp;
  };
};
