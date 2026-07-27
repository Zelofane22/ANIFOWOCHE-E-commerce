import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { pingPageView } from "./api/analytics.js";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { SiteConfigProvider } from "./context/SiteConfigContext.jsx";
import Home from "./pages/Home.jsx";
import ShopRedirect from "./pages/ShopRedirect.jsx";

const hostname = window.location.hostname;
const isSellerSubdomain = hostname === "seller.anifowoche.com" || hostname.startsWith("seller.");

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
const SellerOrderDetail = lazy(() => import("./pages/SellerOrderDetail.jsx"));
const SellerOrders = lazy(() => import("./pages/SellerOrders.jsx"));
const SellerProducts = lazy(() => import("./pages/SellerProducts.jsx"));
const SellerLanding = lazy(() => import("./pages/SellerLanding.jsx"));
const SellerProductDetail = lazy(() => import("./pages/SellerProductDetail.jsx"));
const SellerSettings = lazy(() => import("./pages/SellerSettings.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));

function SellerSubLanding() {
  return (
    <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-5xl mb-4">🏪</p>
        <h1 className="text-2xl font-bold text-ink mb-2">Bienvenue sur ANIF Seller</h1>
        <p className="text-muted mb-6">
          Accédez à la boutique d'un vendeur en utilisant son lien direct.
        </p>
        <a
          href="https://anifowoche.com/seller"
          className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-medium transition"
        >
          Créer ma boutique
        </a>
      </div>
    </div>
  );
}

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    pingPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  const location = useLocation();
  const isSellerSurface = isSellerSubdomain
    || (location.pathname !== "/seller" && location.pathname.startsWith("/seller"))
    || location.pathname.startsWith("/shop/");

  if (isSellerSubdomain) {
    return (
      <div className="min-h-screen bg-white text-ink">
        <main>
          <Suspense fallback={<div className="min-h-[430px]" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<SellerSubLanding />} />
              <Route path="/:slug/produits/:productSlug" element={<SellerProductDetail />} />
              <Route path="/:slug" element={<PublicShop />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    );
  }

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
                  <Route path="/seller" element={<SellerLanding />} />
                  <Route path="/seller/login" element={<SellerAuth />} />
                  <Route path="/seller/register" element={<SellerAuth />} />
                  <Route path="/seller/dashboard" element={<SellerDashboard />} />
                  <Route path="/seller/orders" element={<SellerOrders />} />
                  <Route path="/seller/orders/:id" element={<SellerOrderDetail />} />
                  <Route path="/seller/products" element={<SellerProducts />} />
                  <Route path="/seller/settings" element={<SellerSettings />} />
                  <Route path="/shop/:slug" element={<ShopRedirect />} />
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