import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Utensils,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-react';
import { getImageUrl } from '../lib/api';
import { Product, Category } from '../types';

interface ProductsViewProps {
  products: Product[];
  categories?: Category[];
  loading?: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number | string) => void;
}

export default function ProductsView({
  products,
  categories = [],
  loading,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}: ProductsViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getCategoryDisplayName = (p: Product) => {
    if (p.category_name) return p.category_name;
    if (p.category_id) {
      const found = categories.find((c) => Number(c.id) === Number(p.category_id));
      if (found) return found.name;
    }
    return 'Kategoriyasiz';
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;

    const selNum = Number(selectedCategory);
    if (!isNaN(selNum) && selNum > 0) {
      return Number(p.category_id) === selNum;
    }
    return getCategoryDisplayName(p) === selectedCategory;
  });

  const totalCount = products.length;
  const availableCount = products.filter((p) => Number(p.is_available) === 1).length;
  const outOfStockCount = totalCount - availableCount;

  if (loading) {
    return (
      <div className="space-y-6 animate-tab-content">
        <div className="h-20 bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-content">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Taomlar va Menyu Boshqaruvi
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-800/60">
              {totalCount} ta taom
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Restoran menyusidagi taomlarni tahrirlash, narxlarni belgilash va stop-list nazorati
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid vs Table View Switch */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              title="Katalog ko'rinishi"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Jadval ko'rinishi"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Taom Qo'shish</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Jami Taomlar</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{totalCount} ta</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Sotuvda Mavjud</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{availableCount} ta</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Stop-listda (Tugagan)</span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block">{outOfStockCount} ta</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-amber-500 text-white shadow-xs font-black'
                : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            Barchasi ({totalCount})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => Number(p.category_id) === Number(cat.id)).length;
            const isSelected = selectedCategory === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-amber-500 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Taom nomi yoki tavsifi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 dark:text-white dark:placeholder-slate-500 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* 4. Products Display (Grid or Table) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-16 text-center shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-300 dark:text-slate-600 flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Hech qanday taom topilmadi</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'Qidiruv bo\'yicha mos taom yo\'q.' : 'Yuqoridagi tugma orqali yangi taom qo\'shishingiz mumkin.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISUAL FOOD CARDS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const imgSource = getImageUrl(p.image_url);
            const isAvailable = Number(p.is_available) === 1;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs card-hover-effect flex flex-col justify-between group"
              >
                <div>
                  {/* Food Image */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                    <img
                      src={imgSource}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                      }}
                    />

                    {/* Category badge overlay */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 dark:bg-black/80 backdrop-blur-md text-white text-[10px] font-extrabold shadow-sm">
                      {getCategoryDisplayName(p)}
                    </span>

                    {/* Stock Status badge */}
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md shadow-sm flex items-center gap-1 ${
                      isAvailable
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      <span>{isAvailable ? 'Mavjud' : 'Stop-list'}</span>
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description || "Tavsifi ko'rsatilmagan"}
                    </p>
                  </div>
                </div>

                {/* Footer price & actions */}
                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                  <span className="font-black text-base text-amber-600 dark:text-amber-400">
                    {p.price?.toLocaleString()} <span className="text-[10px] text-slate-400">so'm</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditProduct(p)}
                      className="p-2 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer shadow-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800/60"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4 pl-6">Taom</th>
                <th className="p-4">Kategoriya</th>
                <th className="p-4">Narxi</th>
                <th className="p-4">Holat</th>
                <th className="p-4 pr-6 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const imgSource = getImageUrl(p.image_url);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-850 shadow-xs">
                          <img
                            src={imgSource}
                            alt={p.name}
                            loading="lazy"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                            }}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-sm text-slate-900 dark:text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                            {p.description || "Tavsifi yo'q"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                        {getCategoryDisplayName(p)}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                        {p.price?.toLocaleString()} so'm
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        Number(p.is_available) === 1
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${Number(p.is_available) === 1 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{Number(p.is_available) === 1 ? 'Mavjud' : 'Stop-listda'}</span>
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => onEditProduct(p)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
