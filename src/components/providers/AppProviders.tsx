"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type Theme = "light" | "dark";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  toast: (opts: Omit<ToastItem, "id">) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("anfio-theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", initial === "dark");
    const frame = requestAnimationFrame(() => setTheme(initial));

    // Suppress any injected Netlify badge/drawer elements dynamically
    const removeNetlifyBadge = () => {
      const selectors = [
        "#nl-badge-frame",
        'iframe#nl-badge-frame',
        'iframe[id^="nl-"]',
        'iframe[data-nl-ready]',
        'iframe[src*="netlify"]',
        'div[id*="netlify-badge"]',
        '#netlify-badge',
        '.nl-badge',
        'netlify-drawer',
        '[data-netlify-deploy-id]',
      ];
      const badges = document.querySelectorAll(selectors.join(", "));
      badges.forEach((el) => {
        try {
          (el as HTMLElement).style.setProperty("display", "none", "important");
          (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
          (el as HTMLElement).style.setProperty("opacity", "0", "important");
          (el as HTMLElement).style.setProperty("pointer-events", "none", "important");
          (el as HTMLElement).style.setProperty("width", "0px", "important");
          (el as HTMLElement).style.setProperty("height", "0px", "important");
          el.remove();
        } catch {
          // ignore error if removal fails
        }
      });
    };
    removeNetlifyBadge();
    const observer = new MutationObserver(removeNetlifyBadge);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("anfio-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  const toast = (opts: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 sm:bottom-5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg"
          >
            {t.variant === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            {t.variant === "error" && (
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            {t.variant === "info" && (
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.title}
              </p>
              {t.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used inside AppProviders");
  }
  return ctx;
}
