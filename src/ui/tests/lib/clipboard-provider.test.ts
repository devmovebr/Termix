import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ClipboardSelectionType } from "@xterm/addon-clipboard";
import { RobustClipboardProvider } from "../../lib/clipboard-provider";

const SYSTEM = "c" as ClipboardSelectionType;

describe("RobustClipboardProvider", () => {
  const originalClipboard = navigator.clipboard;
  let provider: RobustClipboardProvider | null = null;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    delete (window as { electronClipboard?: unknown }).electronClipboard;
    // Plain HTTP: the async Clipboard API is missing.
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    execCommand = vi.fn().mockReturnValue(true);
    (document as unknown as { execCommand: typeof execCommand }).execCommand =
      execCommand;
  });

  afterEach(() => {
    provider?.dispose();
    provider = null;
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("copies an OSC 52 write over plain HTTP through execCommand", async () => {
    provider = new RobustClipboardProvider();

    await provider.writeText(SYSTEM, "from claude");

    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("keeps a write the browser refused and copies it on the next click", async () => {
    execCommand.mockReturnValueOnce(false);
    provider = new RobustClipboardProvider();

    await provider.writeText(SYSTEM, "late");
    expect(execCommand).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("pointerdown"));
    await vi.waitFor(() => expect(execCommand).toHaveBeenCalledTimes(2));

    // Done, so another click copies nothing.
    window.dispatchEvent(new Event("pointerdown"));
    await Promise.resolve();
    expect(execCommand).toHaveBeenCalledTimes(2);
  });

  it("gives focus back to the terminal after copying", async () => {
    const terminalInput = document.createElement("textarea");
    document.body.appendChild(terminalInput);
    terminalInput.focus();
    provider = new RobustClipboardProvider();

    await provider.writeText(SYSTEM, "keep typing");

    expect(document.activeElement).toBe(terminalInput);
    terminalInput.remove();
  });
});
