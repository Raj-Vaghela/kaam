export interface OrderStatusConfig {
    bg: string;
    text: string;
    label: string;
}

export const orderStatusConfig: Record<string, OrderStatusConfig> = {
    paid: { bg: "bg-leaf-soft", text: "text-leaf", label: "Paid" },
    pending: { bg: "bg-haldi-soft", text: "text-haldi", label: "Pending" },
    cancelled: { bg: "bg-red-100", text: "text-rose", label: "Cancelled" },
    processing: { bg: "bg-accent-soft", text: "text-accent", label: "Processing" },
    shipped: { bg: "bg-[var(--gajju-teal-soft)]", text: "text-[var(--gajju-teal-deep)]", label: "Shipped" },
    delivered: { bg: "bg-leaf-soft", text: "text-leaf", label: "Delivered" },
    payment_received: { bg: "bg-haldi-soft", text: "text-haldi", label: "Payment Received" },
};

export const getStatusConfig = (status: string): OrderStatusConfig =>
    orderStatusConfig[status] || { bg: "bg-cream-deep", text: "text-ink-mute", label: status };

export interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number | string;
}
