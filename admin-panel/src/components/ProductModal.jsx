import React, { useState, useEffect } from 'react';
import { X, Upload, Utensils, Image as ImageIcon, Check } from 'lucide-react';
import { getImageUrl } from '../lib/api';

export default function ProductModal({
  isOpen,
  onClose,
  isEditing,
  productForm,
  setProductForm,
  categories,
  onFileChange,
  onSave
}) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (productForm.image_url) {
      setPreviewUrl(getImageUrl(productForm.image_url));
    } else {
      setPreviewUrl('');
    }
  }, [productForm.image_url, isOpen]);

  const handleLocalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onFileChange(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {isEditing ? 'Taom Ma\'lumotlarini Tahrirlash' : 'Yangi Taom Qo\'shish'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Menyuda mijozlarga ko'rinadigan parametrlar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Taom nomi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Taom nomi *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Maxsus Oshi, Chizburger..."
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Kategoriya va Narx */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategoriya *
              </label>
              <select
                value={productForm.category_id}
                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Narxi (so'mda) *
              </label>
              <input
                type="number"
                required
                placeholder="45000"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tavsifi va tarkibi
            </label>
            <textarea
              rows="3"
              placeholder="Masalan: Mol go'shti, pomidor, maxsus sous, qovurilgan kartoshka..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Rasm tanlash & Ko'rish */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Taom Rasmi
            </label>

            {previewUrl && (
              <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                <img
                  src={previewUrl}
                  alt="Taom ko'rinishi"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-slate-500 mb-1 font-medium">Fayl yuklash</span>
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 font-semibold cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
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
                <span className="block text-[11px] text-slate-500 mb-1 font-medium">yoki Internet havolasi</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={productForm.image_url}
                  onChange={(e) => {
                    setProductForm({ ...productForm, image_url: e.target.value });
                    setPreviewUrl(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sotuvda mavjudlik switch */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <span className="block text-xs font-bold text-slate-800">
                  Taom sotuvda mavjud (Faol)
                </span>
                <span className="block text-[11px] text-slate-400">
                  Agar o'chirib qo'ysangiz, taom Mini Appda Stop-listda ko'rinadi
                </span>
              </div>
              <input
                type="checkbox"
                checked={productForm.is_available === 1}
                onChange={(e) => setProductForm({ ...productForm, is_available: e.target.checked ? 1 : 0 })}
                className="w-5 h-5 text-amber-500 rounded-lg accent-amber-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
