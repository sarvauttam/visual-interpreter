export function makeError(line, description, text = "") {
  return { line, description, text };
}

export function matchesAnySupportedLine(line, profile) {
  return profile.some((rule) => rule.pattern.test(line));
}

export function findRuleByName(profile, name) {
  return profile.find((rule) => rule.name === name);
}