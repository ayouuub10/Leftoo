import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "lefto.theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    window.localStorage.setItem(KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const toggle = useCallback(
    () => apply(document.documentElement.classList.contains("dark") ? "light" : "dark"),
    [apply],
  );

  return { theme, setTheme: apply, toggle };
}
