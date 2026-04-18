import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type UserProfile = {
    name : Text;
    email : Text;
    role : Common.UserRole;
    createdAt : Common.Timestamp;
  };
};
