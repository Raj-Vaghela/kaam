import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, ChevronRight, Search } from 'lucide-react';
import { OdooService } from './services/OdooService';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HeroSection from './components/home/HeroSection';
import HomeFeatures from './components/home/HomeFeatures';
import ProductCard from './components/product/ProductCard';
import TrolleyDrawer from './components/layout/TrolleyDrawer';
import SupportChat from './components/support/SupportChat';
import AuthPage from './components/auth/AuthPage';

export default function App() {
  const [view, setView] = useState('home');
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await OdooService.getProducts();
      setProducts(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value && view !== 'listing') setView('listing');
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setView('listing');
  };

  const handleShopNow = () => {
    setView('listing');
    setActiveCategory('All');
  };

  const handleLogoClick = () => {
    setView('home');
    setActiveCategory('All');
    setSearchTerm('');
  };

  const addToCart = (product, qty) => {
    setCart(prev => {
      let finalPrice = product.clubPrice || product.price;
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => (item.id === product.id) ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: finalPrice, image: product.imgUrl, category: product.category, qty: qty, unit: product.unit }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQty = (id, newQty) => setCart(prev => prev.map(item => (item.id === id) ? { ...item, qty: newQty } : item));

  const checkout = async () => {
    alert("Redirecting to Secure Checkout...");
    const result = await OdooService.createOrder(cart);
    if (result.success) {
      alert(`Order ${result.orderId} placed successfully!`);
      setCart([]);
      setCartOpen(false);
    }
  };

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.price * item.qty), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((count, item) => count + item.qty, 0), [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, products]);

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900">

      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        onCartClick={() => setCartOpen(true)}
        onLogoClick={handleLogoClick}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onCategoryClick={handleCategoryClick}
        activeCategory={activeCategory}
        view={view}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignInClick={() => setView('auth')}
      />

      {view === 'auth' ? (
        <AuthPage onLoginSuccess={() => setView('home')} />
      ) : view === 'home' && !loading ? (
        <>
          <HeroSection onShopNow={handleShopNow} />
          <HomeFeatures onCategorySelect={handleCategoryClick} />
        </>
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-24">
          <div className="mb-6 flex items-baseline justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><span>Home</span> <ChevronRight size={10} /> <span>Groceries</span> <ChevronRight size={10} /> <span className="text-slate-800 font-bold">{activeCategory}</span></div>
              <h2 className="text-3xl font-serif font-bold text-slate-900">{activeCategory === "All" ? "Everyday Essentials" : activeCategory}</h2>
            </div>
            <p className="text-slate-500 text-sm self-end">{filteredProducts.length} items</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (<ProductCard key={product.id} product={product} addToCart={addToCart} />))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="bg-white rounded p-12 text-center border border-slate-200">
              <Search size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No products found</h3>
              <p className="text-slate-500 mb-6">We couldn't find matches for "{searchTerm}"</p>
              <button onClick={handleLogoClick} className="text-emerald-700 font-bold hover:underline">Show all products</button>
            </div>
          )}
        </main>
      )}

      <Footer />

      <TrolleyDrawer
        isOpen={cartOpen}
        close={() => setCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateQty={updateQty}
        total={cartTotal}
        checkout={checkout}
      />

      <SupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors z-40 flex items-center gap-2 pr-5"
        >
          <div className="bg-emerald-500 rounded-full p-1.5">
            <MessageSquare size={18} fill="white" className="text-emerald-500" />
          </div>
          <span className="font-bold text-sm">Help & Support</span>
        </button>
      )}

    </div>
  );
}
