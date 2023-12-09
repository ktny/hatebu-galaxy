"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  function toggleTheme() {
    console.log(theme);
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <div onClick={toggleTheme}>
      {theme === "light" ? <span className="i-solar-sun-bold w-10 h-10"></span> : <span className="i-solar-moon-bold w-10 h-10"></span>}
    </div>
  );
}
