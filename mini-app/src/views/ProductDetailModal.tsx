import React from 'react';
import { ArrowLeft, Plus, Star, Clock, ShieldCheck } from 'lucide-react';
import type { Product } from '../types';
import { getImageUrl } from '../lib/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1A241E] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-transparent dark:border-neutral-800">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onClose}
            aria-label="Yopish"
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#202E24] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#283b2e] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Taom ma'lumoti</span>
          <div className="w-9"></div>
        </div>

        {/* Taom Rasmi */}
        <div className="aspect-square w-full rounded-[24px] overflow-hidden bg-[#F2F6F3] dark:bg-[#141C16] shadow-soft relative">
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-[#1A241E]/90 backdrop-blur-md shadow-soft flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">4.9 (120+)</span>
          </div>
        </div>

        {/* Nomi, Tavsifi, Narxi */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-lg text-[#11311F] dark:text-[#E8F0EA] leading-snug">{product.name}</h3>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] whitespace-nowrap">
              Yangi tayyorlangan
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {product.description || 'Restoranimiz oshpazlari tomonidan tabiiy va saralangan masalliqlardan tayyorlangan lazzatli taom.'}
          </p>
        </div>

        {/* Qulaylik ko'rsatkichlari */}
        <div className="grid grid-cols-2 gap-2.5 py-1">
          <div className="p-3 bg-[#F8FAF8] dark:bg-[#141C16] rounded-2xl border border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 dark:bg-[#162D1E] text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block">Tayyorlash vaqti</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">15-25 daqiqa</span>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAF8] dark:bg-[#141C16] rounded-2xl border border-neutral-100 dark:border-neutral-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 dark:bg-[#162D1E] text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 block">Sifat kafolati</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">100% Halol</span>
            </div>
          </div>
        </div>

        {/* Pastki buyurtma paneli */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 block">Narxi:</span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-400">
              {product.price.toLocaleString()} <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">so'm</span>
            </span>
          </div>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] text-white rounded-2xl text-xs font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Savatchaga qo'shish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
