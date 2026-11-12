/**
 * CIVIX Device Bridge SDK
 * Lightweight postMessage protocol for partner apps running inside or alongside the CIVIX Pocket Device.
 */

export interface CivixNotificationPayload {
  title: string;
  message: string;
  category?: "finance" | "gaming" | "guild" | "system";
  actionLabel?: string;
  actionUrl?: string;
}

export interface CivixDeviceEvent {
  type: "CIVIX_DEVICE_EVENT";
  event: "VIEWPORT_CHANGED" | "CITIZEN_STATE" | "PING";
  payload?: any;
}

export class CivixBridge {
  private static instance: CivixBridge;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("message", this.handleMessage.bind(this));
    }
  }

  public static get(): CivixBridge {
    if (!CivixBridge.instance) {
      CivixBridge.instance = new CivixBridge();
    }
    return CivixBridge.instance;
  }

  /**
   * Send a rich event/edict notification to the CIVIX device status bar / lockscreen
   */
  public sendNotification(notification: CivixNotificationPayload) {
    if (typeof window === "undefined") return;
    const msg = {
      type: "CIVIX_DEVICE_ACTION",
      action: "NOTIFICATION",
      data: notification,
    };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, "*");
    }
  }

  /**
   * Request the CIVIX device to expand into tablet or fullscreen mode
   * (e.g. When the user opens a complex order book or trading chart)
   */
  public requestViewportMode(mode: "phone" | "tablet" | "fullscreen") {
    if (typeof window === "undefined") return;
    const msg = {
      type: "CIVIX_DEVICE_ACTION",
      action: "RESIZE_REQUEST",
      mode,
    };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, "*");
    }
  }

  /**
   * Close the active app inside the device and return to home screen
   */
  public closeApp() {
    if (typeof window === "undefined") return;
    const msg = {
      type: "CIVIX_DEVICE_ACTION",
      action: "CLOSE_APP",
    };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, "*");
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private handleMessage(event: MessageEvent) {
    if (!event.data || event.data.type !== "CIVIX_DEVICE_EVENT") return;
    const callbacks = this.listeners.get(event.data.event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event.data.payload));
    }
  }
}
