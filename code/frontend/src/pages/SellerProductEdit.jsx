import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { fetchCategoryTree } from "../api/products.js";
import { getSellerProducts, getSellerProfile } from "../api/seller.js";
import { PackageIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import ProductFormMobile from "../components/seller/ProductFormMobile.jsx";
import { useAuth } from "../context/useAuth.js";

export default function SellerProductEdit() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    Promise.all([getSellerProfile(), getSellerProducts(), fetchCategoryTree()])
      .then(([sellerData, productData, treeData]) => {
        setSeller(sellerData);
        setProducts(productData.results ?? productData);
        setCategoryTree(treeData);
        setReady(true);
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  const product = useMemo(
    () => products.find((p) => p.slug === slug) ?? null,
    [products, slug]
  );
  const activeProductCount = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products]
  );

  if (loading || !seller || !ready) {
    return <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#6B7280]">Chargement...</div>;
  }

  if (!product) {
    return (
      <SellerShell seller={seller} pendingCount={0}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mx-auto">
            <PackageIcon size={28} className="text-[#9CA3AF]" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#111827]">Produit introuvable</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-[#6B7280] leading-relaxed">
            Ce produit n'existe plus ou n'est pas disponible dans votre catalogue.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#C99F08] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A67C06]"
          >
            Retour au catalogue
          </Link>
        </div>
      </SellerShell>
    );
  }

  return (
    <ProductFormMobile
      seller={seller}
      categoryTree={categoryTree}
      product={product}
      activeProductCount={activeProductCount}
    />
  );
}
