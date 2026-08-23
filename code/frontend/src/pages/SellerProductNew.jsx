import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchCategoryTree } from "../api/products.js";
import { getSellerProducts, getSellerProfile } from "../api/seller.js";
import ProductFormMobile from "../components/seller/ProductFormMobile.jsx";
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
    return <div className="min-h-screen bg-[#F4F4F8] px-4 py-10 text-center text-[#6B7280]">Chargement...</div>;
  }

  const activeProductCount = products.filter((p) => p.is_active).length;

  return (
    <ProductFormMobile
      seller={seller}
      categoryTree={categoryTree}
      activeProductCount={activeProductCount}
    />
  );
}
