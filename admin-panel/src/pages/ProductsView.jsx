import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Utensils,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getImageUrl } from '../lib/api';

export default function ProductsView({ products, loading, onAddProduct, onEditProduct, onDeleteProduct }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Extract unique categories
  const categoriesMap = {};
  products.forEach(p => {
    const catName = p.category_name || 'Boshqa';
    categoriesMap[catName] = (categoriesMap[catName] || 0) + 1;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (p.category_name || 'Boshqa') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCount = products.length;
  const availableCount = products.filter(p => p.is_available === 1).length;
  const outOfStockCount = totalCount - availableCount;

  if (loading) {
    return (
      <div className="space-y-6 animate-tab-content">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-3 w-72 max-w-full bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 h-20 animate-pulse">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Menyudagi Taomlar</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {totalCount} ta
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Taomlarni boshqarish, narxlarni o'zgartirish va stop-listga kiritish
          </p>
        </div>

        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Taom Qo'shish</span>
        </button>
      </div>

      {/* 2. Stat Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Jami Taomlar</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalCount} ta</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Sotuvda Mavjud</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">{availableCount} ta</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Stop-listda (Tugagan)</span>
            <span className="text-xl font-black text-red-600 mt-0.5 block">{outOfStockCount} ta</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filters: Search & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            Barchasi ({totalCount})
          </button>
          {Object.entries(categoriesMap).map(([catName, catCount]) => (
            <button
              key={catName}
              onClick={() => setSelectedCategory(catName)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === catName
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {catName} ({catCount})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Taom nomi yoki tavsifi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* 4. Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200/80">
            <tr>
              <th className="p-4 pl-6">Taom</th>
              <th className="p-4">Kategoriya</th>
              <th className="p-4">Narxi</th>
              <th className="p-4">Holat</th>
              <th className="p-4 pr-6 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-300">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-xs text-slate-700">Hech qanday taom topilmadi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {searchQuery ? 'Qidiruv bo\'yicha mos taom yo\'q.' : 'Yuqoridagi tugma orqali yangi taom qo\'shing.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const imgSource = getImageUrl(p.image_url);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-xs">
                          <img
                            src={imgSource}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                            }}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-sm text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                            {p.description || "Tavsifi yo'q"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        {p.category_name || 'Kategoriyasiz'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-black text-amber-600 text-sm">
                        {p.price?.toLocaleString()} so'm
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        p.is_available === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_available === 1 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{p.is_available === 1 ? 'Mavjud' : 'Stop-listda'}</span>
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
