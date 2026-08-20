"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service worker and surfaces an "Add to home screen" prompt.
 *
 * Chrome/Android fire `beforeinstallprompt`, which we capture and replay from our
 * own button. iOS Safari has no such event, so there we show the manual Share →
 * "Add to Home Screen" hint instead — that path is how most Ghanaian parents on
 * iPhones will install it.
 */
export function PwaRegistrar() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed SW registration only costs offline support — never block the app.
      });
    }

    setDismissed(window.localStorage.getItem("kampus_install_dismissed") === "1");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isIos && !standalone) setShowIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    window.localStorage.setItem("kampus_install_dismissed", "1");
    setDismissed(true);
  }

  if (dismissed || (!deferred && !showIosHint)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-fade rounded-[16px] border border-border-alt bg-white p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand text-xl">📲</div>
        <div className="flex-1">
          <p className="text-sm font-bold">Install this app</p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
            {deferred
              ? "Install it for quick access from your desktop or tablet."
              : "Tap the Share button, then “Add to Home Screen”."}
          </p>
          <div className="mt-3 flex gap-2">
            {deferred && (
              <button
                onClick={async () => {
                  await deferred.prompt();
                  await deferred.userChoice;
                  setDeferred(null);
                  dismiss();
                }}
                className="rounded-pill bg-dark-pill px-4 py-2 text-xs font-bold text-brand"
              >
                Install
              </button>
            )}
            <button onClick={dismiss} className="rounded-pill border border-border px-4 py-2 text-xs font-bold text-text-secondary">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
