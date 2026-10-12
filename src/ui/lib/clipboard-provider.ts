import type {
  IClipboardProvider,
  ClipboardSelectionType,
} from "@xterm/addon-clipboard";
import { copyToClipboard } from "./clipboard";

/**
 * Clipboard for OSC 52, where the remote program (vim, tmux, Claude Code)
 * asks to copy. Over plain HTTP navigator.clipboard does not exist, so this
 * goes through copyToClipboard and its execCommand fallback, which works
 * while the browser still counts the mouse or key press that led to the
 * copy. A write that arrives too late is kept and done on the next click,
 * key press or window focus, when the browser allows it again.
 */
export class RobustClipboardProvider implements IClipboardProvider {
  private pendingWrite: string | null = null;
  private readonly retryHandler: () => void;

  constructor() {
    this.retryHandler = () => {
      if (this.pendingWrite === null) return;
      const text = this.pendingWrite;
      this.pendingWrite = null;
      void copyToClipboard(text).then((ok) => {
        if (!ok && this.pendingWrite === null) this.pendingWrite = text;
      });
    };
    window.addEventListener("focus", this.retryHandler);
    window.addEventListener("pointerdown", this.retryHandler, true);
    window.addEventListener("keydown", this.retryHandler, true);
  }

  dispose(): void {
    window.removeEventListener("focus", this.retryHandler);
    window.removeEventListener("pointerdown", this.retryHandler, true);
    window.removeEventListener("keydown", this.retryHandler, true);
    this.pendingWrite = null;
  }

  readText(_selection: ClipboardSelectionType): string | Promise<string> {
    if (window.electronClipboard) {
      return window.electronClipboard.readText();
    }
    return navigator.clipboard?.readText?.() ?? "";
  }

  async writeText(
    _selection: ClipboardSelectionType,
    text: string,
  ): Promise<void> {
    this.pendingWrite = null;
    if (await copyToClipboard(text)) return;
    this.pendingWrite = text;
  }
}
