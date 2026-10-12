import { describe, it, expect } from "vitest";
import {
  appShortcutModifierLabel,
  isAppShortcutChord,
} from "../../lib/app-shortcut-chord";

const keys = (init: Partial<KeyboardEvent>) => ({
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...init,
});

describe("isAppShortcutChord", () => {
  it("takes Ctrl+Shift on every platform", () => {
    expect(
      isAppShortcutChord(keys({ ctrlKey: true, shiftKey: true }), false),
    ).toBe(true);
    expect(
      isAppShortcutChord(keys({ ctrlKey: true, shiftKey: true }), true),
    ).toBe(true);
  });

  it("takes Cmd+Shift only on macOS", () => {
    expect(
      isAppShortcutChord(keys({ metaKey: true, shiftKey: true }), true),
    ).toBe(true);
    expect(
      isAppShortcutChord(keys({ metaKey: true, shiftKey: true }), false),
    ).toBe(false);
  });

  it("refuses Alt, both Ctrl and Cmd, or no Shift", () => {
    expect(
      isAppShortcutChord(
        keys({ ctrlKey: true, shiftKey: true, altKey: true }),
        true,
      ),
    ).toBe(false);
    expect(
      isAppShortcutChord(
        keys({ ctrlKey: true, metaKey: true, shiftKey: true }),
        true,
      ),
    ).toBe(false);
    expect(isAppShortcutChord(keys({ metaKey: true }), true)).toBe(false);
  });

  it("names Cmd on macOS and Ctrl elsewhere", () => {
    expect(appShortcutModifierLabel(true)).toBe("Cmd");
    expect(appShortcutModifierLabel(false)).toBe("Ctrl");
  });
});
