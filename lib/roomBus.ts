// Lets any button (or the terminal) open the server room without prop drilling.

const EVENT = "ken:room";

export function openRoom() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenRoom(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
