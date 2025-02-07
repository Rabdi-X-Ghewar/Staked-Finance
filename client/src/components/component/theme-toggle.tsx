"use client";
import { Moon, Sun } from "lucide-react";
import { Button } from "../../components/ui/button"; // Adjust the import path for your shadcn/ui components
import { useState } from "react";

export function ThemeToggle() {
  // State to manage the current theme
  const [theme, setTheme] = useState(() => {
    // Check local storage for the saved theme, default to "light" if not found
    return localStorage.getItem("theme") || "light";
  });

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // Save the selected theme to local storage
    localStorage.setItem("theme", newTheme);

    // Apply the theme to the document
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative"
    >
      {/* Sun Icon */}
      <Sun
        className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      {/* Moon Icon */}
      <Moon
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      {/* Accessibility Label */}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}