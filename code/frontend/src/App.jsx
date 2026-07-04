import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { pingPageView } from "./api/analytics.js";
import Footer from "./components/Footer.jsx";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import Account from "./pages/Account.jsx";
import Addresses from "./pages/Addresses.jsx";
import Cart from "./pages/Cart.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import Checkout from "./pages/Checkout.jsx";
import Home from "./pages/Home.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import Orders from "./pages/Orders.jsx";
import Product from "./pages/Product.jsx";
import Wishlist from "./pages/Wishlist.jsx";

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    pingPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-white text-ink">
          <PageViewTracker />
          <Navbar />
          <main>
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
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
