import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "../types/common";
import ClassTypes "../types/classes";
import ExamTypes "../types/exams";
import SubTypes "../types/submissions";
import UserTypes "../types/users";
import LogTypes "../types/logs";
import ClassLib "../lib/classes";
import ExamLib "../lib/exams";
import SubLib "../lib/submissions";
import LogLib "../lib/logs";
import UserLib "../lib/users";
import GradingLib "../lib/grading";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  classes : Map.Map<Common.ClassId, ClassTypes.Class>,
  exams : Map.Map<Common.ExamId, ExamTypes.Exam>,
  submissions : Map.Map<Common.SubmissionId, SubTypes.Submission>,
  results : Map.Map<Common.ResultId, SubTypes.Result>,
  activityLogs : List.List<LogTypes.ActivityLog>,
  counters : Common.Counters,
  openAIKey : { var value : Text },
  transform : OutCall.Transform,
) {
  public type ClassAnalytics = {
    examCount : Nat;
    submissionCount : Nat;
    averageScore : Float;
    topStudents : [(Common.UserId, Float)];
    failingStudents : [(Common.UserId, Float)];
  };

  // Returns the caller's display name or principal text.
  private func callerName(caller : Principal) : Text {
    switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p.name;
      case null caller.toText();
    };
  };

  // Verify caller is a registered teacher or admin.
  private func requireTeacher(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (profile.role != #teacher and profile.role != #admin) {
      Runtime.trap("Unauthorized: Teachers only");
    };
  };

  // Admin-only: configure the OpenAI API key used for AI grading.
  public shared ({ caller }) func setOpenAIKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    openAIKey.value := key;
  };

  // Returns classes visible to the caller (admin sees all, teacher sees own, student sees enrolled).
  public query ({ caller }) func getClasses() : async [ClassTypes.Class] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    switch (profile.role) {
      case (#admin) ClassLib.getAll(classes);
      case (#teacher) ClassLib.getByTeacher(classes, caller);
      case (#student) ClassLib.getByStudent(classes, caller);
    };
  };

  // Creates a new class owned by the calling teacher.
  public shared ({ caller }) func createClass(name : Text) : async ClassTypes.Class {
    requireTeacher(caller);
    let cls = ClassLib.create(classes, counters.nextClassId, name, caller);
    counters.nextClassId += 1;
    LogLib.append(activityLogs, counters.nextLogId, caller, callerName(caller), "createClass", "Created class: " # name);
    counters.nextLogId += 1;
    cls;
  };

  // Updates a class name; only the owning teacher or admin may do this.
  public shared ({ caller }) func updateClass(classId : Common.ClassId, name : Text) : async () {
    requireTeacher(caller);
    let cls = switch (ClassLib.getById(classes, classId)) {
      case (?c) c;
      case null Runtime.trap("Class not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(cls.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: You do not own this class");
    };
    ClassLib.update(classes, classId, name);
    LogLib.append(activityLogs, counters.nextLogId, caller, callerName(caller), "updateClass", "Updated class " # classId.toText() # " to: " # name);
    counters.nextLogId += 1;
  };

  // Returns exams visible to the caller.
  public query ({ caller }) func getExams() : async [ExamTypes.Exam] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    switch (profile.role) {
      case (#admin) ExamLib.getAll(exams);
      case (#teacher) ExamLib.getByTeacher(exams, caller);
      case (#student) {
        let myClasses = ClassLib.getByStudent(classes, caller);
        let classIds = myClasses.map(func(c) { c.classId });
        ExamLib.getPublishedForStudent(exams, classIds);
      };
    };
  };

  // Creates a new exam under a class owned by the calling teacher.
  public shared ({ caller }) func createExam(
    title : Text,
    description : Text,
    classId : Common.ClassId,
    questions : [ExamTypes.Question],
    scheduledAt : ?Common.Timestamp,
    durationMinutes : ?Nat,
  ) : async ExamTypes.Exam {
    requireTeacher(caller);
    let cls = switch (ClassLib.getById(classes, classId)) {
      case (?c) c;
      case null Runtime.trap("Class not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(cls.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: You do not own this class");
    };
    let exam = ExamLib.create(exams, counters.nextExamId, title, description, classId, caller, questions, scheduledAt, durationMinutes);
    counters.nextExamId += 1;
    LogLib.append(activityLogs, counters.nextLogId, caller, callerName(caller), "createExam", "Created exam: " # title);
    counters.nextLogId += 1;
    exam;
  };

  // Updates an existing exam; only the owning teacher or admin may do this.
  public shared ({ caller }) func updateExam(
    examId : Common.ExamId,
    title : Text,
    description : Text,
    questions : [ExamTypes.Question],
    answerKeyRef : ?Storage.ExternalBlob,
    rubricRef : ?Storage.ExternalBlob,
    scheduledAt : ?Common.Timestamp,
    durationMinutes : ?Nat,
  ) : async () {
    requireTeacher(caller);
    let exam = switch (ExamLib.getById(exams, examId)) {
      case (?e) e;
      case null Runtime.trap("Exam not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(exam.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: You do not own this exam");
    };
    ExamLib.update(exams, examId, title, description, questions, answerKeyRef, rubricRef, scheduledAt, durationMinutes);
    LogLib.append(activityLogs, counters.nextLogId, caller, callerName(caller), "updateExam", "Updated exam " # examId.toText() # ": " # title);
    counters.nextLogId += 1;
  };

  // Publishes an exam so students can take it.
  public shared ({ caller }) func publishExam(examId : Common.ExamId) : async () {
    requireTeacher(caller);
    let exam = switch (ExamLib.getById(exams, examId)) {
      case (?e) e;
      case null Runtime.trap("Exam not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(exam.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: You do not own this exam");
    };
    ExamLib.publish(exams, examId);
    LogLib.append(activityLogs, counters.nextLogId, caller, callerName(caller), "publishExam", "Published exam " # examId.toText());
    counters.nextLogId += 1;
  };

  // Returns all submissions for a given exam; only the exam's teacher or admin may view.
  public query ({ caller }) func getSubmissions(examId : Common.ExamId) : async [SubTypes.Submission] {
    requireTeacher(caller);
    let exam = switch (ExamLib.getById(exams, examId)) {
      case (?e) e;
      case null Runtime.trap("Exam not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(exam.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: Only the exam owner can view submissions");
    };
    SubLib.getByExam(submissions, examId);
  };

  // Triggers AI grading for a submission.
  // Multiple choice questions are auto-graded by comparing student answer to correctAnswer.
  // Short answer and essay questions are sent to OpenAI gpt-4o-mini for evaluation.
  // On success: stores aiScore, aiFeedback, and marks submission as #graded.
  // On failure: leaves status as #submitted and traps with the error.
  public shared ({ caller }) func triggerAIGrading(submissionId : Common.SubmissionId) : async () {
    requireTeacher(caller);
    let sub = switch (SubLib.getById(submissions, submissionId)) {
      case (?s) s;
      case null Runtime.trap("Submission not found");
    };
    let exam = switch (ExamLib.getById(exams, sub.examId)) {
      case (?e) e;
      case null Runtime.trap("Exam not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(exam.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: Only the exam teacher can trigger grading");
    };

    // Auto-grade multiple choice questions
    let mcFeedbacks = autoGradeMultipleChoice(exam.questions, sub.textAnswers);
    var totalScore : Float = mcFeedbacks.foldLeft<Float, SubTypes.QuestionFeedback>(0.0, func(acc : Float, fb : SubTypes.QuestionFeedback) : Float { acc + fb.score });
    var allFeedbacks : [SubTypes.QuestionFeedback] = mcFeedbacks.toArray();

    // Collect non-MC questions for AI grading
    let aiQuestions = exam.questions.filter(func(q : ExamTypes.Question) : Bool {
      switch (q.questionType) {
        case (#multipleChoice) false;
        case _ true;
      };
    });

    if (aiQuestions.size() > 0) {
      let apiKey = openAIKey.value;
      if (apiKey == "") Runtime.trap("OpenAI API key not configured. Call setOpenAIKey first.");

      // Mark as grading in progress
      SubLib.markGrading(submissions, submissionId);

      // Build the prompt using only non-MC questions and their answers
      let aiAnswers = sub.textAnswers.filter(func(a : SubTypes.AnswerEntry) : Bool {
        aiQuestions.find(func(q : ExamTypes.Question) : Bool { q.questionId == a.questionId }) != null
      });

      let promptContent = GradingLib.buildPrompt(aiQuestions, aiAnswers, null);

      let requestBody =
        "{\"model\":\"gpt-4o-mini\"," #
        "\"messages\":[" #
        "{\"role\":\"system\",\"content\":\"You are an expert exam grader. Always respond with a valid JSON array only, no other text.\"}," #
        "{\"role\":\"user\",\"content\":" # jsonStringLiteral(promptContent) # "}" #
        "]}";

      let headers : [OutCall.Header] = [
        { name = "Authorization"; value = "Bearer " # apiKey },
        { name = "Content-Type"; value = "application/json" },
      ];

      let responseJson = await OutCall.httpPostRequest(
        "https://api.openai.com/v1/chat/completions",
        headers,
        requestBody,
        transform,
      );

      let (aiScore, aiFeedback) = GradingLib.parseGradingResponse(responseJson, aiQuestions);
      totalScore += aiScore;
      allFeedbacks := allFeedbacks.concat(aiFeedback);
    };

    // Persist the grading results on the submission
    SubLib.updateAIGrading(submissions, submissionId, totalScore, allFeedbacks);

    LogLib.append(
      activityLogs,
      counters.nextLogId,
      caller,
      callerName(caller),
      "triggerAIGrading",
      "AI graded submission " # submissionId.toText(),
    );
    counters.nextLogId += 1;
  };

  // Allows a teacher to manually override the final score for a submission.
  public shared ({ caller }) func overrideScore(
    submissionId : Common.SubmissionId,
    finalScore : Float,
    teacherRemarks : Text,
  ) : async () {
    requireTeacher(caller);
    let sub = switch (SubLib.getById(submissions, submissionId)) {
      case (?s) s;
      case null Runtime.trap("Submission not found");
    };
    let exam = switch (ExamLib.getById(exams, sub.examId)) {
      case (?e) e;
      case null Runtime.trap("Exam not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(exam.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: Only the exam teacher can override scores");
    };

    let existingResult = SubLib.getResultBySubmission(results, submissionId);
    let resultId = switch (existingResult) {
      case (?r) r.resultId;
      case null {
        let id = counters.nextResultId;
        counters.nextResultId += 1;
        id;
      };
    };
    ignore SubLib.createOrUpdateResult(results, resultId, submissionId, finalScore, teacherRemarks, ?caller);

    LogLib.append(
      activityLogs,
      counters.nextLogId,
      caller,
      callerName(caller),
      "overrideScore",
      "Override score for submission " # submissionId.toText() # " to " # debug_show(finalScore),
    );
    counters.nextLogId += 1;
  };

  // Returns analytics for a class.
  public query ({ caller }) func getClassAnalytics(classId : Common.ClassId) : async ClassAnalytics {
    requireTeacher(caller);
    let cls = switch (ClassLib.getById(classes, classId)) {
      case (?c) c;
      case null Runtime.trap("Class not found");
    };
    let profile = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) p;
      case null Runtime.trap("User profile not found");
    };
    if (not Principal.equal(cls.teacherId, caller) and profile.role != #admin) {
      Runtime.trap("Unauthorized: Only the class teacher can view analytics");
    };

    let classExams = ExamLib.getByClass(exams, classId);
    let examCount = classExams.size();

    var totalScore : Float = 0.0;
    var gradedCount = 0;
    var submissionCount = 0;
    let studentScores = Map.empty<Common.UserId, (Float, Nat)>();

    for (exam in classExams.values()) {
      let examSubs = SubLib.getByExam(submissions, exam.examId);
      submissionCount += examSubs.size();
      for (sub in examSubs.values()) {
        let scoreOpt = switch (SubLib.getResultBySubmission(results, sub.submissionId)) {
          case (?r) ?r.finalScore;
          case null sub.aiScore;
        };
        switch (scoreOpt) {
          case (?score) {
            totalScore += score;
            gradedCount += 1;
            let prev = switch (studentScores.get(sub.studentId)) {
              case (?sc) sc;
              case null (0.0, 0);
            };
            studentScores.add(sub.studentId, (prev.0 + score, prev.1 + 1));
          };
          case null {};
        };
      };
    };

    let averageScore = if (gradedCount == 0) 0.0 else totalScore / gradedCount.toFloat();

    let studentAvgs = studentScores.entries()
      .map(func(entry) {
        let id = entry.0;
        let total = entry.1.0;
        let cnt = entry.1.1;
        (id, if (cnt == 0) 0.0 else total / cnt.toFloat())
      })
      .toArray();

    let sorted = studentAvgs.sort(func(a : (Common.UserId, Float), b : (Common.UserId, Float)) : { #less; #equal; #greater } {
      if (a.1 > b.1) #less else if (a.1 < b.1) #greater else #equal
    });

    let topCount = if (sorted.size() < 5) sorted.size() else 5;
    let topStudents = sorted.sliceToArray(0, topCount);

    let failCount = if (sorted.size() < 5) sorted.size() else 5;
    let failStart = if (sorted.size() > failCount) (sorted.size() - failCount : Nat) else 0;
    let failingStudents = sorted.sliceToArray(failStart, sorted.size());

    { examCount; submissionCount; averageScore; topStudents; failingStudents };
  };

  // --- Private helpers ---

  // Auto-grade multiple choice questions by comparing student answer to correctAnswer.
  private func autoGradeMultipleChoice(
    questions : [ExamTypes.Question],
    answers : [SubTypes.AnswerEntry],
  ) : List.List<SubTypes.QuestionFeedback> {
    let feedbacks = List.empty<SubTypes.QuestionFeedback>();
    for (q in questions.values()) {
      switch (q.questionType) {
        case (#multipleChoice) {
          let studentAnswerOpt = answers.find(func(a : SubTypes.AnswerEntry) : Bool { a.questionId == q.questionId });
          switch (q.correctAnswer, studentAnswerOpt) {
            case (?correct, ?given) {
              let isCorrect = correct == given.text;
              feedbacks.add({
                questionId = q.questionId;
                score = if (isCorrect) q.pointValue.toFloat() else 0.0;
                feedback = if (isCorrect) "Correct!" else "Incorrect. The correct answer is: " # correct;
              });
            };
            case (_, null) {
              feedbacks.add({ questionId = q.questionId; score = 0.0; feedback = "No answer provided." });
            };
            case (null, _) {
              feedbacks.add({ questionId = q.questionId; score = 0.0; feedback = "No answer key configured." });
            };
          };
        };
        case _ {}; // Non-MC handled by AI
      };
    };
    feedbacks;
  };

  // Escape a Text value as a JSON string literal (with surrounding double quotes).
  private func jsonStringLiteral(text : Text) : Text {
    let dquote = Char.fromNat32(34); // "
    let backslash = Char.fromNat32(92); // \
    var result = "\"";
    for (ch in text.toIter()) {
      let escaped : Text = if (ch == dquote) {
        "\\\""
      } else if (ch == backslash) {
        "\\\\"
      } else if (ch == '\n') {
        "\\n"
      } else if (ch == '\t') {
        "\\t"
      } else if (ch == '\r') {
        "\\r"
      } else {
        Text.fromChar(ch)
      };
      result := result # escaped;
    };
    result # "\"";
  };
};
