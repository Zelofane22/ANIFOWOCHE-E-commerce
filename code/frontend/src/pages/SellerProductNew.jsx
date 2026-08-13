import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchCategoryTree } from "../api/products.js";
import { getSellerProducts, getSellerProfile } from "../api/seller.js";
import SellerShell from "../components/seller/SellerShell.jsx";
import ProductForm from "../components/seller/ProductForm.jsx";
import { useAuth } from "../context/useAuth.js";

export default function SellerProductNew() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);

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
      })
      .catch((err) => {
        navigate(err?.response?.status === 404 ? "/register" : "/login", { replace: true });
      });
  }, [isAuthenticated, loading, navigate]);

  if (loading || !seller) {
    return <div className="min-h-screen bg-surface-muted px-4 py-10 text-center text-muted">Chargement...</div>;
  }

  const activeProductCount = products.filter((product) => product.is_active).length;

  return (
    <SellerShell title="Nouveau produit" seller={seller}>
      <ProductForm seller={seller} categoryTree={categoryTree} activeProductCount={activeProductCount} />
    </SellerShell>
  );
}
