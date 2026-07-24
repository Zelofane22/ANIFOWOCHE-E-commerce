import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { pingPageView } from "./api/analytics.js";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { SiteConfigProvider } from "./context/SiteConfigContext.jsx";
import Home from "./pages/Home.jsx";

// Code-splitting : seule la page d'accueil est dans le bundle initial, les
// autres pages sont téléchargées à la première navigation.
const Account = lazy(() => import("./pages/Account.jsx"));
const Addresses = lazy(() => import("./pages/Addresses.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Catalogue = lazy(() => import("./pages/Catalogue.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation.jsx"));
const OrderDetail = lazy(() => import("./pages/OrderDetail.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const Product = lazy(() => import("./pages/Product.jsx"));
const PublicOrder = lazy(() => import("./pages/PublicOrder.jsx"));
const PublicShop = lazy(() => import("./pages/PublicShop.jsx"));
const SellerAuth = lazy(() => import("./pages/SellerAuth.jsx"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard.jsx"));
const SellerProducts = lazy(() => import("./pages/SellerProducts.jsx"));
const SellerSettings = lazy(() => import("./pages/SellerSettings.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    pingPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  const location = useLocation();
  const isSellerSurface = location.pathname.startsWith("/seller") || location.pathname.startsWith("/shop/");

  return (
    <SiteConfigProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-white text-ink">
            <PageViewTracker />
            {!isSellerSurface && <Navbar />}
            <main>
              <Suspense fallback={<div className="min-h-[430px]" aria-busy="true" />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalogue" element={<Catalogue />} />
                  <Route path="/produits/:slug" element={<Product />} />
                  <Route path="/panier" element={<Cart />} />
                  <Route path="/commande" element={<Checkout />} />
                  <Route path="/commande/public" element={<PublicOrder />} />
                  <Route path="/commande/confirmation" element={<OrderConfirmation />} />
                  <Route path="/compte" element={<Account />} />
                  <Route path="/compte/commandes" element={<Orders />} />
                  <Route path="/compte/commandes/:id" element={<OrderDetail />} />
                  <Route path="/compte/adresses" element={<Addresses />} />
                  <Route path="/compte/favoris" element={<Wishlist />} />
                  <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
                  <Route path="/seller/login" element={<SellerAuth />} />
                  <Route path="/seller/register" element={<SellerAuth />} />
                  <Route path="/seller/dashboard" element={<SellerDashboard />} />
                  <Route path="/seller/products" element={<SellerProducts />} />
                  <Route path="/seller/settings" element={<SellerSettings />} />
                  <Route path="/shop/:slug" element={<PublicShop />} />
                </Routes>
              </Suspense>
            </main>
            {!isSellerSurface && <Footer />}
          </div>
        </CartProvider>
      </AuthProvider>
    </SiteConfigProvider>
  );
}
