import Common "common";

module {
  public type Class = {
    classId : Common.ClassId;
    name : Text;
    teacherId : Common.UserId;
    studentIds : [Common.UserId];
    createdAt : Common.Timestamp;
  };
};
