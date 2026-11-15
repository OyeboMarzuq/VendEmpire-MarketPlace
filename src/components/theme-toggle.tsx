import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useColorMode } from "@/hooks/use-color-mode";

export function ThemeToggle() {
  const { mode, toggleMode } = useColorMode();
  const nextMode = mode === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={`Switch to ${nextMode} mode`}
      aria-label={`Switch to ${nextMode} mode`}
      onClick={toggleMode}
    >
      {mode === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}