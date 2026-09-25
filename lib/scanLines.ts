import { profile, projects } from "@/content/data";

/** The identity-scan readout, shown in the avatar HUD or printed by the terminal's `scan`. */
export const SCAN_LINES = [
  "> scanning subject…",
  `id ......... ${profile.name.toLowerCase()}`,
  `role ....... ${profile.title.toLowerCase()}`,
  `projects ... ${String(projects.length).padStart(2, "0")} shipped`,
  "clearance .. GRANTED",
];

export const SCAN_STEP_MS = 320;
