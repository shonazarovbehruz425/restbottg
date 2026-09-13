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
  Star 
} from 'lucide-react';
import { Product, CartItem } from '../CartContext';

export interface Category {
  id: number;
  name: string;
  icon?: string;
}

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
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-emerald-800/40 dark:text-emerald-400/50 group-focus-within:text-emerald-700 dark:group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Search for fresh foods, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A241E] border border-neutral-200/70 dark:border-neutral-800 rounded-2xl text-[13px] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 dark:focus:border-emerald-500 shadow-soft transition-all"
          />
        </div>
        <button 
          onClick={onOpenCategories}
          className="p-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white rounded-2xl shadow-soft transition-all cursor-pointer flex items-center justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Yashil Banner */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#EAF6EE] via-[#E4F3E8] to-[#D5EEDC] dark:from-[#14261C] dark:via-[#182C20] dark:to-[#122218] border border-emerald-200/50 dark:border-emerald-800/40 p-5 shadow-soft">
        <div className="max-w-[62%] space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide bg-white/80 dark:bg-[#1A251E]/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Maxsus taklif
          </span>
          <h2 className="text-base font-extrabold text-[#11311F] dark:text-[#E8F0EA] leading-tight tracking-tight">
            Issiq & Yangi Taomlar <span className="text-emerald-700 dark:text-emerald-400">Tezkor Yetkazish</span>
          </h2>
          <p className="text-[11px] font-medium text-emerald-900/70 dark:text-emerald-300/70 leading-tight">
            Eng sara ingredientlardan tayyorlangan tansiq taomlar
          </p>
          <div className="pt-1">
            <button 
              onClick={onOpenCategories}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <span>Menyu bilan tanishish</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="absolute -right-2 -bottom-2 w-36 h-36 pointer-events-none flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-emerald-600/10 dark:bg-emerald-400/10 backdrop-blur-xs flex items-center justify-center border border-emerald-600/15 dark:border-emerald-400/15">
            <div className="w-20 h-20 rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shadow-soft transform rotate-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
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
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === null
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-soft shadow-emerald-800/20'
                : 'bg-white dark:bg-[#1A241E] text-neutral-600 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#202D24] shadow-soft'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Barchasi</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-soft shadow-emerald-800/20'
                  : 'bg-white dark:bg-[#1A241E] text-neutral-600 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#202D24] shadow-soft'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Taomlar Ro'yxati */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 tracking-tight">
            Saralangan Taomlar ({products.length})
          </h3>
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
          <div className="text-center py-16 px-4 bg-white dark:bg-[#1A241E] rounded-3xl border border-neutral-200/70 dark:border-neutral-800 shadow-soft space-y-2">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-100">Menyuda hozircha taomlar yo'q</h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Tez orada Admin panel orqali yangi taomlar joylashtiriladi</p>
          </div>
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
                      <img
                        src={p.image_url?.startsWith('/uploads') ? `http://localhost:5000${p.image_url}` : (p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500')}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
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
                            className="w-5 h-5 flex items-center justify-center bg-white dark:bg-[#203627] text-emerald-800 dark:text-emerald-300 rounded-lg shadow-xs active:scale-90 transition-transform cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 px-1.5">{inCart.quantity}</span>
                          <button
                            onClick={() => addToCart(p)}
                            className="w-5 h-5 flex items-center justify-center bg-emerald-700 dark:bg-emerald-600 text-white rounded-lg shadow-xs active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
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
