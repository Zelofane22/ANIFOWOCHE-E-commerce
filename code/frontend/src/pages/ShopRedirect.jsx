import { useEffect } from "react";
import { useParams } from "react-router";

export default function ShopRedirect() {
  const { slug } = useParams();

  useEffect(() => {
    window.location.replace(`https://seller.anifowoche.com/${slug}`);
  }, [slug]);

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <p className="text-muted">Redirection vers la boutique...</p>
    </div>
  );
}