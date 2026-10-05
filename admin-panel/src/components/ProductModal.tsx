import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { X, Upload, Utensils, Check, Star, Clock, ShieldCheck, Flame, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../lib/api';
import { compressImageFile } from '../lib/imageCompressor';
import { Category, ProductFormData } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  productForm: ProductFormData;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  categories: Category[];
  onFileChange?: (e: ChangeEvent<HTMLInputElement> | { target: { files: any[] } }) => void;
  onSave: (e: FormEvent) => void | Promise<void>;
  isSaving?: boolean;
  uploadPercent?: number;
}

export default function ProductModal({
  isOpen,
  onClose,
  isEditing,
  productForm,
  setProductForm,
  categories,
  onFileChange,
  onSave,
  isSaving = false,
  uploadPercent = 0
}: ProductModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageLoadFailed, setImageLoadFailed] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [isImgLoading, setIsImgLoading] = useState<boolean>(false);

  useEffect(() => {
    setImageLoadFailed(false);
    if (productForm.image_url) {
      const url = getImageUrl(productForm.image_url);
      setPreviewUrl(url);
      setIsImgLoading(true);
      setLoadingPercent(15);
    } else {
      setPreviewUrl('');
      setIsImgLoading(false);
      setLoadingPercent(0);
    }
  }, [productForm.image_url, isOpen]);

  // Rasm yuklanganda progress foizini mayin oshirish (15% -> 90%)
  useEffect(() => {
    let timer: any = null;
    if (isImgLoading && !imageLoadFailed) {
      timer = setInterval(() => {
        setLoadingPercent((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isImgLoading, imageLoadFailed]);

  const handleLocalFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoadFailed(false);
      setIsProcessingImage(true);
      setIsImgLoading(true);
      setLoadingPercent(20);
      try {
        const compressed = await compressImageFile(file, { mode: 'cover' });
        setLoadingPercent(85);
        setPreviewUrl(URL.createObjectURL(compressed));
        if (onFileChange) {
          onFileChange({ target: { files: [compressed] } } as any);
        }
      } catch (err) {
        setPreviewUrl(URL.createObjectURL(file));
        if (onFileChange) {
          onFileChange(e);
        }
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isEditing ? 'Taom Ma\'lumotlarini Tahrirlash' : 'Yangi Taom Qo\'shish'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Menyuda mijozlarga ko'rinadigan parametrlar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Taom nomi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Taom nomi *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Maxsus Oshi, Chizburger..."
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Kategoriya va Narx */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kategoriya *
              </label>
              <select
                required
                value={productForm.category_id ? String(productForm.category_id) : (categories[0] ? String(categories[0].id) : '')}
                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all cursor-pointer dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-slate-900 dark:text-white">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Narxi (so'mda) *
              </label>
              <input
                type="number"
                required
                placeholder="45000"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tavsifi va tarkibi
            </label>
            <textarea
              rows={3}
              placeholder="Masalan: Mol go'shti, pomidor, maxsus sous, qovurilgan kartoshka..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Rasm tanlash & Ko'rish */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Taom Rasmi
            </label>

            {previewUrl && (
              <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative aspect-square w-36 sm:w-40 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md group">
                  {/* Foiz (%) bilan doiraviy yuklanish indikatori */}
                  {(isImgLoading || isProcessingImage || isSaving) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-xs p-3">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            className="text-slate-700"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={163.36}
                            strokeDashoffset={163.36 - (((isSaving ? (uploadPercent || 50) : loadingPercent) || 5) / 100) * 163.36}
                            strokeLinecap="round"
                            className="text-amber-500 transition-all duration-200"
                          />
                        </svg>
                        <span className="absolute text-xs font-black text-white">
                          {isSaving ? (uploadPercent || 50) : loadingPercent}%
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-2 text-center">
                        {isSaving ? `Serverga saqlanmoqda (${uploadPercent || 0}%)` : `Yuklanmoqda: ${loadingPercent}%`}
                      </span>
                    </div>
                  )}

                  {/* Agar rasm xato bo'lsa: 0% va qayta urinish */}
                  {imageLoadFailed && !isImgLoading && !isProcessingImage && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 p-2">
                      <div className="w-11 h-11 rounded-full border-2 border-red-500/40 text-red-500 flex items-center justify-center mb-1 font-black text-xs">
                        0%
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">0% — Rasm topilmadi</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageLoadFailed(false);
                          setIsImgLoading(true);
                          setLoadingPercent(20);
                        }}
                        className="mt-1 text-[10px] font-bold text-amber-500 hover:underline cursor-pointer"
                      >
                        Qayta urinish
                      </button>
                    </div>
                  )}

                  {!imageLoadFailed && (
                    <img
                      src={previewUrl}
                      alt="Taom ko'rinishi"
                      loading="eager"
                      onLoad={() => {
                        setLoadingPercent(100);
                        setIsImgLoading(false);
                      }}
                      onError={() => {
                        setImageLoadFailed(true);
                        setIsImgLoading(false);
                      }}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isImgLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl('');
                      setImageLoadFailed(false);
                      setIsImgLoading(false);
                      setLoadingPercent(0);
                      setProductForm({ ...productForm, image_url: '' });
                      if (onFileChange) onFileChange({ target: { files: [] } });
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-red-600/90 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer z-30"
                  >
                    O'chirish
                  </button>
                </div>

                {!isImgLoading && !imageLoadFailed && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mini App uchun ideal 1:1 kvadrat formatga moslandi</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">Fayl yuklash</span>
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Rasm tanlash</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-medium">yoki Rasm havolasi</span>
                <input
                  type="text"
                  placeholder="https://... yoki /uploads/..."
                  value={productForm.image_url}
                  onChange={(e) => {
                    setProductForm({ ...productForm, image_url: e.target.value });
                    setPreviewUrl(e.target.value ? getImageUrl(e.target.value) : '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Sotuvda mavjudlik switch */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-850 transition-colors">
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-white">
                  Taom sotuvda mavjud (Faol)
                </span>
                <span className="block text-[11px] text-slate-400">
                  Agar o'chirib qo'ysangiz, taom Mini Appda Stop-listda ko'rinadi
                </span>
              </div>
              <input
                type="checkbox"
                checked={Number(productForm.is_available) === 1}
                onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked ? 1 : 0 })}
                className="w-5 h-5 text-amber-500 rounded-lg accent-amber-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Qo'shimcha Nishonlar va Parametrlar (Ixtiyoriy) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Qo'shimcha nishonlar va parametrlar (Ixtiyoriy)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Agar to'ldirilmasa, Mini Appda ko'rsatilmaydi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Reyting */}
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span>Reyting</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 4.9 (120+)"
                  value={productForm.rating || ''}
                  onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Tayyorlanish vaqti */}
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Tayyorlanish vaqti</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 15-25 daqiqa"
                  value={productForm.prep_time || ''}
                  onChange={(e) => setProductForm({ ...productForm, prep_time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Sifat nishoni */}
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Sifat nishoni</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 100% Halol"
                  value={productForm.quality_badge || ''}
                  onChange={(e) => setProductForm({ ...productForm, quality_badge: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Holati / Teg */}
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  <Flame className="w-3 h-3 text-rose-500" />
                  <span>Holati / Teg</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Issiq & Yangi"
                  value={productForm.tag || ''}
                  onChange={(e) => setProductForm({ ...productForm, tag: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
