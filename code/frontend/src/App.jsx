import { Route, Routes } from "react-router";
import Navbar from "./components/Navbar.jsx";
import Account from "./pages/Account.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import Checkout from "./pages/Checkout.jsx";
import Home from "./pages/Home.jsx";
import Product from "./pages/Product.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/produits/:slug" element={<Product />} />
          <Route path="/commande" element={<Checkout />} />
          <Route path="/compte" element={<Account />} />
        </Routes>
      </main>
    </div>
  );
}
