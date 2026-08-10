import { useContext } from "react";
import { InstallPromptContextValue } from "./installPromptContextValue.js";

export function useInstallPrompt() {
  const context = useContext(InstallPromptContextValue);
  if (!context) throw new Error("useInstallPrompt doit être utilisé dans un InstallPromptProvider");
  return context;
}
