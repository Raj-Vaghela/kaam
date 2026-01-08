import React from 'react';

const UnitPrice = ({ price, weightKg }) => {
    if (!weightKg) return null;
    const pricePerKg = (price / weightKg).toFixed(2);
    return <span className="text-xs text-slate-500">£{pricePerKg}/kg</span>;
};

export default UnitPrice;
