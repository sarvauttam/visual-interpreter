export function makeError(line, description, text = "") {
  return { line, description, text };
}

export function matchesAnySupportedLine(line, profile) {
  const trimmed = line.trim();

  if (
    /^print\s*\(\s*\S.*\)\s*;\s*$/.test(trimmed) ||
    /^let\s+[A-Za-z_]\w*\s*=.+;\s*$/.test(trimmed) ||
    /^input\s*\(\s*[A-Za-z_]\w*\s*\)\s*;\s*$/.test(trimmed) ||
    /^\w+\s*=\s*.+;\s*$/.test(trimmed) ||
    /^else\s*\{\s*$/.test(trimmed) ||
    /^else\s+if\s*\(.+\)\s*\{\s*$/.test(trimmed)
  ) {
    return true;
  }

  return profile.some((rule) => rule.pattern.test(line));
}

export function findRuleByName(profile, name) {
  return profile.find((rule) => rule.name === name);
}