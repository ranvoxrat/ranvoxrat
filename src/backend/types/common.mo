module {
  public type UserId = Principal;
  public type Timestamp = Int;
  public type ExamId = Nat;
  public type ClassId = Nat;
  public type SubmissionId = Nat;
  public type ResultId = Nat;
  public type QuestionId = Nat;
  public type LogId = Nat;

  public type UserRole = {
    #admin;
    #teacher;
    #student;
  };

  public type Counters = {
    var nextClassId : Nat;
    var nextExamId : Nat;
    var nextSubmissionId : Nat;
    var nextResultId : Nat;
    var nextLogId : Nat;
  };
};
