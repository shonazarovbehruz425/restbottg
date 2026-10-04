import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Category } from './HomeView';
import { getCategoryIcon, cleanCategoryName } from '../components/FoodCategoryIcons';

interface CategoriesViewProps {
  categories: Category[];
  onSelectCategory: (id: number) => void;
}

export default function CategoriesView({ categories, onSelectCategory }: CategoriesViewProps) {
  return (
    <main className="max-w-md mx-auto px-4.5 space-y-3 pt-3 pb-6">
      {categories.map((cat) => {
        const cleanName = cleanCategoryName(cat.name);
        return (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="group bg-white dark:bg-[#1A241E] rounded-[24px] p-4 border border-neutral-200/70 dark:border-neutral-800 shadow-soft flex items-center justify-between hover:border-emerald-600/40 dark:hover:border-emerald-500/40 hover:bg-neutral-50/80 dark:hover:bg-[#202D24] active:scale-[0.99] cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-[#172B1E] dark:to-[#122016] border border-emerald-500/15 dark:border-emerald-500/25 flex items-center justify-center p-2 shadow-xs group-hover:scale-105 transition-transform duration-300">
                {getCategoryIcon(cat.name, "w-8 h-8 drop-shadow-sm group-hover:scale-110 transition-transform duration-300")}
              </div>
              <div>
                <h4 className="font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {cleanName}
                </h4>
                <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                  Taomlar ro'yxatini ko'rish
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#233127] flex items-center justify-center text-neutral-400 dark:text-neutral-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        );
      })}
    </main>
  );
}
