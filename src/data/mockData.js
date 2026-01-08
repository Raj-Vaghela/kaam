// --- REALISTIC IMAGE MOCK DATA (B2C Only) ---
export const MOCK_PRODUCTS = [
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

export const CATEGORY_IMAGES = {
    "Grains & Rice": "https://images.unsplash.com/photo-1536304993881-ff00228b4db8?auto=format&fit=crop&q=80&w=400",
    "Flour & Atta": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    "Spices": "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&q=80&w=400",
    "Snacks": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400",
    "Beverages": "https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?auto=format&fit=crop&q=80&w=400",
    "Dairy & Pantry": "https://images.unsplash.com/photo-1628193479753-9694b281f62c?auto=format&fit=crop&q=80&w=400",
    "Personal Care": "https://images.unsplash.com/photo-1556228720-1957be83f360?auto=format&fit=crop&q=80&w=400"
};

export const CATEGORIES = ["All", "Grains & Rice", "Flour & Atta", "Spices", "Snacks", "Beverages", "Dairy & Pantry", "Personal Care"];
