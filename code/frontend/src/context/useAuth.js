import { useContext } from "react";
import { AuthContextValue } from "./authContextValue.js";

export function useAuth() {
  const context = useContext(AuthContextValue);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
}
