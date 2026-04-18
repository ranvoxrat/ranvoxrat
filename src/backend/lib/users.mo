import Map "mo:core/Map";
import Time "mo:core/Time";
import Common "../types/common";
import UserTypes "../types/users";

module {
  public type UserMap = Map.Map<Common.UserId, UserTypes.UserProfile>;

  public func getAll(users : UserMap) : [(Common.UserId, UserTypes.UserProfile)] {
    users.toArray();
  };

  public func getByPrincipal(users : UserMap, id : Common.UserId) : ?UserTypes.UserProfile {
    users.get(id);
  };

  public func upsert(users : UserMap, id : Common.UserId, profile : UserTypes.UserProfile) {
    users.add(id, profile);
  };

  public func updateRole(users : UserMap, id : Common.UserId, role : Common.UserRole) {
    switch (users.get(id)) {
      case (?profile) {
        users.add(id, { profile with role });
      };
      case null {};
    };
  };

  // On-chain there is no password — returns a placeholder token for the caller to relay
  public func resetPassword(_users : UserMap, _id : Common.UserId) : Text {
    // On IC, authentication is via Internet Identity — no passwords to reset.
    // Return a notice string for UI display.
    "Internet Identity does not use passwords. Ask user to re-authenticate."
  };

  public func countByRole(users : UserMap, role : Common.UserRole) : Nat {
    users.foldLeft<Common.UserId, UserTypes.UserProfile, Nat>(
      0,
      func(acc, _k, v) {
        if (v.role == role) { acc + 1 } else { acc };
      },
    );
  };
};
