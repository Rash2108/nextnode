const ACTIVE_TEAM_KEY = "teamName";
const R2_TEAM_KEY = "r2_teamName";

export const ROUND1_BASE_KEY = "cc_session_v3";
export const ROUND2_BASE_KEY = "cc_round2_session";

export function normalizeTeamName(name) {
  return typeof name === "string" ? name.trim() : "";
}

export function getActiveTeam() {
  try {
    return normalizeTeamName(
      localStorage.getItem(ACTIVE_TEAM_KEY) ||
        localStorage.getItem(R2_TEAM_KEY) ||
        ""
    );
  } catch {
    return "";
  }
}

function scopedKey(base, teamName) {
  return `${base}::${encodeURIComponent(teamName)}`;
}

// Legacy global sessions are only migrated when the stored session itself
// identifies the same team. Sessions without an owner are never reassigned.
function migrateLegacy(base, teamName) {
  const team = normalizeTeamName(teamName);
  if (!team) return;

  try {
    const scoped = scopedKey(base, team);
    if (localStorage.getItem(scoped) !== null) return;

    const legacy = localStorage.getItem(base);
    if (legacy === null) return;

    let parsed = JSON.parse(legacy);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);

    if (!parsed || normalizeTeamName(parsed.teamName) !== team) return;

    localStorage.setItem(scoped, legacy);
  } catch {
    // Ignore malformed legacy data.
  }
}

export function setActiveTeam(name) {
  const team = normalizeTeamName(name);
  if (!team) return "";

  let previousTeam = "";
  let previousR2Team = "";

  try {
    previousTeam = normalizeTeamName(localStorage.getItem(ACTIVE_TEAM_KEY) || "");
    previousR2Team = normalizeTeamName(localStorage.getItem(R2_TEAM_KEY) || "");
  } catch {
    // Ignore storage read failures.
  }

  migrateLegacy(ROUND1_BASE_KEY, previousTeam);
  migrateLegacy(ROUND2_BASE_KEY, previousR2Team || previousTeam);
  migrateLegacy(ROUND1_BASE_KEY, team);
  migrateLegacy(ROUND2_BASE_KEY, team);

  try {
    localStorage.setItem(ACTIVE_TEAM_KEY, team);
    localStorage.setItem(R2_TEAM_KEY, team);
  } catch {
    // Ignore storage write failures.
  }

  return team;
}

export function loadTeamSession(base, teamName, defaults) {
  const team = normalizeTeamName(teamName) || getActiveTeam();
  if (!team) return { ...defaults };

  try {
    const raw = localStorage.getItem(scopedKey(base, team));
    if (!raw) return { ...defaults };

    let parsed = JSON.parse(raw);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);

    return { ...defaults, ...parsed, teamName: team };
  } catch {
    return { ...defaults };
  }
}

export function saveTeamSession(base, teamName, session) {
  const team = normalizeTeamName(teamName) || getActiveTeam();
  if (!team) return;

  try {
    localStorage.setItem(
      scopedKey(base, team),
      JSON.stringify({ ...session, teamName: team })
    );
  } catch {
    // Ignore storage write failures.
  }
}
