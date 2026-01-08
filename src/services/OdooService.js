import { MOCK_PRODUCTS } from '../data/mockData';

/**
 * ==========================================
 * ODOO CONFIGURATION & SERVICE LAYER
 * ==========================================
 * This layer simulates JSON-RPC calls to an Odoo instance.
 * In production, use a proxy middleware or CORS-enabled Odoo endpoints.
 */

// --- ODOO JSON-RPC SIMULATION ---
export const OdooService = {
    /**
     * Generic helper to simulate Odoo Model calls (External API)
     * Real implementation would use fetch() to /jsonrpc
     */
    execute_kw: async (model, method, args, _kwargs = {}) => {
        console.log(`[ODOO RPC] Model: ${model} | Method: ${method}`, args);
        // Simulate network latency
        return new Promise((resolve) => setTimeout(() => resolve(true), 600));
    },

    // 1. FETCH PRODUCTS (Model: product.template)
    getProducts: async () => {
        // Odoo Query: search_read([['sale_ok', '=', True], ['qty_available', '>', 0]], fields=['name', 'list_price', 'image_1920'])
        await OdooService.execute_kw('product.template', 'search_read', [[['sale_ok', '=', true]]]);
        return MOCK_PRODUCTS; // Returning mock data for UI demo
    },

    // 2. CREATE SALES ORDER (Model: sale.order)
    createOrder: async (cartItems, customerId = 1) => {
        // Step 1: Create Order Header
        const orderId = "SO-" + Math.floor(Math.random() * 10000);
        await OdooService.execute_kw('sale.order', 'create', [{
            partner_id: customerId,
            state: 'draft', // Quotation
            date_order: new Date().toISOString()
        }]);

        // Step 2: Create Order Lines
        const lines = cartItems.map(item => ({
            product_id: item.id,
            product_uom_qty: item.qty,
            price_unit: item.price
        }));
        await OdooService.execute_kw('sale.order.line', 'create', lines);

        return { success: true, orderId };
    },

    // 3. CRM LEAD GENERATION (Model: crm.lead)
    createCrmLead: async (message, contactInfo) => {
        await OdooService.execute_kw('crm.lead', 'create', [{
            name: `Website Inquiry: ${message.substring(0, 20)}...`,
            description: message,
            contact_name: contactInfo || 'Guest User',
            type: 'lead',
            source_id: 1 // 'Website' source
        }]);
        return { success: true };
    },

    // 4. NEWSLETTER SUBSCRIPTION (Model: mailing.contact)
    subscribeNewsletter: async (email) => {
        await OdooService.execute_kw('mailing.contact', 'create', [{
            email: email,
            list_ids: [1] // ID of the 'Newsletter' mailing list
        }]);
        return { success: true };
    }
};
