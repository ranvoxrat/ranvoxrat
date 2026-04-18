import List "mo:core/List";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Char "mo:core/Char";
import ExamTypes "../types/exams";
import SubTypes "../types/submissions";

module {
  // Build an OpenAI-compatible prompt for grading.
  // Returns text to be used as the user message content.
  public func buildPrompt(
    questions : [ExamTypes.Question],
    answers : [SubTypes.AnswerEntry],
    rubricText : ?Text,
  ) : Text {
    var prompt = "You are an exam grader. Grade each question based on the rubric and answer key.\n\n";

    switch (rubricText) {
      case (?rubric) { prompt := prompt # "RUBRIC:\n" # rubric # "\n\n" };
      case null {};
    };

    prompt := prompt # "QUESTIONS AND STUDENT ANSWERS:\n";

    for (q in questions.values()) {
      let studentAnswer = switch (answers.find(func(a : SubTypes.AnswerEntry) : Bool { a.questionId == q.questionId })) {
        case (?a) a.text;
        case null "(no answer provided)";
      };

      prompt := prompt # "---\n";
      prompt := prompt # "Question ID: " # q.questionId.toText() # "\n";
      prompt := prompt # "Type: " # questionTypeLabel(q.questionType) # "\n";
      prompt := prompt # "Question: " # q.text # "\n";
      prompt := prompt # "Max Points: " # q.pointValue.toText() # "\n";

      switch (q.correctAnswer) {
        case (?ca) { prompt := prompt # "Answer Key: " # ca # "\n" };
        case null {};
      };

      prompt := prompt # "Student Answer: " # studentAnswer # "\n";
    };

    prompt := prompt # "\n";
    prompt := prompt # "Respond with ONLY a JSON array in this exact format:\n";
    prompt := prompt # "[{\"questionId\":1,\"score\":3.5,\"feedback\":\"Good attempt but missing key detail\"}]\n";
    prompt := prompt # "score must be a number between 0 and the max points. Do not write anything outside the JSON array.";

    prompt;
  };

  // Parse the JSON response from OpenAI chat completions API.
  // Extracts per-question scores and feedback, then computes total score.
  // Returns (totalAiScore, feedbackArray).
  public func parseGradingResponse(
    responseJson : Text,
    questions : [ExamTypes.Question],
  ) : (Float, [SubTypes.QuestionFeedback]) {
    // Extract the "content" string from the OpenAI response
    let content = extractContentField(responseJson);

    // Parse the grading JSON array from the content
    let feedbacks = parseGradingArray(content, questions);

    let totalScore = feedbacks.foldLeft(
      0.0,
      func(acc, fb) { acc + fb.score },
    );

    (totalScore, feedbacks.toArray());
  };

  // --- Private helpers ---

  private func questionTypeLabel(qt : ExamTypes.QuestionType) : Text {
    switch (qt) {
      case (#multipleChoice) "Multiple Choice";
      case (#shortAnswer) "Short Answer";
      case (#essay) "Essay";
    };
  };

  // Extract the content field value from an OpenAI chat completions JSON response.
  // Looks for the pattern: "content":"<value>"
  private func extractContentField(json : Text) : Text {
    let key = "\"content\":\"";
    switch (substringAfter(json, key)) {
      case (?rest) unescapeJsonString(rest);
      case null json; // fallback: treat whole response as content
    };
  };

  // Find the text after the first occurrence of needle in haystack.
  private func substringAfter(haystack : Text, needle : Text) : ?Text {
    let hs = haystack.toArray();
    let nd = needle.toArray();
    let hsLen = hs.size();
    let ndLen = nd.size();
    if (ndLen == 0) return ?haystack;

    var i = 0;
    while (i + ndLen <= hsLen) {
      var match = true;
      var j = 0;
      while (j < ndLen and match) {
        if (hs[i + j] != nd[j]) { match := false };
        j += 1;
      };
      if (match) {
        return ?Text.fromIter(hs.values().drop(i + ndLen));
      };
      i += 1;
    };
    null;
  };

  // Unescape a JSON string value, stopping at the first unescaped closing quote.
  private func unescapeJsonString(text : Text) : Text {
    let dquote = Char.fromNat32(34); // "
    let backslash = Char.fromNat32(92); // \
    var result = "";
    var escaped = false;
    for (ch in text.toIter()) {
      if (escaped) {
        let unesc : Text = if (ch == 'n') {
          "\n"
        } else if (ch == 't') {
          "\t"
        } else if (ch == 'r') {
          "\r"
        } else if (ch == backslash) {
          "\\"
        } else if (ch == dquote) {
          "\""
        } else {
          Text.fromChar(ch)
        };
        result := result # unesc;
        escaped := false;
      } else if (ch == backslash) {
        escaped := true;
      } else if (ch == dquote) {
        return result;
      } else {
        result := result # Text.fromChar(ch);
      };
    };
    result;
  };

  // Parse individual fields from a JSON object fragment (text between '{' and '}').
  // Returns ?Nat for questionId, ?Float for score, ?Text for feedback.
  private func parseObject(obj : Text) : ?(Nat, Float, Text) {
    let qidOpt = extractNatField(obj, "\"questionId\":");
    let scoreOpt = extractFloatField(obj, "\"score\":");
    let feedbackOpt = extractStringField(obj, "\"feedback\":\"");

    switch (qidOpt, scoreOpt) {
      case (?qid, ?score) {
        let feedback = switch (feedbackOpt) {
          case (?f) f;
          case null "";
        };
        ?(qid, score, feedback);
      };
      case _ null;
    };
  };

  // Parse a JSON array of grading objects and return List<QuestionFeedback>.
  private func parseGradingArray(
    content : Text,
    questions : [ExamTypes.Question],
  ) : List.List<SubTypes.QuestionFeedback> {
    let results = List.empty<SubTypes.QuestionFeedback>();
    // Split on '}' to get fragments, each containing one object's fields
    let parts = content.split(#char '}');
    for (part in parts) {
      switch (parseObject(part)) {
        case (?(qid, rawScore, feedback)) {
          // Clamp score to [0, maxPoints]
          let maxScore = switch (questions.find(func(q : ExamTypes.Question) : Bool { q.questionId == qid })) {
            case (?q) q.pointValue.toFloat();
            case null rawScore;
          };
          let score = if (rawScore < 0.0) { 0.0 } else if (rawScore > maxScore) { maxScore } else { rawScore };
          results.add({ questionId = qid; score; feedback });
        };
        case null {};
      };
    };
    results;
  };

  // Extract a Nat value after the given key in the text.
  private func extractNatField(text : Text, key : Text) : ?Nat {
    switch (substringAfter(text, key)) {
      case (?rest) {
        var numStr = "";
        var started = false;
        for (ch in rest.toIter()) {
          if (ch >= '0' and ch <= '9') {
            numStr := numStr # Text.fromChar(ch);
            started := true;
          } else if (started) {
            return Nat.fromText(numStr);
          };
        };
        if (started) Nat.fromText(numStr) else null;
      };
      case null null;
    };
  };

  // Extract a Float value after the given key in the text.
  // Parses optional leading digits, optional '.', then more digits.
  private func extractFloatField(text : Text, key : Text) : ?Float {
    switch (substringAfter(text, key)) {
      case (?rest) {
        var intPart : Int = 0;
        var fracPart : Int = 0;
        var fracDiv : Int = 1;
        var inFrac = false;
        var started = false;
        var negative = false;

        for (ch in rest.toIter()) {
          if (not started and ch == '-') {
            negative := true;
          } else if (ch >= '0' and ch <= '9') {
            let digit : Int = switch (ch) {
              case '0' 0; case '1' 1; case '2' 2; case '3' 3; case '4' 4;
              case '5' 5; case '6' 6; case '7' 7; case '8' 8; case '9' 9;
              case _ 0;
            };
            if (inFrac) {
              fracPart := fracPart * 10 + digit;
              fracDiv := fracDiv * 10;
            } else {
              intPart := intPart * 10 + digit;
            };
            started := true;
          } else if (ch == '.' and not inFrac and started) {
            inFrac := true;
          } else if (started) {
            // Stop at first non-numeric character
            let value = intPart.toFloat() + fracPart.toFloat() / fracDiv.toFloat();
            return ?(if (negative) -value else value);
          };
        };

        if (started) {
          let value = intPart.toFloat() + fracPart.toFloat() / fracDiv.toFloat();
          ?(if (negative) -value else value);
        } else null;
      };
      case null null;
    };
  };

  // Extract a JSON string field value after the given key pattern (key includes opening quote).
  private func extractStringField(text : Text, key : Text) : ?Text {
    switch (substringAfter(text, key)) {
      case (?rest) ?unescapeJsonString(rest);
      case null null;
    };
  };
};
