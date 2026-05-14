export const LANGUAGE_PROFILES = {
  cpp: {
    id: "cpp",
    label: "C++",
    displayName: "C++",
    fileExtensions: [".cpp", ".cc", ".cxx", ".hpp", ".h"],
    supportsGuidedMode: true,
    supportsDiagnostics: true,
    supportsLibraryInfo: true,
  },

  python: {
    id: "python",
    label: "Python",
    displayName: "Python",
    fileExtensions: [".py"],
    supportsGuidedMode: false,
    supportsDiagnostics: false,
    supportsLibraryInfo: false,
  },
};

export function getLanguageProfile(languageId) {
  return LANGUAGE_PROFILES[languageId] || LANGUAGE_PROFILES.cpp;
}