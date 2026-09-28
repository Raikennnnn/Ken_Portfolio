// Lets any button open or close the terminal without prop drilling.

const TERMINAL_EVENT = "ken:terminal";

export function toggleTerminal(open?: boolean) {
  window.dispatchEvent(new CustomEvent<boolean | undefined>(TERMINAL_EVENT, { detail: open }));
}

export function onToggleTerminal(handler: (open?: boolean) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<boolean | undefined>).detail);
  window.addEventListener(TERMINAL_EVENT, listener);
  return () => window.removeEventListener(TERMINAL_EVENT, listener);
}
