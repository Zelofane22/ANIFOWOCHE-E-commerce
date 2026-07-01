import { useContext } from "react";
import { CartContextValue } from "./cartContextValue.js";

export function useCart() {
  const context = useContext(CartContextValue);
  if (!context) throw new Error("useCart doit être utilisé dans un CartProvider");
  return context;
}
