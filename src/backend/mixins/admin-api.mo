import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import UserTypes "../types/users";
import ExamTypes "../types/exams";
import SubTypes "../types/submissions";
import LogTypes "../types/logs";
import UserLib "../lib/users";
import LogLib "../lib/logs";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  exams : Map.Map<Common.ExamId, ExamTypes.Exam>,
  submissions : Map.Map<Common.SubmissionId, SubTypes.Submission>,
  activityLogs : List.List<LogTypes.ActivityLog>,
  counters : Common.Counters,
) {
  public type DashboardStats = {
    totalTeachers : Nat;
    totalStudents : Nat;
    totalAdmins : Nat;
    activeExams : Nat;
    pendingSubmissions : Nat;
    recentActivityCount : Nat;
  };

  public query ({ caller }) func getUsers() : async [(Common.UserId, UserTypes.UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    UserLib.getAll(users);
  };

  public shared ({ caller }) func inviteUser(
    targetPrincipal : Common.UserId,
    name : Text,
    email : Text,
    role : Common.UserRole,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let profile : UserTypes.UserProfile = {
      name;
      email;
      role;
      createdAt = Time.now();
    };
    UserLib.upsert(users, targetPrincipal, profile);

    // Assign role in access control
    let acRole : AccessControl.UserRole = switch (role) {
      case (#admin) { #admin };
      case (#teacher) { #user };
      case (#student) { #user };
    };
    AccessControl.assignRole(accessControlState, caller, targetPrincipal, acRole);

    let actorName = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) { p.name };
      case null { "Admin" };
    };
    let nextId = counters.nextLogId;
    counters.nextLogId += 1;
    LogLib.append(activityLogs, nextId, caller, actorName, "inviteUser", "Invited user " # name # " with role " # debug_show(role));
  };

  public shared ({ caller }) func updateUserRole(targetPrincipal : Common.UserId, role : Common.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    UserLib.updateRole(users, targetPrincipal, role);

    let acRole : AccessControl.UserRole = switch (role) {
      case (#admin) { #admin };
      case (#teacher) { #user };
      case (#student) { #user };
    };
    AccessControl.assignRole(accessControlState, caller, targetPrincipal, acRole);

    let actorName = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) { p.name };
      case null { "Admin" };
    };
    let nextId = counters.nextLogId;
    counters.nextLogId += 1;
    LogLib.append(activityLogs, nextId, caller, actorName, "updateUserRole", "Updated role for " # targetPrincipal.toText() # " to " # debug_show(role));
  };

  public shared ({ caller }) func resetUserPassword(targetPrincipal : Common.UserId) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let result = UserLib.resetPassword(users, targetPrincipal);
    let actorName = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) { p.name };
      case null { "Admin" };
    };
    let nextId = counters.nextLogId;
    counters.nextLogId += 1;
    LogLib.append(activityLogs, nextId, caller, actorName, "resetUserPassword", "Reset password for " # targetPrincipal.toText());
    result;
  };

  public query ({ caller }) func getActivityLogs() : async [LogTypes.ActivityLog] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    LogLib.getAll(activityLogs);
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admins only");
    };
    let activeExams = exams.values().filter(func(e) { e.status == #published }).size();
    let pendingSubmissions = submissions.values().filter(func(s) { s.status == #submitted or s.status == #grading }).size();
    {
      totalTeachers = UserLib.countByRole(users, #teacher);
      totalStudents = UserLib.countByRole(users, #student);
      totalAdmins = UserLib.countByRole(users, #admin);
      activeExams;
      pendingSubmissions;
      recentActivityCount = LogLib.getRecent(activityLogs, 10).size();
    };
  };
};
