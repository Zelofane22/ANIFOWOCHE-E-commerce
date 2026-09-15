import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router";
import { pingPageView } from "./api/analytics.js";
import Footer from "./components/Footer.jsx";
import MobileTabBar from "./components/MobileTabBar.jsx";
import PageSkeleton from "./components/PageSkeleton.jsx";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { SiteConfigProvider } from "./context/SiteConfigContext.jsx";
import { StoreStatusProvider } from "./context/StoreStatusContext.jsx";
import MaintenanceBanner from "./components/MaintenanceBanner.jsx";
import { useAuth } from "./context/useAuth.js";
import Home from "./pages/Home.jsx";
import ShopRedirect from "./pages/ShopRedirect.jsx";

const hostname = window.location.hostname;
const isSellerSubdomain = hostname === "seller.anifowoche.com" || hostname === "seller.localhost" || hostname.startsWith("seller.") || hostname.startsWith("seller.");

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
const SellerStats = lazy(() => import("./pages/SellerStats.jsx"));
const SellerOrderDetail = lazy(() => import("./pages/SellerOrderDetail.jsx"));
const SellerOrders = lazy(() => import("./pages/SellerOrders.jsx"));
const SellerProducts = lazy(() => import("./pages/SellerProducts.jsx"));
const SellerProductNew = lazy(() => import("./pages/SellerProductNew.jsx"));
const SellerProductEdit = lazy(() => import("./pages/SellerProductEdit.jsx"));
const SellerLanding = lazy(() => import("./pages/SellerLanding.jsx"));
const SellerProductDetail = lazy(() => import("./pages/SellerProductDetail.jsx"));
const SellerProductManage = lazy(() => import("./pages/SellerProductManage.jsx"));
const SellerPlan = lazy(() => import("./pages/SellerPlan.jsx"));
const SellerReports = lazy(() => import("./pages/SellerReports.jsx"));
const SellerSettings = lazy(() => import("./pages/SellerSettings.jsx"));
const SellerNotifications = lazy(() => import("./pages/SellerNotifications.jsx"));
const SellerShopPage = lazy(() => import("./pages/SellerShopPage.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));

function SellerShopRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/${slug}`} replace />;
}

function SellerHome() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <PageSkeleton />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <SellerLanding />;
}

function SellerFallback() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <PageSkeleton />;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
}

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    pingPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isSellerSurface = isSellerSubdomain || location.pathname.startsWith("/shop/");

  if (isSellerSubdomain) {
    return (
      <StoreStatusProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-white text-ink">
              <MaintenanceBanner />
              <ScrollToTop />
              <main>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route path="/" element={<SellerHome />} />
                  <Route path="/login" element={<SellerAuth />} />
                  <Route path="/register" element={<SellerAuth />} />
                  <Route path="/dashboard" element={<SellerDashboard />} />
                  <Route path="/stats" element={<SellerStats />} />
                  <Route path="/reports" element={<SellerReports />} />
                  <Route path="/orders" element={<SellerOrders />} />
                  <Route path="/orders/:id" element={<SellerOrderDetail />} />
                  <Route path="/products/new" element={<SellerProductNew />} />
                  <Route path="/products/:slug" element={<SellerProductManage />} />
                  <Route path="/products/:slug/edit" element={<SellerProductEdit />} />
                  <Route path="/products" element={<SellerProducts />} />
                  <Route path="/boutique" element={<SellerShopPage />} />
                  <Route path="/plan" element={<SellerPlan />} />
                  <Route path="/settings" element={<SellerSettings />} />
                  <Route path="/notifications" element={<SellerNotifications />} />
                  <Route path="/:slug/produits/:productSlug" element={<SellerProductDetail />} />
                  <Route path="/:slug/commande" element={<PublicOrder />} />
                  <Route path="/commande/confirmation" element={<OrderConfirmation />} />
                <Route path="/shop/:slug" element={<SellerShopRedirect />} />
                <Route path="/:slug" element={<PublicShop />} />
                <Route path="*" element={<SellerFallback />} />
                </Routes>
              </Suspense>
            </main>
          </div>
          </CartProvider>
        </AuthProvider>
      </StoreStatusProvider>
    );
  }

  return (
    <StoreStatusProvider>
      <SiteConfigProvider>
        <AuthProvider>
          <CartProvider>
          <div className="min-h-screen bg-white text-ink">
            <PageViewTracker />
            <ScrollToTop />
            <MaintenanceBanner />
            {!isSellerSurface && <Navbar />}
            <main className="pb-[calc(var(--tabbar-h)+var(--tabbar-safe)+1.5rem)] md:pb-0">
              <div key={location.pathname} className="animate-page">
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalogue" element={<Catalogue />} />
                    <Route path="/produits/:slug" element={<Product />} />
                    <Route path="/panier" element={<Cart />} />
                    <Route path="/commande" element={<Checkout />} />
                    <Route path="/commande/confirmation" element={<OrderConfirmation />} />
                    <Route path="/compte" element={<Account />} />
                    <Route path="/compte/commandes" element={<Orders />} />
                    <Route path="/compte/commandes/:id" element={<OrderDetail />} />
                    <Route path="/compte/adresses" element={<Addresses />} />
                    <Route path="/compte/favoris" element={<Wishlist />} />
                    <Route path="/shop/:slug" element={<ShopRedirect />} />
                  </Routes>
                </Suspense>
              </div>
            </main>
            {!isSellerSurface && <Footer />}
            {!isSellerSurface && <MobileTabBar />}
          </div>
          </CartProvider>
        </AuthProvider>
      </SiteConfigProvider>
    </StoreStatusProvider>
  );
}