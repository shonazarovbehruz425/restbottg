import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X, Plus, Minus, Star, Clock, ShieldCheck, Flame, ShoppingBag, Check } from 'lucide-react';
import type { Product } from '../types';
import { getImageUrl } from '../lib/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setIsAdded(false);
      setDragY(0);
      setIsDragging(false);
    }
  }, [product?.id]);

  if (!product) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop > 5) return;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      // Pastga tortilganda silliq qarshilik bilan ergashadi
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 85) {
      onClose();
    }
    setDragY(0);
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const totalPrice = (Number(product.price) || 0) * quantity;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#1A241E] w-full max-w-md rounded-t-[36px] sm:rounded-[36px] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-transparent dark:border-neutral-800/80 overflow-hidden"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 1. Yuqori Drag tutqichi (Pastga surish indikatori) */}
        <div className="pt-3 pb-1.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-neutral-300/80 dark:bg-neutral-700 hover:bg-neutral-400 transition-colors"></div>
        </div>

        {/* 2. Yuqori Navigatsiya Bari */}
        <div className="px-5 py-2 flex items-center justify-between shrink-0 border-b border-neutral-100/70 dark:border-neutral-800/50">
          <button 
            onClick={onClose}
            aria-label="Orqaga"
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#202E24] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#283b2e] active:scale-90 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <span className="text-[11px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
            Taom ma'lumoti
          </span>

          <button 
            onClick={onClose}
            aria-label="Yopish"
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#202E24] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#283b2e] active:scale-90 transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Asosiy Scroll Bo'ladigan Maydon (Rasmlar, Masalliqlar, Tavsif) */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain no-scrollbar"
        >
          {/* Taom Rasmi Card */}
          <div className="w-full h-56 sm:h-64 rounded-[28px] overflow-hidden bg-gradient-to-b from-[#F2F6F3] to-[#E5EFE8] dark:from-[#141C16] dark:to-[#0E1510] shadow-soft relative group">
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name}
              loading="eager"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradient Dark Overlay tagi */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>

            {/* Reyting va Holat nishonlari */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span>Mavjud</span>
              </span>
            </div>

            <div className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1A241E]/95 backdrop-blur-md shadow-soft flex items-center gap-1.5 border border-white/20 dark:border-neutral-700/50">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-neutral-900 dark:text-white">4.9</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">(120+)</span>
            </div>
          </div>

          {/* Nomi va Teglar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-black text-xl sm:text-2xl text-[#11311F] dark:text-[#E8F0EA] leading-tight tracking-tight">
                {product.name}
              </h2>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] whitespace-nowrap shadow-2xs">
                Yangi tayyorlangan
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
              {product.description || 'Restoranimiz oshpazlari tomonidan tabiiy va yangi masalliqlardan buyurtma asosida tayyorlangan mazali taom.'}
            </p>
          </div>

          {/* Qulaylik va Sifat Ko'rsatkichlari (3-lik Grid) */}
          <div className="grid grid-cols-3 gap-2 pt-1 pb-1">
            <div className="p-2.5 bg-[#F8FAF8] dark:bg-[#141C16] rounded-2xl border border-neutral-100 dark:border-neutral-800/80 flex flex-col items-center text-center gap-1 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-amber-100/80 dark:bg-[#2A2315] text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500">Tayyorlash</span>
              <span className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 leading-none">15-25 daqiqa</span>
            </div>

            <div className="p-2.5 bg-[#F8FAF8] dark:bg-[#141C16] rounded-2xl border border-neutral-100 dark:border-neutral-800/80 flex flex-col items-center text-center gap-1 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-100/80 dark:bg-[#162D1E] text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500">Sifat</span>
              <span className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 leading-none">100% Halol</span>
            </div>

            <div className="p-2.5 bg-[#F8FAF8] dark:bg-[#141C16] rounded-2xl border border-neutral-100 dark:border-neutral-800/80 flex flex-col items-center text-center gap-1 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-rose-100/80 dark:bg-[#2D161A] text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500">Holati</span>
              <span className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 leading-none">Issiq & Yangi</span>
            </div>
          </div>
        </div>

        {/* 4. Pastki Qotib Turuvchi Action Bar (Sticky Footer — Har doim ko'rinib turadi) */}
        <div className="px-5 py-3.5 bg-white/95 dark:bg-[#1A241E]/95 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            {/* Narx */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block leading-tight">
                Jami narx
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {totalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  so'm
                </span>
              </div>
            </div>

            {/* Soni Stepper (- 1 +) */}
            <div className="flex items-center gap-2 bg-neutral-100/90 dark:bg-[#202E24] p-1 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Kamaytirish"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  quantity <= 1
                    ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                    : 'bg-white dark:bg-[#2A3D30] text-neutral-800 dark:text-neutral-100 shadow-xs active:scale-90 hover:bg-neutral-50 cursor-pointer'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="w-7 text-center font-black text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Ko'paytirish"
                className="w-8 h-8 rounded-xl bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Qo'shish Asosiy Tugmasi */}
          <button
            onClick={handleAdd}
            disabled={isAdded}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
              isAdded 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Savatchaga qo'shildi!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Savatchaga qo'shish ({quantity}x)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
