import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from "react";

export type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "cm-theme";

function resolveSystem(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const actual = t === "system" ? resolveSystem() : t;
  const root = document.documentElement;
  root.classList.toggle("dark", actual === "dark");
  root.classList.toggle("light", actual === "light");
  root.style.colorScheme = actual;
}

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };
const ThemeCtx = createContext<Ctx>({ theme: "dark", setTheme: () => {}, resolved: "dark" });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    theme === "system" ? resolveSystem() : (theme as "light" | "dark"),
  );

  useEffect(() => {
    applyTheme(theme);
    setResolved(theme === "system" ? resolveSystem() : (theme as "light" | "dark"));
    if (theme === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const cb = () => {
        applyTheme("system");
        setResolved(resolveSystem());
      };
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  };

  return createElement(ThemeCtx.Provider, { value: { theme, setTheme, resolved } }, children);
}

export function useTheme() {
  return useContext(ThemeCtx);
}

// Inline boot script — set class before paint to avoid flash.
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var a=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var r=document.documentElement;r.classList.toggle('dark',a==='dark');r.classList.toggle('light',a==='light');r.style.colorScheme=a;}catch(e){}})();`;
