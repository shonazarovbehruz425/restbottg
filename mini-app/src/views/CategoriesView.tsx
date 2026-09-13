import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Category } from './HomeView';

interface CategoriesViewProps {
  categories: Category[];
  onSelectCategory: (id: number) => void;
}

export default function CategoriesView({ categories, onSelectCategory }: CategoriesViewProps) {
  return (
    <main className="max-w-md mx-auto px-4.5 space-y-3 pt-3">
      {categories.map((cat) => (
        <div
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className="bg-white dark:bg-[#1A241E] rounded-[24px] p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-soft flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-[#202D24] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EAF7EE] dark:bg-[#162D1E] flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              {cat.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-100">{cat.name}</h4>
              <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">Taomlar ro'yxatini ko'rish</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
        </div>
      ))}
    </main>
  );
}
