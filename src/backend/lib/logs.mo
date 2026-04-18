import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import LogTypes "../types/logs";

module {
  public type LogList = List.List<LogTypes.ActivityLog>;

  public func append(
    logs : LogList,
    nextId : Nat,
    actorId : Common.UserId,
    actorName : Text,
    action : Text,
    details : Text,
  ) {
    let log : LogTypes.ActivityLog = {
      logId = nextId;
      actorId;
      actorName;
      action;
      details;
      timestamp = Time.now();
    };
    logs.add(log);
  };

  public func getAll(logs : LogList) : [LogTypes.ActivityLog] {
    logs.toArray();
  };

  public func getRecent(logs : LogList, limit : Nat) : [LogTypes.ActivityLog] {
    let total = logs.size();
    if (total <= limit) {
      logs.toArray();
    } else {
      logs.sliceToArray((total - limit : Int), total);
    };
  };
};
