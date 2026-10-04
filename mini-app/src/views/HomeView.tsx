import React from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  ShoppingBag, 
  LayoutGrid, 
  Plus, 
  Minus, 
  ChevronRight, 
  Flame, 
  Star,
  X 
} from 'lucide-react';
import type { Product, Category } from '../types';
import type { CartItem } from '../CartContext';
import { getImageUrl } from '../lib/api';
import { OptimizedImage } from '../components/OptimizedImage';
import { getCategoryIcon, cleanCategoryName } from '../components/FoodCategoryIcons';

export type { Category };

interface HomeViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: Category[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  products: Product[];
  loading: boolean;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  onOpenCategories: () => void;
  onSelectProduct: (product: Product) => void;
}

export default function HomeView({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  products,
  loading,
  cart,
  addToCart,
  removeFromCart,
  onOpenCategories,
  onSelectProduct
}: HomeViewProps) {
  return (
    <main className="max-w-md mx-auto px-4.5 space-y-4 pt-1 pb-4">
      {/* 1. Qidiruv paneli */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-emerald-800/40 dark:text-emerald-400/50 group-focus-within:text-emerald-700 dark:group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Fast food, burger, ichimlik qidirish..."
            aria-label="Taom qidirish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-[#1A241E] border border-neutral-200/70 dark:border-neutral-800 rounded-2xl text-[13px] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 dark:focus:border-emerald-500 shadow-soft transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Qidiruvni tozalash"
              className="absolute right-2.5 top-2.5 p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button 
          onClick={onOpenCategories}
          aria-label="Kategoriyalar filtri"
          className="p-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white rounded-2xl shadow-soft transition-all cursor-pointer flex items-center justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Banner */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#FFF9EE] via-[#FFF3D6] to-[#FFE8B3] dark:from-[#1E1B10] dark:via-[#262214] dark:to-[#17140B] border border-amber-300/40 dark:border-amber-700/30 p-5 shadow-soft">
        <div className="max-w-[58%] sm:max-w-[62%] space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wide bg-amber-500/15 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Samira Fast Food
          </span>
          <h2 className="text-base font-extrabold text-[#11311F] dark:text-[#E8F0EA] leading-tight tracking-tight">
            Eng Mazali Fast Food <span className="text-amber-600 dark:text-amber-400">G'uzor</span>
          </h2>
          <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 leading-tight">
            Burger, Lavash va Hotdoglar — Tezkor Dostavka!
          </p>
          <div className="pt-1">
            <button 
              onClick={onOpenCategories}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <span>Menyu bilan tanishish</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="absolute -right-3 -bottom-3 sm:right-1 sm:bottom-1 w-36 h-36 sm:w-40 sm:h-40 pointer-events-none flex items-center justify-center">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
            {/* Orqa fon yorug'ligi (Ambient Glow) */}
            <div className="absolute inset-0 rounded-full bg-amber-500/25 dark:bg-amber-500/15 blur-lg -z-10 animate-pulse" />
            <img 
              src="/samira-delivery.webp" 
              alt="Samira Fast Food Yetkazib Berish" 
              className="w-full h-full object-contain drop-shadow-md select-none transform hover:scale-105 transition-transform" 
              onError={(e) => { 
                if (e.currentTarget.src.endsWith('.webp')) {
                  e.currentTarget.src = '/samira-delivery.png';
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Kategoriyalar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 tracking-tight flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Kategoriyalar</span>
          </h3>
          <button 
            onClick={onOpenCategories}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            Barchasi &rarr;
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              selectedCategory === null
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-soft shadow-emerald-800/20'
                : 'bg-white dark:bg-[#1A241E] text-neutral-600 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#202D24] shadow-soft'
            }`}
          >
            {getCategoryIcon('all', 'w-4 h-4')}
            <span>Barchasi</span>
          </button>

          {categories.map((cat) => {
            const cleanName = cleanCategoryName(cat.name);
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-soft shadow-emerald-800/20'
                    : 'bg-white dark:bg-[#1A241E] text-neutral-600 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#202D24] shadow-soft'
                }`}
              >
                {getCategoryIcon(cat.name, "w-4 h-4 drop-shadow-xs")}
                <span>{cleanName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Taomlar Ro'yxati */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 tracking-tight">
            {searchQuery.trim() ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>Qidiruv natijalari:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black">"{searchQuery.trim()}"</span>
                <span className="text-neutral-400 font-semibold">({products.length} ta)</span>
              </span>
            ) : (
              <span>Saralangan Taomlar ({products.length})</span>
            )}
          </h3>
          {searchQuery.trim() && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Tozalash
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-[#1A241E] rounded-3xl p-3 border border-neutral-100 dark:border-neutral-800 shadow-soft animate-pulse space-y-3">
                <div className="aspect-square bg-neutral-100 dark:bg-[#233127] rounded-2xl"></div>
                <div className="h-3 bg-neutral-100 dark:bg-[#233127] rounded-md w-3/4"></div>
                <div className="h-3 bg-neutral-100 dark:bg-[#233127] rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          searchQuery.trim() ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-[#1A241E] rounded-3xl border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-3">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100">
                  Taom topilmadi
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  "{searchQuery.trim()}" bo'yicha hech qanday taom topilmadi. So'z to'g'ri yozilganini tekshiring yoki barcha menyuni ko'ring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-soft transition-all active:scale-95 cursor-pointer"
              >
                <span>Barcha menyuni ko'rish</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-[#1A241E] rounded-3xl border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-2">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Menyuda hozircha taomlar yo'q</h3>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Tez orada Admin panel orqali yangi taomlar joylashtiriladi</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => {
              const inCart = cart.find((item) => item.id === p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#1A241E] rounded-[24px] p-3 border border-neutral-200/60 dark:border-neutral-800 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div 
                      onClick={() => onSelectProduct(p)}
                      className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#F2F6F3] dark:bg-[#141C16] mb-2.5 cursor-pointer"
                    >
                      <OptimizedImage
                        src={getImageUrl(p.image_url)}
                        alt={p.name}
                        loading="eager"
                        wrapperClassName="absolute inset-0 w-full h-full"
                        className="group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-white/90 dark:bg-[#1A241E]/90 backdrop-blur-xs shadow-xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-200">Top</span>
                      </div>

                      {!p.is_available && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold px-2 py-0.5 bg-red-600 rounded-md">Tugagan</span>
                        </div>
                      )}
                    </div>

                    <h4 
                      onClick={() => onSelectProduct(p)}
                      className="font-extrabold text-xs line-clamp-1 leading-snug text-[#1A2E22] dark:text-[#E8F0EA] cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      {p.name}
                    </h4>
                    <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 line-clamp-1 leading-normal mt-0.5 h-4">
                      {p.description || 'Yangi va toza ingredientlar'}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between mt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div>
                      <span className="text-xs font-black text-[#143220] dark:text-emerald-400 block leading-tight">
                        {p.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">so'm</span>
                    </div>

                    {p.is_available ? (
                      inCart ? (
                        <div className="flex items-center bg-[#EBF6EE] dark:bg-[#162D1E] rounded-xl p-0.5 border border-emerald-100 dark:border-emerald-800/40">
                          <button
                            onClick={() => removeFromCart(p.id)}
                            aria-label={`${p.name} — bitta kamaytirish`}
                            className="w-5 h-5 flex items-center justify-center bg-white dark:bg-[#203627] text-emerald-800 dark:text-emerald-300 rounded-lg shadow-xs active:scale-90 transition-transform cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 px-1.5">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(p)}
                            aria-label={`${p.name} — bitta ko'paytirish`}
                            className="w-5 h-5 flex items-center justify-center bg-emerald-700 dark:bg-emerald-600 text-white rounded-lg shadow-xs active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          aria-label={`${p.name} — savatchaga qo'shish`}
                          className="w-7 h-7 flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-90 text-white rounded-xl shadow-soft transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
