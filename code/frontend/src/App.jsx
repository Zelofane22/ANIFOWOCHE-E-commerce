import { Route, Routes } from "react-router";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import Account from "./pages/Account.jsx";
import Cart from "./pages/Cart.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import Checkout from "./pages/Checkout.jsx";
import Home from "./pages/Home.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import Product from "./pages/Product.jsx";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-white text-ink">
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalogue" element={<Catalogue />} />
              <Route path="/produits/:slug" element={<Product />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/commande" element={<Checkout />} />
              <Route path="/commande/confirmation" element={<OrderConfirmation />} />
              <Route path="/compte" element={<Account />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
