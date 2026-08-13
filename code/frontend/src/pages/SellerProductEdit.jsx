import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { fetchCategoryTree } from "../api/products.js";
import { getSellerProducts, getSellerProfile } from "../api/seller.js";
import { PackageIcon } from "../components/icons.jsx";
import SellerShell from "../components/seller/SellerShell.jsx";
import ProductForm from "../components/seller/ProductForm.jsx";
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
    return <div className="min-h-screen bg-surface-muted px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  if (!product) {
    return (
      <SellerShell title="Produit introuvable" seller={seller}>
        <section className="rounded-xl border border-black/10 bg-white p-10 text-center">
          <PackageIcon size={36} className="mx-auto text-muted" />
          <h2 className="mt-3 text-lg font-bold text-ink">Produit introuvable</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
            Ce produit n'existe plus ou n'est pas disponible dans votre catalogue.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-medium"
          >
            Retour au catalogue
          </Link>
        </section>
      </SellerShell>
    );
  }

  return (
    <SellerShell title="Modifier le produit" seller={seller}>
      <ProductForm
        seller={seller}
        categoryTree={categoryTree}
        product={product}
        activeProductCount={activeProductCount}
      />
    </SellerShell>
  );
}
