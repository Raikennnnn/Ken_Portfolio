// Tiny event bus between the DOM (terminal, sections) and the 3D companion.

export type AvatarAction = "wave" | "scan" | "spin" | "glitch" | "nod";

export type AvatarEvent =
  | { type: "action"; action: AvatarAction }
  | { type: "say"; text: string; ms?: number }
  | { type: "terminal"; open: boolean }
  | { type: "typing" };

const EVENT = "ken:avatar";

export function emitAvatar(event: AvatarEvent) {
  window.dispatchEvent(new CustomEvent<AvatarEvent>(EVENT, { detail: event }));
}

export function onAvatar(handler: (event: AvatarEvent) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<AvatarEvent>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

// The terminal listens for this to open itself (header button, avatar click, shortcuts).
const TERMINAL_EVENT = "ken:terminal";

export function toggleTerminal(open?: boolean) {
  window.dispatchEvent(new CustomEvent<boolean | undefined>(TERMINAL_EVENT, { detail: open }));
}

export function onToggleTerminal(handler: (open?: boolean) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<boolean | undefined>).detail);
  window.addEventListener(TERMINAL_EVENT, listener);
  return () => window.removeEventListener(TERMINAL_EVENT, listener);
}
