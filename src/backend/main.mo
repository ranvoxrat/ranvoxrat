import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Common "types/common";
import UserTypes "types/users";
import ClassTypes "types/classes";
import ExamTypes "types/exams";
import SubTypes "types/submissions";
import LogTypes "types/logs";
import ProfileMixin "mixins/profile-api";
import AdminMixin "mixins/admin-api";
import TeacherMixin "mixins/teacher-api";
import StudentMixin "mixins/student-api";

actor {
  // Extension infrastructure
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinObjectStorage();

  // HTTP outcall transform (required by extension)
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // State
  let users = Map.empty<Common.UserId, UserTypes.UserProfile>();
  let classes = Map.empty<Common.ClassId, ClassTypes.Class>();
  let exams = Map.empty<Common.ExamId, ExamTypes.Exam>();
  let submissions = Map.empty<Common.SubmissionId, SubTypes.Submission>();
  let results = Map.empty<Common.ResultId, SubTypes.Result>();
  let activityLogs = List.empty<LogTypes.ActivityLog>();

  let counters : Common.Counters = {
    var nextClassId = 1;
    var nextExamId = 1;
    var nextSubmissionId = 1;
    var nextResultId = 1;
    var nextLogId = 1;
  };

  let openAIKey : { var value : Text } = { var value = "" };

  // Mixins
  include ProfileMixin(accessControlState, users);

  include AdminMixin(
    accessControlState,
    users,
    exams,
    submissions,
    activityLogs,
    counters,
  );

  include TeacherMixin(
    accessControlState,
    users,
    classes,
    exams,
    submissions,
    results,
    activityLogs,
    counters,
    openAIKey,
    transform,
  );

  include StudentMixin(
    accessControlState,
    users,
    classes,
    exams,
    submissions,
    results,
    activityLogs,
    counters,
  );
};
