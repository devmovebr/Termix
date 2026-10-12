import { isMacPlatform } from "./tab-jump-hotkey";

/**
 * The modifiers the shell's own shortcuts use: Ctrl+Shift everywhere, and
 * Cmd+Shift too on macOS, where Ctrl is the terminal's and Cmd is the app's.
 */
export function isAppShortcutChord(
  e: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey" | "altKey">,
  mac = isMacPlatform(),
): boolean {
  if (!e.shiftKey || e.altKey) return false;
  if (e.ctrlKey && !e.metaKey) return true;
  return mac && e.metaKey && !e.ctrlKey;
}

/** The chord's first key as the shortcut list shows it. */
export function appShortcutModifierLabel(mac = isMacPlatform()): string {
  return mac ? "Cmd" : "Ctrl";
}
