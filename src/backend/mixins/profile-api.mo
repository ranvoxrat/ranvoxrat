import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import UserTypes "../types/users";
import UserLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
) {
  public query ({ caller }) func getCallerUserProfile() : async ?UserTypes.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    UserLib.getByPrincipal(users, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text, email : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let existingRole : Common.UserRole = switch (UserLib.getByPrincipal(users, caller)) {
      case (?p) { p.role };
      case null { #student };
    };
    let profile : UserTypes.UserProfile = {
      name;
      email;
      role = existingRole;
      createdAt = Time.now();
    };
    UserLib.upsert(users, caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Common.UserId) : async ?UserTypes.UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    UserLib.getByPrincipal(users, user);
  };
};
