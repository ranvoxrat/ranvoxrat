import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Common "../types/common";
import ClassTypes "../types/classes";

module {
  public type ClassMap = Map.Map<Common.ClassId, ClassTypes.Class>;

  public func getAll(classes : ClassMap) : [ClassTypes.Class] {
    classes.values().toArray();
  };

  public func getByTeacher(classes : ClassMap, teacherId : Common.UserId) : [ClassTypes.Class] {
    classes.values().filter(func(c) { Principal.equal(c.teacherId, teacherId) }).toArray();
  };

  public func getByStudent(classes : ClassMap, studentId : Common.UserId) : [ClassTypes.Class] {
    classes.values().filter(func(c) {
      c.studentIds.find(func(s) { Principal.equal(s, studentId) }) != null
    }).toArray();
  };

  public func getById(classes : ClassMap, classId : Common.ClassId) : ?ClassTypes.Class {
    classes.get(classId);
  };

  public func create(classes : ClassMap, nextId : Nat, name : Text, teacherId : Common.UserId) : ClassTypes.Class {
    let cls : ClassTypes.Class = {
      classId = nextId;
      name;
      teacherId;
      studentIds = [];
      createdAt = Time.now();
    };
    classes.add(nextId, cls);
    cls;
  };

  public func update(classes : ClassMap, classId : Common.ClassId, name : Text) {
    switch (classes.get(classId)) {
      case (?cls) {
        classes.add(classId, { cls with name });
      };
      case null {};
    };
  };

  public func addStudent(classes : ClassMap, classId : Common.ClassId, studentId : Common.UserId) {
    switch (classes.get(classId)) {
      case (?cls) {
        let alreadyEnrolled = cls.studentIds.find(func(s) { Principal.equal(s, studentId) }) != null;
        if (not alreadyEnrolled) {
          classes.add(classId, { cls with studentIds = cls.studentIds.concat([studentId]) });
        };
      };
      case null {};
    };
  };

  public func removeStudent(classes : ClassMap, classId : Common.ClassId, studentId : Common.UserId) {
    switch (classes.get(classId)) {
      case (?cls) {
        let filtered = cls.studentIds.filter(func(s) { not Principal.equal(s, studentId) });
        classes.add(classId, { cls with studentIds = filtered });
      };
      case null {};
    };
  };
};
