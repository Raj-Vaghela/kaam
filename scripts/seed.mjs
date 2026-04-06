
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA4NTA4NzYzN30.SgwxLl_aSRpRV30B56k0Kab_Cpny66vT1TWBWDj91T1eZbwyUTozKVJlpzitcWmgKu1o0w_Fp2Tthf--FaAqFA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const products = [
    {
        name: "Royal Basmati Rice (Extra Long)",
        category: "Grains & Rice",
        price: 12.99,
        unit: "5kg",
        image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800",
        bestseller: true,
        rating: 4.8,
        stock: 50,
        club_price: 10.99
    },
    {
        name: "Aashirvaad Whole Wheat Atta",
        category: "Flour & Atta",
        price: 9.99,
        unit: "10kg",
        image_url: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=800",
        bestseller: true,
        rating: 4.7,
        stock: 100,
        club_price: 8.50
    },
    {
        name: "Tata Gold Premium Tea",
        category: "Beverages",
        price: 4.50,
        unit: "1kg",
        image_url: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&q=80&w=800",
        bestseller: true,
        rating: 4.9,
        stock: 200,
        club_price: 3.99
    },
    {
        name: "Haldiram's Bhujia Sev",
        category: "Snacks",
        price: 2.99,
        unit: "400g",
        image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.5,
        stock: 150,
        club_price: 2.50
    },
    {
        name: "Amul Pure Ghee",
        category: "Dairy & Pantry",
        price: 8.99,
        unit: "1L",
        image_url: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&q=80&w=800",
        bestseller: true,
        rating: 4.9,
        stock: 80,
        club_price: 7.99
    },
    {
        name: "MDH Deggi Mirch (Chili Powder)",
        category: "Spices",
        price: 1.99,
        unit: "100g",
        image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.8,
        stock: 300,
        club_price: null
    },
    {
        name: "Tata Sampann Toor Dal",
        category: "Grains & Rice",
        price: 3.49,
        unit: "1kg",
        image_url: "https://images.unsplash.com/photo-1515543904379-3d757afe72bd?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.6,
        stock: 120,
        club_price: 2.99
    },
    {
        name: "Parle-G Biscuits",
        category: "Snacks",
        price: 0.99,
        unit: "300g",
        image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.4,
        stock: 500,
        club_price: null
    },
    {
        name: "Maggi 2-Minute Noodles",
        category: "Snacks",
        price: 2.50,
        unit: "Pack of 4",
        image_url: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=800",
        bestseller: true,
        rating: 4.7,
        stock: 250,
        club_price: 2.00
    },
    {
        name: "Fortune Mustard Oil",
        category: "Dairy & Pantry",
        price: 4.99,
        unit: "1L",
        image_url: "https://images.unsplash.com/photo-1474979266404-7caddb59f858?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.5,
        stock: 60,
        club_price: null
    },
    {
        name: "Everest Chaat Masala",
        category: "Spices",
        price: 1.50,
        unit: "100g",
        image_url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.8,
        stock: 200,
        club_price: 1.25
    },
    {
        name: "Britannia Good Day Butter Cookies",
        category: "Snacks",
        price: 1.99,
        unit: "200g",
        image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800",
        bestseller: false,
        rating: 4.3,
        stock: 150,
        club_price: null
    }
];

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Clear existing products (optional)
    const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
        console.error('Error clearing table:', deleteError);
    } else {
        console.log('Cleared existing products.');
    }

    // 2. Insert new products
    const { data, error } = await supabase
        .from('products')
        .insert(products)
        .select();

    if (error) {
        console.error('Error seeding products:', error);
    } else {
        console.log(`✅ Successfully seeded ${data.length} products!`);
    }
}

seed();
