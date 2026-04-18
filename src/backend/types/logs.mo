import Common "common";

module {
  public type ActivityLog = {
    logId : Common.LogId;
    actorId : Common.UserId;
    actorName : Text;
    action : Text;
    details : Text;
    timestamp : Common.Timestamp;
  };
};
