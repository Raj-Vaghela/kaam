import React, { useState } from 'react';
import { ShoppingBasket, Star, Minus, Plus, Heart, ImageIcon } from 'lucide-react';
import UnitPrice from './UnitPrice';

const ProductCard = ({ product, addToCart }) => {
    const [qty, setQty] = useState(1);
    const [imgError, setImgError] = useState(false);

    const handleIncrement = () => setQty(q => q + 1);
    const handleDecrement = () => setQty(q => (q > 1 ? q - 1 : 1));

    const hasClubPrice = product.clubPrice;
    const displayPrice = hasClubPrice ? product.clubPrice : product.price;

    return (
        <div className="flex flex-col bg-white border border-slate-300 hover:border-emerald-600 transition-all duration-200 rounded-lg overflow-hidden h-full shadow-sm hover:shadow-md group">
            <div className="relative h-48 bg-white border-b border-slate-100 overflow-hidden">
                {imgError ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <ImageIcon size={32} />
                    </div>
                ) : (
                    <img
                        src={product.imgUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImgError(true)}
                    />
                )}

                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {product.bestseller && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 w-fit rounded shadow-sm uppercase tracking-wide">Best Seller</span>
                    )}
                    {hasClubPrice && (
                        <span className="bg-yellow-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 w-fit rounded shadow-sm border border-yellow-500 uppercase">Club Price</span>
                    )}
                </div>
                <button className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full text-slate-400 hover:text-red-500 transition-colors z-10">
                    <Heart size={16} />
                </button>
            </div>

            <div className="p-3 flex flex-col flex-grow">
                <div className="mb-2">
                    <h3 className="text-slate-900 font-bold text-sm leading-snug min-h-[2.5rem] line-clamp-2 group-hover:text-emerald-800 transition-colors">{product.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{product.unit}</p>
                </div>

                <div className="flex items-center gap-1 mb-3">
                    <div className="flex text-amber-400 text-[10px]">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                        ))}
                    </div>
                    <span className="text-[10px] text-slate-400">({product.rating})</span>
                </div>

                <div className="mt-auto">
                    <div className={`mb-3 p-2 rounded ${hasClubPrice ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-xl font-bold ${hasClubPrice ? 'text-red-600' : 'text-slate-900'}`}>£{displayPrice.toFixed(2)}</span>
                            {hasClubPrice && <span className="text-xs text-slate-400 line-through">£{product.price.toFixed(2)}</span>}
                        </div>
                        <UnitPrice price={displayPrice} weightKg={product.weight_kg} />
                    </div>

                    <div className="flex items-center h-10 w-full">
                        <div className="flex items-center border border-slate-300 rounded-l h-full bg-slate-50">
                            <button onClick={handleDecrement} className="px-3 hover:bg-slate-200 text-slate-600 h-full flex items-center transition-colors"><Minus size={14} /></button>
                            <input type="text" value={qty} readOnly className="w-8 text-center text-xs font-bold text-slate-800 h-full border-none bg-transparent p-0" />
                            <button onClick={handleIncrement} className="px-3 hover:bg-slate-200 text-slate-600 h-full flex items-center transition-colors"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => addToCart(product, qty)} className="flex-grow bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase h-full rounded-r transition-all flex items-center justify-center gap-1 active:scale-95 shadow-sm">
                            Add <ShoppingBasket size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
