import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type QuestionType = {
    #multipleChoice;
    #shortAnswer;
    #essay;
  };

  public type ExamStatus = {
    #draft;
    #published;
    #closed;
  };

  public type Question = {
    questionId : Common.QuestionId;
    questionType : QuestionType;
    text : Text;
    options : [Text];
    correctAnswer : ?Text;
    pointValue : Nat;
  };

  public type Exam = {
    examId : Common.ExamId;
    title : Text;
    description : Text;
    classId : Common.ClassId;
    teacherId : Common.UserId;
    questions : [Question];
    answerKeyRef : ?Storage.ExternalBlob;
    rubricRef : ?Storage.ExternalBlob;
    scheduledAt : ?Common.Timestamp;
    durationMinutes : ?Nat;
    status : ExamStatus;
    createdAt : Common.Timestamp;
  };
};
