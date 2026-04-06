export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Total Sales</h3>
                    <p className="text-3xl font-black text-slate-900">£12,345.00</p>
                    <span className="text-emerald-600 text-sm font-bold flex items-center mt-2">
                        +12.5% <span className="text-slate-400 font-normal ml-1">from last month</span>
                    </span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Active Orders</h3>
                    <p className="text-3xl font-black text-slate-900">24</p>
                    <span className="text-amber-600 text-sm font-bold flex items-center mt-2">
                        8 pending <span className="text-slate-400 font-normal ml-1">shipment</span>
                    </span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Total Products</h3>
                    <p className="text-3xl font-black text-slate-900">65</p>
                    <span className="text-slate-400 text-sm mt-2 block">
                        Across 8 categories
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">📦</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">New Order #102{i}</p>
                                    <p className="text-xs text-slate-500">2 minutes ago</p>
                                </div>
                            </div>
                            <span className="text-emerald-600 font-bold text-sm">£45.20</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
