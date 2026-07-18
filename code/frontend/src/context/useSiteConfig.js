import { useContext } from "react";
import { SiteConfigContextValue } from "./SiteConfigContext.jsx";

export function useSiteConfig() {
  const context = useContext(SiteConfigContextValue);
  if (!context) throw new Error("useSiteConfig doit être utilisé dans un SiteConfigProvider");
  return context;
}
