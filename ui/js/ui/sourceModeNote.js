export function buildSourceModeNote(profile) {
  if (!profile || profile.mode === "empty") {
    return "Waiting for code.";
  }

  if (profile.mode === "run") {
    return "Detected simplified teaching language. This code can run in the browser interpreter.";
  }

  const confidenceText =
    profile.confidence === "high"
      ? ""
      : profile.confidence === "medium"
        ? " Best match."
        : " Tentative match.";

  return `Detected ${profile.language}. This code will be explained without execution.${confidenceText}`;
}