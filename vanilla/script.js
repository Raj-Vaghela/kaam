
// --- MOCK DATA ---
const MOCK_PRODUCTS = [
    {
        id: "prod_1",
        name: "Royal Basmati Rice (Extra Long)",
        category: "Grains & Rice",
        imgUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600",
        price: 12.50,
        unit: "5kg",
        weight_kg: 5,
        rating: 4.8,
        bestseller: true,
        clubPrice: 10.00
    },
    {
        id: "prod_2",
        name: "Tata Gold Tea Premium",
        category: "Beverages",
        imgUrl: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&q=80&w=600",
        price: 4.99,
        unit: "1kg",
        weight_kg: 1,
        rating: 4.9,
        bestseller: true,
        clubPrice: 4.00
    },
    {
        id: "prod_3",
        name: "Aashirvaad Whole Wheat Atta",
        category: "Flour & Atta",
        imgUrl: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=600",
        price: 9.99,
        unit: "10kg",
        weight_kg: 10,
        rating: 4.7,
        bestseller: false,
        clubPrice: null
    },
    {
        id: "prod_4",
        name: "Haldiram's Bhujia Sev",
        category: "Snacks",
        imgUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=600",
        price: 2.50,
        unit: "400g",
        weight_kg: 0.4,
        rating: 4.6,
        bestseller: true,
        clubPrice: 2.00
    },
    {
        id: "prod_5",
        name: "MDH Deggi Mirch",
        category: "Spices",
        imgUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600",
        price: 1.99,
        unit: "100g",
        weight_kg: 0.1,
        rating: 4.9,
        bestseller: true,
        clubPrice: null
    },
    {
        id: "prod_6",
        name: "Amul Pure Ghee",
        category: "Dairy & Pantry",
        imgUrl: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=600",
        price: 7.50,
        unit: "1L",
        weight_kg: 1,
        rating: 4.8,
        bestseller: false,
        clubPrice: 6.50
    },
    {
        id: "prod_7",
        name: "Parle-G Biscuits",
        category: "Snacks",
        imgUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600",
        price: 0.99,
        unit: "300g",
        weight_kg: 0.3,
        rating: 4.5,
        bestseller: false,
        clubPrice: 0.80
    },
    {
        id: "prod_8",
        name: "Dabur Red Toothpaste",
        category: "Personal Care",
        imgUrl: "https://images.unsplash.com/photo-1559591937-e1dc329ac5a4?auto=format&fit=crop&q=80&w=600",
        price: 3.25,
        unit: "200g",
        weight_kg: 0.2,
        rating: 4.4,
        bestseller: false,
        clubPrice: null
    },
];

const CATEGORY_IMAGES = {
    "Grains & Rice": "https://images.unsplash.com/photo-1536304993881-ff00228b4db8?auto=format&fit=crop&q=80&w=400",
    "Flour & Atta": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    "Spices": "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&q=80&w=400",
    "Snacks": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400",
    "Beverages": "https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?auto=format&fit=crop&q=80&w=400",
    "Dairy & Pantry": "https://images.unsplash.com/photo-1628193479753-9694b281f62c?auto=format&fit=crop&q=80&w=400",
    "Personal Care": "https://images.unsplash.com/photo-1556228720-1957be83f360?auto=format&fit=crop&q=80&w=400"
};

const CATEGORIES = ["All", "Grains & Rice", "Flour & Atta", "Spices", "Snacks", "Beverages", "Dairy & Pantry", "Personal Care"];

// --- APP LOGIC ---

const app = {
    state: {
        view: 'home', // 'home', 'listing', 'auth'
        activeCategory: 'All',
        products: [],
        cart: [],
        searchTerm: '',
        loading: false,
        isChatOpen: false,
        chatMessages: [{ role: 'assistant', text: "Hello! I'm the DesiMart AI. I can help with navigation or basic queries." }],
        authMode: 'signin' // 'signin' or 'signup'
    },

    init: async function () {
        console.log("Initializing App...");
        // Render Categories in Head
        this.renderHeaderCategories();
        this.renderHomeCategories();

        // Load Data
        this.state.loading = true;
        this.updateView(); // show loading if needed

        // Simulate fetch
        setTimeout(() => {
            this.state.products = MOCK_PRODUCTS;
            this.state.loading = false;
            this.updateView();
            // Lucide icons
            lucide.createIcons();
        }, 800);

        // Render initial empty chat
        this.renderChatMessages();
    },

    // --- VIEW MANAGEMENT ---
    setView: function (viewName) {
        this.state.view = viewName;
        window.scrollTo(0, 0);
        this.updateView();
    },

    updateView: function () {
        const { view, loading } = this.state;

        // Toggle Sections
        document.getElementById('view-home').classList.toggle('hidden', view !== 'home');
        document.getElementById('view-listing').classList.toggle('hidden', view !== 'listing');
        document.getElementById('view-auth').classList.toggle('hidden', view !== 'auth');

        // Update Listing View if active
        if (view === 'listing') {
            this.renderListing();
        }

        // Re-run icons
        lucide.createIcons();
    },

    // --- RENDERERS ---

    renderHeaderCategories: function () {
        const nav = document.getElementById('category-nav');
        nav.innerHTML = CATEGORIES.map(cat => `
            <button onclick="app.setActiveCategory('${cat}'); app.setView('listing')" 
                class="text-xs font-bold whitespace-nowrap hover:text-emerald-700 text-slate-600 transition-colors">
                ${cat}
            </button>
        `).join('');
    },

    renderHomeCategories: function () {
        const grid = document.getElementById('home-categories-grid');
        grid.innerHTML = CATEGORIES.filter(c => c !== 'All').map(cat => `
            <div onclick="app.setActiveCategory('${cat}'); app.setView('listing')" class="group cursor-pointer relative overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-all duration-300">
                <div class="aspect-[4/3] w-full relative">
                    <div class="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors z-10"></div>
                    <img src="${CATEGORY_IMAGES[cat]}" alt="${cat}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-20">
                        <h3 class="text-white font-bold text-base md:text-lg">${cat}</h3>
                        <div class="h-0.5 w-0 bg-amber-400 group-hover:w-full transition-all duration-300"></div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderListing: function () {
        const { activeCategory, searchTerm, products, loading } = this.state;

        // Text updates
        document.getElementById('listing-active-category').innerText = activeCategory;
        document.getElementById('listing-title').innerText = activeCategory === "All" ? "Everyday Essentials" : activeCategory;

        // Filtering
        const filtered = products.filter(p => {
            const matchesCategory = activeCategory === "All" || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        document.getElementById('listing-count').innerText = `${filtered.length} items`;

        const grid = document.getElementById('products-grid');
        const spinner = document.getElementById('loading-spinner');
        const noResults = document.getElementById('no-products-message');

        if (loading) {
            spinner.classList.remove('hidden');
            grid.innerHTML = '';
            noResults.classList.add('hidden');
        } else if (filtered.length === 0) {
            spinner.classList.add('hidden');
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            document.getElementById('no-results-text').innerText = `We couldn't find matches for "${searchTerm}"`;
        } else {
            spinner.classList.add('hidden');
            noResults.classList.add('hidden');

            grid.innerHTML = filtered.map(product => {
                const finalPrice = product.clubPrice || product.price;
                const hasClub = !!product.clubPrice;
                const unitPrice = (finalPrice / product.weight_kg).toFixed(2);

                return `
                <div class="flex flex-col bg-white border border-slate-300 hover:border-emerald-600 transition-all duration-200 rounded-lg overflow-hidden h-full shadow-sm hover:shadow-md group">
                    <div class="relative h-48 bg-white border-b border-slate-100 overflow-hidden">
                        <img src="${product.imgUrl}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            ${product.bestseller ? `<span class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 w-fit rounded shadow-sm uppercase tracking-wide">Best Seller</span>` : ''}
                            ${hasClub ? `<span class="bg-yellow-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 w-fit rounded shadow-sm border border-yellow-500 uppercase">Club Price</span>` : ''}
                        </div>
                    </div>
                    <div class="p-3 flex flex-col flex-grow">
                        <div class="mb-2">
                            <h3 class="text-slate-900 font-bold text-sm leading-snug min-h-[2.5rem] line-clamp-2 group-hover:text-emerald-800 transition-colors">${product.name}</h3>
                            <p class="text-xs text-slate-500 mt-1">${product.unit}</p>
                        </div>
                        <div class="flex items-center gap-1 mb-3">
                             <div class="flex text-amber-400 text-[10px]">
                                ${this.renderStars(product.rating)}
                             </div>
                             <span class="text-[10px] text-slate-400">(${product.rating})</span>
                        </div>
                        <div class="mt-auto">
                            <div class="mb-3 p-2 rounded ${hasClub ? 'bg-yellow-50 border border-yellow-200' : ''}">
                                <div class="flex items-baseline gap-2">
                                    <span class="text-xl font-bold ${hasClub ? 'text-red-600' : 'text-slate-900'}">£${finalPrice.toFixed(2)}</span>
                                    ${hasClub ? `<span class="text-xs text-slate-400 line-through">£${product.price.toFixed(2)}</span>` : ''}
                                </div>
                                <span class="text-[10px] text-slate-500 font-medium">£${unitPrice} / kg</span>
                            </div>
                            <!-- Add Button -->
                            <div class="flex items-center h-10 w-full" id="btn-container-${product.id}">
                                <button onclick="app.addToCart('${product.id}')" class="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase h-full rounded transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm">
                                    Add <i data-lucide="shopping-basket" class="w-3 h-3"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }
    },

    renderStars: function (rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < Math.floor(rating)) stars += `<i data-lucide="star" class="w-2.5 h-2.5 fill-current"></i>`;
            else stars += `<i data-lucide="star" class="w-2.5 h-2.5"></i>`;
        }
        return stars;
    },

    // --- ACTIONS ---

    handleSearchChange: function (val) {
        this.state.searchTerm = val;
        if (val && this.state.view !== 'listing') {
            this.setView('listing');
        } else if (this.state.view === 'listing') {
            this.renderListing();
            lucide.createIcons();
        }
    },

    setActiveCategory: function (cat) {
        this.state.activeCategory = cat;
        // visual update for nav
        document.querySelectorAll('#category-nav button').forEach(btn => {
            if (btn.textContent.trim() === cat) btn.classList.add('text-emerald-800', 'border-b-2', 'border-emerald-800');
            else btn.classList.remove('text-emerald-800', 'border-b-2', 'border-emerald-800');
        });
    },

    handleLogoClick: function () {
        this.state.activeCategory = 'All';
        this.state.searchTerm = '';
        document.getElementById('search-input').value = '';
        this.setView('home');
    },

    handleShopNow: function () {
        this.setActiveCategory('All');
        this.setView('listing');
    },

    // --- CART LOGIC ---
    addToCart: function (productId) {
        const product = this.state.products.find(p => p.id === productId);
        if (!product) return;

        const price = product.clubPrice || product.price; // use club price if available

        const existing = this.state.cart.find(item => item.id === productId);
        if (existing) {
            existing.qty += 1;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: price,
                image: product.imgUrl,
                unit: product.unit,
                qty: 1
            });
        }
        this.renderCartUpdates();
        this.setCartOpen(true);
    },

    removeFromCart: function (id) {
        this.state.cart = this.state.cart.filter(item => item.id !== id);
        this.renderCartUpdates();
    },

    updateQty: function (id, delta) {
        const item = this.state.cart.find(i => i.id === id);
        if (item) {
            const newQty = item.qty + delta;
            if (newQty > 0) item.qty = newQty;
            this.renderCartUpdates();
        }
    },

    renderCartUpdates: function () {
        const cart = this.state.cart;
        const count = cart.reduce((sum, i) => sum + i.qty, 0);
        const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

        // Header
        const badge = document.getElementById('cart-count-badge');
        badge.innerText = count;
        badge.classList.toggle('hidden', count === 0);
        document.getElementById('cart-total-display').innerText = `£${total.toFixed(2)}`;

        // Drawer Content
        document.getElementById('cart-subtotal').innerText = `£${total.toFixed(2)}`;
        const free = total > 60;
        document.getElementById('cart-delivery').innerText = free ? 'FREE' : '£3.99';
        document.getElementById('cart-delivery').className = free ? "text-green-600 font-bold" : "";
        document.getElementById('cart-total-footer').innerText = `£${(free ? total : total + 3.99).toFixed(2)}`;

        // Free delivery bar
        const perc = Math.min(100, (total / 60) * 100);
        document.getElementById('free-delivery-bar').style.width = `${perc}%`;
        document.getElementById('free-delivery-text').innerText = free ? "You have qualified for FREE Delivery!" : `Spend £${(60 - total).toFixed(2)} more for Free Delivery`;

        // Items
        const container = document.getElementById('cart-items-container');
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20 flex flex-col items-center">
                    <div class="bg-slate-50 p-6 rounded-full shadow-sm mb-4"><i data-lucide="shopping-basket" class="w-12 h-12 text-slate-300"></i></div>
                    <p class="text-lg font-bold text-slate-700 font-serif">Your trolley is empty</p>
                    <p class="text-sm text-slate-500 max-w-[200px] mb-6">Start adding your essentials.</p>
                </div>
            `;
        } else {
            container.innerHTML = cart.map(item => `
                <div class="bg-white p-2 border-b border-slate-100 flex gap-3 relative group">
                    <div class="w-16 h-16 bg-slate-50 border border-slate-200 rounded overflow-hidden">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-start pr-6">
                            <div>
                                <h3 class="font-bold text-slate-800 text-sm leading-tight line-clamp-2">${item.name}</h3>
                                <p class="text-xs text-slate-500 mt-0.5">${item.unit}</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-center mt-2">
                            <div class="flex items-center border border-slate-300 rounded-sm bg-white h-7">
                                <button onclick="app.updateQty('${item.id}', -1)" class="px-2 hover:bg-slate-100 text-slate-600 h-full flex items-center"><i data-lucide="minus" class="w-2.5 h-2.5"></i></button>
                                <span class="w-6 text-center text-xs font-bold">${item.qty}</span>
                                <button onclick="app.updateQty('${item.id}', 1)" class="px-2 hover:bg-slate-100 text-slate-600 h-full flex items-center"><i data-lucide="plus" class="w-2.5 h-2.5"></i></button>
                            </div>
                            <p class="font-bold text-slate-900">£${(item.price * item.qty).toFixed(2)}</p>
                        </div>
                    </div>
                    <button onclick="app.removeFromCart('${item.id}')" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            `).join('');
        }
        lucide.createIcons();
    },

    setCartOpen: function (isOpen) {
        document.getElementById('trolley-overlay').classList.toggle('hidden', !isOpen);
        if (isOpen) this.renderCartUpdates();
    },

    checkout: function () {
        if (this.state.cart.length === 0) return;
        alert("Redirecting to Secure Checkout...");
        setTimeout(() => {
            alert(`Order SO-${Math.floor(Math.random() * 10000)} placed successfully!`);
            this.state.cart = [];
            this.renderCartUpdates();
            this.setCartOpen(false);
        }, 1000);
    },

    // --- AUTH ---
    setAuthMode: function (mode) {
        this.state.authMode = mode;
        const isSignIn = mode === 'signin';

        document.getElementById('auth-title').innerText = isSignIn ? 'Welcome back' : 'Create an account';
        document.getElementById('auth-subtitle').innerText = isSignIn ? 'Sign in to access your orders' : 'Join DesiMart for exclusive deals';
        document.getElementById('auth-submit-text').innerText = isSignIn ? 'Sign in' : 'Create Account';

        document.getElementById('btn-signin-tab').className = `flex-1 py-2 text-sm font-bold rounded-md transition-all ${isSignIn ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;
        document.getElementById('btn-signup-tab').className = `flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isSignIn ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`;

        document.getElementById('auth-name-field').classList.toggle('hidden', isSignIn);
    },

    handleAuthSubmit: function () {
        setTimeout(() => {
            this.setView('home');
        }, 800);
    },

    // --- CHAT ---
    toggleChat: function (isOpen) {
        this.state.isChatOpen = isOpen;
        document.getElementById('chat-toggle-btn').classList.toggle('hidden', isOpen);
        document.getElementById('chat-window').classList.toggle('hidden', !isOpen);
    },

    handleChatSend: function (text) {
        if (!text) return;

        // Add User Message
        this.state.chatMessages.push({ role: 'user', text: text });
        this.renderChatMessages();
        document.getElementById('chat-input').value = '';

        // Simulate AI Reply
        setTimeout(() => {
            let reply = "I can help with that. Please verify your order ID.";
            if (text.toLowerCase().includes('track')) reply = "Please provide your Order ID (starts with SO-).";

            this.state.chatMessages.push({ role: 'assistant', text: reply });
            this.renderChatMessages();
        }, 1000);
    },

    renderChatMessages: function () {
        const container = document.getElementById('chat-messages');
        container.innerHTML = this.state.chatMessages.map(msg => `
            <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[85%] p-3 rounded-lg leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-800 border border-slate-200'}">
                    ${msg.text}
                </div>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
