import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Storage "mo:caffeineai-object-storage/Storage";
import Common "../types/common";
import ExamTypes "../types/exams";

module {
  public type ExamMap = Map.Map<Common.ExamId, ExamTypes.Exam>;

  public func getAll(exams : ExamMap) : [ExamTypes.Exam] {
    exams.values().toArray();
  };

  public func getById(exams : ExamMap, examId : Common.ExamId) : ?ExamTypes.Exam {
    exams.get(examId);
  };

  public func getByClass(exams : ExamMap, classId : Common.ClassId) : [ExamTypes.Exam] {
    exams.values().filter(func(e) { e.classId == classId }).toArray();
  };

  public func getByTeacher(exams : ExamMap, teacherId : Common.UserId) : [ExamTypes.Exam] {
    exams.values().filter(func(e) { e.teacherId == teacherId }).toArray();
  };

  public func getPublishedForStudent(exams : ExamMap, classIds : [Common.ClassId]) : [ExamTypes.Exam] {
    exams.values().filter(func(e) {
      e.status == #published and
      classIds.find(func(cid) { cid == e.classId }) != null
    }).toArray();
  };

  public func create(
    exams : ExamMap,
    nextId : Nat,
    title : Text,
    description : Text,
    classId : Common.ClassId,
    teacherId : Common.UserId,
    questions : [ExamTypes.Question],
    scheduledAt : ?Common.Timestamp,
    durationMinutes : ?Nat,
  ) : ExamTypes.Exam {
    let exam : ExamTypes.Exam = {
      examId = nextId;
      title;
      description;
      classId;
      teacherId;
      questions;
      answerKeyRef = null;
      rubricRef = null;
      scheduledAt;
      durationMinutes;
      status = #draft;
      createdAt = Time.now();
    };
    exams.add(nextId, exam);
    exam;
  };

  public func update(
    exams : ExamMap,
    examId : Common.ExamId,
    title : Text,
    description : Text,
    questions : [ExamTypes.Question],
    answerKeyRef : ?Storage.ExternalBlob,
    rubricRef : ?Storage.ExternalBlob,
    scheduledAt : ?Common.Timestamp,
    durationMinutes : ?Nat,
  ) {
    switch (exams.get(examId)) {
      case (?exam) {
        exams.add(examId, { exam with title; description; questions; answerKeyRef; rubricRef; scheduledAt; durationMinutes });
      };
      case null { Runtime.trap("Exam not found") };
    };
  };

  public func publish(exams : ExamMap, examId : Common.ExamId) {
    switch (exams.get(examId)) {
      case (?exam) {
        exams.add(examId, { exam with status = #published });
      };
      case null { Runtime.trap("Exam not found") };
    };
  };

  public func close(exams : ExamMap, examId : Common.ExamId) {
    switch (exams.get(examId)) {
      case (?exam) {
        exams.add(examId, { exam with status = #closed });
      };
      case null { Runtime.trap("Exam not found") };
    };
  };
};
