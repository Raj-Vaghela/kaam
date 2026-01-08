import React from 'react';
import { ShoppingBasket, X, Minus, Plus, ArrowRight } from 'lucide-react';

const TrolleyDrawer = ({ isOpen, close, cart, removeFromCart, updateQty, total, checkout }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={close}></div>
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shadow-md">
                    <h2 className="text-lg font-bold flex items-center gap-2 font-serif">
                        <ShoppingBasket size={24} className="text-amber-400" /> Your Trolley
                    </h2>
                    <button onClick={close} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="bg-slate-50 p-3 border-b border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Spend £{Math.max(0, 60 - total).toFixed(2)} more for Free Delivery</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (total / 60) * 100)}%` }}></div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 bg-white space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="bg-slate-50 p-6 rounded-full shadow-sm mb-4"><ShoppingBasket size={48} className="text-slate-300" /></div>
                            <p className="text-lg font-bold text-slate-700 font-serif">Your trolley is empty</p>
                            <p className="text-sm text-slate-500 max-w-[200px] mb-6">Start adding your essentials.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="bg-white p-2 border-b border-slate-100 flex gap-3 relative group">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded overflow-hidden">
                                    <img src={item.image || "https://placehold.co/100x100?text=Product"} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start pr-6">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.name}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center border border-slate-300 rounded-sm bg-white h-7">
                                            <button onClick={() => updateQty(item.id, item.qty - 1)} className="px-2 hover:bg-slate-100 text-slate-600 h-full flex items-center" disabled={item.qty <= 1}><Minus size={10} /></button>
                                            <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-2 hover:bg-slate-100 text-slate-600 h-full flex items-center"><Plus size={10} /></button>
                                        </div>
                                        <p className="font-bold text-slate-900">£{(item.price * item.qty).toFixed(2)}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"><X size={16} /></button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <div className="space-y-1 mb-4 text-sm">
                        <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>£{total.toFixed(2)}</span></div>
                        <div className="flex justify-between text-slate-600"><span>Delivery</span><span className={total > 60 ? "text-green-600 font-bold" : ""}>{total > 60 ? 'FREE' : '£3.99'}</span></div>
                        <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2 font-serif"><span>Total</span><span>£{total > 60 ? total.toFixed(2) : (total + 3.99).toFixed(2)}</span></div>
                    </div>
                    <button onClick={checkout} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 rounded shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                        Checkout Securely <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrolleyDrawer;
