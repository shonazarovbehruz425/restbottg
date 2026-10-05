import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * 1. Burger SVG — Ishtaha ochar, haqiqiy pishirilgan go'shtli burger,
 * pomidor, qatlama pishloq, yangi bargli salat va kunjutlar bilan.
 */
export const BurgerIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="burgerBunTop" x1="24" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="50%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      <linearGradient id="burgerBunBottom" x1="24" y1="36" x2="24" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="burgerPatty" x1="24" y1="28" x2="24" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#78350F" />
        <stop offset="50%" stopColor="#5B2C0D" />
        <stop offset="100%" stopColor="#3E1A06" />
      </linearGradient>
      <linearGradient id="burgerCheese" x1="24" y1="24" x2="24" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="burgerLettuce" x1="24" y1="18" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ADE80" />
        <stop offset="100%" stopColor="#15803D" />
      </linearGradient>
      <filter id="shadowSm" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Pastki non (Bottom Bun) */}
    <path 
      d="M7 36C7 36 8 43 24 43C40 43 41 36 41 36H7Z" 
      fill="url(#burgerBunBottom)" 
    />
    <ellipse cx="24" cy="36" rx="17" ry="1.5" fill="#92400E" opacity="0.4" />

    {/* Go'sht kotleti (Juicy Patty) */}
    <rect x="6" y="29.5" width="36" height="6.5" rx="3.25" fill="url(#burgerPatty)" />
    <path d="M11 31.5H16M21 31.5H27M32 31.5H37" stroke="#3E1A06" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

    {/* Erigan Cheddar pishloq (Melted Cheese with Drips) */}
    <path 
      d="M6 26.5H42L40 29.5L34 33.5L29 27L22 34L15 27.5L10 32L6 26.5Z" 
      fill="url(#burgerCheese)" 
      filter="url(#shadowSm)"
    />

    {/* Qizil pomidor qatlami (Tomato Slices) */}
    <path d="M9 24.5C9 23 15 23 23 23C31 23 39 23 39 24.5C39 26 31 26 23 26C15 26 9 26 9 24.5Z" fill="#DC2626" />
    <ellipse cx="17" cy="24.5" rx="5" ry="1" fill="#EF4444" />
    <ellipse cx="31" cy="24.5" rx="5" ry="1" fill="#EF4444" />

    {/* Yangi salat bargi (Crispy Lettuce) */}
    <path 
      d="M6 21C6 19.5 9 19.5 11 20.5C13 21.5 16 20 18 20C20 20 22 21.5 24 21C26 20.5 28 19.5 30 20C32 20.5 35 21.5 37 20C39 19 42 20 42 21.5C42 23 38 23 35 22.5C32 22 29 23.5 24 23C19 22.5 16 23.5 13 22.5C10 22 6 22.5 6 21Z" 
      fill="url(#burgerLettuce)" 
    />

    {/* Yuqori dumaloq non (Brioche Top Bun) */}
    <path 
      d="M6 20C6 11 14 5 24 5C34 5 42 11 42 20C42 20.8 41.2 21.5 40 21.5H8C6.8 21.5 6 20.8 6 20Z" 
      fill="url(#burgerBunTop)" 
      filter="url(#shadowSm)"
    />

    {/* Non ustidagi yorug'lik aksi (Glossy highlight) */}
    <path 
      d="M12 12C15 8 20 6.5 24 6.5C28 6.5 33 8 36 12" 
      stroke="#FEF3C7" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      opacity="0.5" 
    />

    {/* Kunjut donalari (Sesame Seeds) */}
    <ellipse cx="15" cy="11" rx="1.2" ry="0.8" transform="rotate(-15 15 11)" fill="#FFFBEB" />
    <ellipse cx="23" cy="9.5" rx="1.2" ry="0.8" transform="rotate(10 23 9.5)" fill="#FFFBEB" />
    <ellipse cx="32" cy="12" rx="1.2" ry="0.8" transform="rotate(25 32 12)" fill="#FFFBEB" />
    <ellipse cx="19" cy="15" rx="1.2" ry="0.8" transform="rotate(-5 19 15)" fill="#FFFBEB" />
    <ellipse cx="28" cy="14" rx="1.2" ry="0.8" transform="rotate(15 28 14)" fill="#FFFBEB" />
    <ellipse cx="36" cy="16" rx="1" ry="0.7" transform="rotate(-20 36 16)" fill="#FFFBEB" />
  </svg>
);

/**
 * 2. Lavash SVG — Qarsildoq qovurilgan lavash,
 * ichidagi to'yimli go'sht, bodring, sous va kumushrang o'rovi bilan.
 */
export const LavashIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="lavashCrust" x1="16" y1="12" x2="36" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="40%" stopColor="#FDE68A" />
        <stop offset="80%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="lavashFoil" x1="14" y1="26" x2="34" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="50%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="lavashFillingMeat" x1="20" y1="8" x2="30" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
    </defs>

    {/* Asosiy Lavash tanasi (Tortilla Roll Body) */}
    <path 
      d="M19 10L35 24C36.5 25.5 36.5 28 35 29.5L25 39.5C23.5 41 21 41 19.5 39.5L9.5 29.5C8 28 8 25.5 9.5 24L19 10Z" 
      fill="url(#lavashCrust)" 
    />

    {/* Gril qovurish chiziqlari (Grill Toasted Marks) */}
    <path d="M14 20L21 16M19 25L26 21M24 30L31 26" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

    {/* Pastki o'rov folgasi (Silver Foil Wrapper) */}
    <path 
      d="M15 22L33 34C34.5 35 34.5 37 33.5 38.5L25.5 44C24 45 22 45 21 44L11 36C9.5 35 9.5 33 10.5 31.5L15 22Z" 
      fill="url(#lavashFoil)" 
    />
    <path d="M14.5 23L32.5 35" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Ochiq tepa qismidagi to'yimli go'sht va sabzavotlar (Delicious filling view) */}
    <ellipse cx="23" cy="12" rx="7" ry="4" transform="rotate(-35 23 12)" fill="url(#lavashFillingMeat)" />
    {/* Pomidor bo'lagi */}
    <circle cx="21" cy="11" r="2.5" fill="#EF4444" />
    <circle cx="21" cy="11" r="1.5" fill="#DC2626" />
    {/* Bodring va ko'katlar */}
    <ellipse cx="26" cy="13" rx="2" ry="3.5" transform="rotate(20 26 13)" fill="#22C55E" />
    <ellipse cx="26" cy="13" rx="1.2" ry="2.2" transform="rotate(20 26 13)" fill="#86EFAC" />
    {/* Oq mayonez/sous tomchisi */}
    <circle cx="23.5" cy="10" r="1.2" fill="#FFFFFF" opacity="0.9" />
    <path d="M22 13C23 14 24 13.5 25 15" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.85" />
  </svg>
);

/**
 * 3. Hot-dog SVG — Bo'g'iq sersuv sosiska,
 * tilla rang bulochka, xantal (gorchitsa) va ketchupli bezak.
 */
export const HotDogIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="hotDogBun" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="sausageGrad" x1="10" y1="36" x2="38" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B91C1C" />
        <stop offset="50%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
    </defs>

    {/* Orqa bulochka (Back Bun) */}
    <path 
      d="M13 14C9 18 8 26 12 32L32 12C26 8 18 9 13 14Z" 
      fill="url(#hotDogBun)" 
    />

    {/* Qovurilgan sosiska (Grilled Sausage) */}
    <rect 
      x="8" 
      y="20" 
      width="34" 
      height="8" 
      rx="4" 
      transform="rotate(-45 25 24)" 
      fill="url(#sausageGrad)" 
    />

    {/* Oldingi yumshoq bulochka (Front Bun) */}
    <path 
      d="M16 36C22 42 30 41 35 36L37 34C42 29 41 21 35 15L16 36Z" 
      fill="url(#hotDogBun)" 
    />

    {/* Sariq xantal / Gorchitsa to'lqini (Mustard Drizzle) */}
    <path 
      d="M15 33C17 31 18 34 20 32C22 30 23 33 25 31C27 29 28 32 30 30C32 28 33 30 34 27" 
      stroke="#FACC15" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />

    {/* Qizil ketchup naqshi (Ketchup Drizzle) */}
    <path 
      d="M17 35C19 33 19 36 22 34C24 32 24 35 27 33C29 31 30 33 32 31" 
      stroke="#DC2626" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      opacity="0.8" 
    />

    {/* Ko'kat parchalari (Relish flecks) */}
    <circle cx="21" cy="28" r="0.8" fill="#15803D" />
    <circle cx="27" cy="23" r="0.8" fill="#15803D" />
    <circle cx="29" cy="30" r="0.8" fill="#15803D" />
  </svg>
);

/**
 * 4. Pitsa SVG — Tilla chetli qarsildoq xamir,
 * erigan motsarella pishlog'i, pepperoni va rayhon barglari.
 */
export const PizzaIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="pizzaCrust" x1="10" y1="8" x2="38" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="pizzaCheese" x1="24" y1="12" x2="24" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="pepperoni" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
    </defs>

    {/* Non cheti (Puffy Crust Rim) */}
    <path 
      d="M8 12C16 7 32 7 40 12C41.5 13 41.5 15.5 40 17C32 20 16 20 8 17C6.5 15.5 6.5 13 8 12Z" 
      fill="url(#pizzaCrust)" 
    />

    {/* Pomidor sousi asosi */}
    <path d="M10 16L24 43L38 16C30 18 18 18 10 16Z" fill="#DC2626" />

    {/* Erigan pishloq qatlami (Melty Cheese Pull) */}
    <path 
      d="M11 16.5C18 18.5 30 18.5 37 16.5L25 41C24.5 42 23.5 42 23 41L11 16.5Z" 
      fill="url(#pizzaCheese)" 
    />

    {/* Pepperoni doirachalari */}
    <circle cx="24" cy="23" r="4.2" fill="url(#pepperoni)" />
    <circle cx="23.5" cy="22.5" r="3.2" fill="#B91C1C" opacity="0.6" />
    <circle cx="22.5" cy="22" r="0.7" fill="#FEF2F2" opacity="0.6" />

    <circle cx="18" cy="31" r="3.5" fill="url(#pepperoni)" />
    <circle cx="17.5" cy="30.5" r="2.6" fill="#B91C1C" opacity="0.6" />

    <circle cx="29" cy="30" r="3.2" fill="url(#pepperoni)" />
    <circle cx="28.5" cy="29.5" r="2.4" fill="#B91C1C" opacity="0.6" />

    {/* Rayhon barglari va ziravorlar (Basil Leaves) */}
    <path d="M22 17C20 18 19 20 21 21C22 20 23 18 22 17Z" fill="#15803D" />
    <path d="M28 22C29 20 31 20 31 22C30 23 28 23 28 22Z" fill="#16A34A" />
    <circle cx="16" cy="23" r="0.7" fill="#15803D" />
    <circle cx="23" cy="36" r="0.7" fill="#15803D" />
  </svg>
);

/**
 * 5. Kartoshka Fri SVG — Qizil qutichada qarsildoq tilla fri bo'laklari.
 */
export const FriesIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="fryGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="40%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="friesBox" x1="24" y1="20" x2="24" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="50%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
    </defs>

    {/* Orqa tomondagi kartoshka tayoqchalari */}
    <rect x="14" y="6" width="4" height="24" rx="1.5" fill="url(#fryGold)" transform="rotate(-10 14 6)" />
    <rect x="22" y="4" width="4" height="26" rx="1.5" fill="url(#fryGold)" />
    <rect x="30" y="7" width="4" height="23" rx="1.5" fill="url(#fryGold)" transform="rotate(12 30 7)" />
    <rect x="18" y="5" width="3.8" height="25" rx="1.5" fill="url(#fryGold)" transform="rotate(-3 18 5)" />
    <rect x="26" y="5" width="3.8" height="25" rx="1.5" fill="url(#fryGold)" transform="rotate(5 26 5)" />

    {/* Oldingi qatordagi kartoshkalar */}
    <rect x="12" y="10" width="4" height="18" rx="1.5" fill="url(#fryGold)" transform="rotate(-15 12 10)" />
    <rect x="32" y="11" width="4" height="17" rx="1.5" fill="url(#fryGold)" transform="rotate(16 32 11)" />
    <rect x="20" y="9" width="4" height="20" rx="1.5" fill="#FEF08A" />
    <rect x="24.5" y="9" width="4" height="20" rx="1.5" fill="url(#fryGold)" />

    {/* Qizil quti (Classic Red Fry Box) */}
    <path 
      d="M10 24C12 28 16 30 24 30C32 30 36 28 38 24L35 43C34.5 44 33.5 44.5 32 44.5H16C14.5 44.5 13.5 44 13 43L10 24Z" 
      fill="url(#friesBox)" 
    />

    {/* Qutidagi sariq Samira / Fastfood logotipi yoki tilla kamalak */}
    <path 
      d="M18 36C20 33 22 32 24 32C26 32 28 33 30 36" 
      stroke="#FBBF24" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
  </svg>
);

/**
 * 6. Ichimliklar SVG — Salqin muzli ichimlik stakani,
 * naycha (trubochka), muz bo'laklari va shaffoflik.
 */
export const DrinkIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="drinkLiquid" x1="24" y1="18" x2="24" y2="43" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="40%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <linearGradient id="cupGrad" x1="12" y1="16" x2="36" y2="43" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Naycha / Trubochka (Striped Straw) */}
    <path d="M26 14L32 3" stroke="#DC2626" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M26 14L32 3" stroke="#FFFFFF" strokeWidth="2.8" strokeDasharray="3 3" strokeLinecap="round" />

    {/* Qopqoq (Cup Lid) */}
    <path d="M12 16C12 14.5 15 13.5 24 13.5C33 13.5 36 14.5 36 16H12Z" fill="#F8FAFC" />
    <ellipse cx="24" cy="16" rx="13" ry="2" fill="#E2E8F0" />

    {/* Stakan tanasi (Cup Body) */}
    <path d="M13 17L16.5 42C16.8 43 17.5 44 19 44H29C30.5 44 31.2 43 31.5 42L35 17H13Z" fill="url(#cupGrad)" stroke="#CBD5E1" strokeWidth="1" />

    {/* Ichidagi mazali ichimlik (Liquid level) */}
    <path d="M14 22L16.8 42C17 42.8 17.5 43.5 19 43.5H29C30.5 43.5 31 42.8 31.2 42L34 22C30 23.5 18 23.5 14 22Z" fill="url(#drinkLiquid)" />

    {/* Muz bo'lagi (Ice cube in liquid) */}
    <rect x="18" y="24" width="5.5" height="5.5" rx="1.5" transform="rotate(12 18 24)" fill="#FFFFFF" fillOpacity="0.6" stroke="#FFFFFF" strokeWidth="0.8" />
    <rect x="25" y="27" width="5" height="5" rx="1.5" transform="rotate(-15 25 27)" fill="#FFFFFF" fillOpacity="0.5" stroke="#FFFFFF" strokeWidth="0.8" />

    {/* Stakan sirtidagi jilo aksi (Shine Reflection) */}
    <path d="M17 21L19 41" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    {/* Sovuq tomchilar (Droplets) */}
    <circle cx="31" cy="30" r="0.8" fill="#FFFFFF" opacity="0.7" />
    <circle cx="30" cy="35" r="0.6" fill="#FFFFFF" opacity="0.7" />
  </svg>
);

/**
 * 7. Barchasi / Oshpaz Tovoq SVG (All Categories — Master Cloche / Platter)
 */
export const AllFoodIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="clocheGrad" x1="24" y1="12" x2="24" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>
      <linearGradient id="plateGrad" x1="24" y1="36" x2="24" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
    {/* Tovoq asosi (Silver Platter Base) */}
    <ellipse cx="24" cy="38" rx="18" ry="3" fill="url(#plateGrad)" />
    <ellipse cx="24" cy="37.5" rx="16" ry="2" fill="#F8FAFC" />

    {/* Oshpaz qopqog'i (Emerald Cloche Dome) */}
    <path d="M10 35C10 21 16 14 24 14C32 14 38 21 38 35H10Z" fill="url(#clocheGrad)" />
    {/* Tepadagi tutqich dumaloq (Knob) */}
    <circle cx="24" cy="11.5" r="3" fill="#F59E0B" />
    <circle cx="24" cy="10.5" r="1.5" fill="#FEF3C7" />

    {/* Yaltirash jilosi */}
    <path d="M15 28C16 20 20 16 24 16" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    
    {/* Xushbo'y bug' chiziqlari (Aroma Steam) */}
    <path d="M20 7C20 5 21 4 21 3" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M24 6C24 4 25 3 25 2" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    <path d="M28 7C28 5 29 4 29 3" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

/**
 * 8. Umumiy idish / Zaxira (Default Dish)
 */
export const DefaultDishIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse cx="24" cy="24" rx="18" ry="18" fill="#10B981" fillOpacity="0.15" />
    <ellipse cx="24" cy="24" rx="14" ry="14" stroke="#059669" strokeWidth="2" />
    <circle cx="24" cy="24" r="8" fill="#34D399" fillOpacity="0.3" />
    <path d="M18 19V29M18 22H21" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M30 19V29M27 22H30" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * 9. Desert / Shirinlik SVG — Ishtaha ochar tort bo'lagi va shokolad
 */
export const CakeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="cakeChoc" x1="24" y1="20" x2="24" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#854D0E" />
        <stop offset="50%" stopColor="#713F12" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
      <linearGradient id="cherryGrad" x1="24" y1="6" x2="24" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
    </defs>
    <path d="M6 38L24 16L42 22V36L24 42L6 38Z" fill="url(#cakeChoc)" />
    <path d="M6 34L24 18L42 24V28L24 22L6 28V34Z" fill="#FBBF24" fillOpacity="0.8" />
    <path d="M6 28L24 14L42 20L38 18L24 12L10 16L6 28Z" fill="#FFFBEB" />
    <path d="M6 28C8 30 11 29 13 28C15 27 18 31 20 29C22 27 25 30 27 29C29 28 32 31 34 29C36 27 39 30 42 28V20L24 14L6 20V28Z" fill="#FDF4FF" />
    <circle cx="24" cy="11" r="4.5" fill="url(#cherryGrad)" />
    <path d="M25 9C27 5 31 4 33 5" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * 10. Salatlar SVG — Yangi yashil barglar, pomidor, bodring va zaytun donalari
 */
export const SaladIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="saladBowl" x1="24" y1="22" x2="24" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <linearGradient id="saladLeaf1" x1="14" y1="12" x2="26" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ADE80" />
        <stop offset="100%" stopColor="#15803D" />
      </linearGradient>
      <linearGradient id="saladLeaf2" x1="22" y1="10" x2="36" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="100%" stopColor="#16A34A" />
      </linearGradient>
      <linearGradient id="saladTomato" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
    {/* Idish / Kosa (Bowl) */}
    <ellipse cx="24" cy="42" rx="14" ry="2" fill="#94A3B8" opacity="0.3" />
    <path d="M8 22C8 33 15 42 24 42C33 42 40 33 40 22H8Z" fill="url(#saladBowl)" />
    <ellipse cx="24" cy="22" rx="16" ry="3" fill="#F1F5F9" />

    {/* Yangi salat barglari */}
    <path d="M12 21C10 14 16 8 22 13C20 18 16 22 12 21Z" fill="url(#saladLeaf1)" />
    <path d="M26 12C32 8 38 13 36 21C31 22 28 17 26 12Z" fill="url(#saladLeaf2)" />
    <path d="M18 16C22 11 28 11 30 17C26 21 21 21 18 16Z" fill="#22C55E" />

    {/* Qizil pomidor bo'laklari */}
    <circle cx="17" cy="20" r="4" fill="url(#saladTomato)" />
    <circle cx="17" cy="20" r="2.5" fill="#DC2626" />
    <circle cx="16" cy="19" r="0.8" fill="#FEE2E2" />

    <circle cx="31" cy="19" r="3.5" fill="url(#saladTomato)" />
    <circle cx="31" cy="19" r="2" fill="#DC2626" />

    {/* Qarsildoq bodring doirachalari */}
    <circle cx="24" cy="18" r="3.2" fill="#86EFAC" stroke="#16A34A" strokeWidth="1.2" />
    <circle cx="24" cy="18" r="1.2" fill="#BBF7D0" />

    {/* Qora zaytun donalari */}
    <ellipse cx="20" cy="23" rx="2" ry="1.4" transform="rotate(-20 20 23)" fill="#1E293B" />
    <ellipse cx="28" cy="22" rx="1.8" ry="1.3" transform="rotate(30 28 22)" fill="#1E293B" />
  </svg>
);

/**
 * 11. Tovuq & Strips SVG — Qarsildoq qovurilgan tilla tovuq oyog'i va stripsi
 */
export const ChickenIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="chickCrisp" x1="18" y1="10" x2="38" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="80%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="chickBone" x1="10" y1="36" x2="16" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
    </defs>
    {/* Soya */}
    <ellipse cx="24" cy="42" rx="14" ry="2.5" fill="#92400E" opacity="0.25" />

    {/* Suyak dumi (Bone joint) */}
    <path d="M12 36L18 30" stroke="url(#chickBone)" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="11" cy="38" r="2.8" fill="url(#chickBone)" />
    <circle cx="15" cy="40" r="2.8" fill="url(#chickBone)" />

    {/* Asosiy qarsildoq tovuq oyog'i (Juicy Crispy Drumstick) */}
    <path 
      d="M17 29C15 25 15 20 18 16C22 11 29 10 34 13C39 16 41 23 38 28C35 33 28 35 23 34C20 33 18 31 17 29Z" 
      fill="url(#chickCrisp)" 
    />

    {/* Qarsildoq pufaklar va tuzilma (Crunchy flakes) */}
    <circle cx="28" cy="18" r="1.5" fill="#FEF08A" opacity="0.8" />
    <circle cx="33" cy="22" r="1.8" fill="#FEF08A" opacity="0.8" />
    <circle cx="24" cy="24" r="1.2" fill="#FEF08A" opacity="0.8" />
    <circle cx="29" cy="28" r="1.5" fill="#92400E" opacity="0.4" />
    <circle cx="21" cy="20" r="1.3" fill="#92400E" opacity="0.4" />

    {/* Yonidagi Strips bo'lagi */}
    <path 
      d="M7 25C8 21 11 19 13 20C15 21 15 25 13 29C11 31 8 30 7 25Z" 
      fill="url(#chickCrisp)" 
    />
    <circle cx="11" cy="24" r="0.9" fill="#FEF08A" opacity="0.8" />

    {/* Issiq bug' (Aroma steam) */}
    <path d="M30 7C30 5 31 4 31 3" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    <path d="M35 8C35 6 36 5 36 4" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
  </svg>
);

/**
 * 12. Sendvichlar SVG — Uchburchak qatlama klab-sendvich, pishloq, sabzavotlar bilan
 */
export const SandwichIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="breadCrust" x1="12" y1="14" x2="38" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="50%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="sandwCheese" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Pastki non qatlami */}
    <path d="M6 34L36 39L42 16L6 34Z" fill="url(#breadCrust)" />
    {/* Gril qovurish chizig'i */}
    <path d="M12 33L34 22M18 36L38 26" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

    {/* Ichki qatlamlar: Go'sht + Salat bargi + Pishloq */}
    {/* Go'sht */}
    <path d="M8 32L38 37L39 34L9 29L8 32Z" fill="#78350F" />
    {/* Pomidor */}
    <path d="M11 29L35 33L36 31L12 27L11 29Z" fill="#EF4444" />
    {/* Pishloq bo'lagi (Osilib turgan burchak) */}
    <path d="M14 28L33 31L26 36L14 28Z" fill="url(#sandwCheese)" />
    {/* Yashil salat */}
    <path d="M8 28C11 29 14 27 17 29C20 27 23 29 26 27C29 29 32 27 35 29L35 26L8 25V28Z" fill="#22C55E" />

    {/* Yuqori non qatlami */}
    <path d="M8 25L38 29L42 12L8 25Z" fill="url(#breadCrust)" />
    {/* Ustki qarsildoq jilo */}
    <path d="M14 23L36 15" stroke="#FFFBEB" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

    {/* Sendvich nayzasi / Shpajka */}
    <path d="M26 6L26 23" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="26" cy="6" r="2.5" fill="#EF4444" />
  </svg>
);

/**
 * 13. Kombo & Setlar SVG — Fast food to'plami: mini burger, fri va stakandagi ichimlik
 */
export const ComboIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="comboBurger" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="comboCup" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    {/* Orqa stakan (Drink Cup) */}
    <path d="M28 14L30 38H38L40 14H28Z" fill="url(#comboCup)" />
    <rect x="27" y="12" width="14" height="3" rx="1.5" fill="#E2E8F0" />
    {/* Naycha */}
    <path d="M34 12L37 4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

    {/* Kartoshka fri qutisi (Orqa tomonda) */}
    <path d="M19 18L21 38H29L31 18H19Z" fill="#DC2626" />
    <rect x="21" y="9" width="2" height="12" rx="1" fill="#FBBF24" />
    <rect x="24" y="7" width="2.2" height="14" rx="1" fill="#FDE047" />
    <rect x="27" y="10" width="2" height="11" rx="1" fill="#FBBF24" />

    {/* Oldindagi Burger */}
    <ellipse cx="16" cy="38" rx="10" ry="1.5" fill="#78350F" opacity="0.3" />
    {/* Pastki non */}
    <path d="M7 36C7 38 10 40 16 40C22 40 25 38 25 36H7Z" fill="url(#comboBurger)" />
    {/* Kotlet */}
    <rect x="6" y="33" width="20" height="3" rx="1.5" fill="#451A03" />
    {/* Pishloq */}
    <path d="M6 32H26L24 35L19 33L16 35L6 32Z" fill="#FACC15" />
    {/* Salat */}
    <path d="M6 31C8 30 11 31 13 30C16 31 19 30 22 31C24 30 26 31 26 31" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
    {/* Tepasidagi bulochka */}
    <path d="M6 29C6 24 10 21 16 21C22 21 26 24 26 29H6Z" fill="url(#comboBurger)" />
    {/* Kunjut */}
    <circle cx="12" cy="24" r="0.6" fill="#FFFBEB" />
    <circle cx="16" cy="23" r="0.6" fill="#FFFBEB" />
    <circle cx="20" cy="25" r="0.6" fill="#FFFBEB" />
  </svg>
);

/**
 * 14. Souslar SVG — Ishtaha ochar sous idishi va qizil sous tomchisi
 */
export const SauceIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="sauceBowlGrad" x1="24" y1="20" x2="24" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <linearGradient id="ketchupGrad" x1="24" y1="16" x2="24" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
    </defs>
    {/* Soya */}
    <ellipse cx="24" cy="40" rx="14" ry="2.5" fill="#64748B" opacity="0.3" />

    {/* Idish (Ramekin) */}
    <path d="M10 22L14 38C14 39.5 18 40.5 24 40.5C30 40.5 34 39.5 34 38L38 22H10Z" fill="url(#sauceBowlGrad)" />
    <ellipse cx="24" cy="22" rx="14" ry="3.5" fill="#E2E8F0" />

    {/* Mazali qizil sous qatlami */}
    <ellipse cx="24" cy="22.5" rx="12.5" ry="2.8" fill="url(#ketchupGrad)" />

    {/* Oq mayonez / pishloqli sous spirali */}
    <path 
      d="M17 22C19 21 21 24 24 22C27 20 29 23 31 22" 
      stroke="#FEF08A" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <circle cx="21" cy="22.5" r="0.8" fill="#FFFFFF" opacity="0.9" />

    {/* Yuqoridan tomayotgan ishtahali tomchi */}
    <path 
      d="M24 6C24 6 20 12 20 14C20 16.2 21.8 18 24 18C26.2 18 28 16.2 28 14C28 12 24 6 24 6Z" 
      fill="url(#ketchupGrad)" 
    />
    <circle cx="22.5" cy="14" r="0.9" fill="#FEE2E2" opacity="0.8" />
  </svg>
);

/**
 * 15. Qahva & Choy SVG — Issiq xushbo'y qahva finjoni, sutli ko'pik va bug'
 */
export const CoffeeIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="cupCeramic" x1="20" y1="16" x2="20" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <linearGradient id="coffeeCrema" x1="20" y1="16" x2="20" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="50%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
    </defs>
    {/* Likopcha (Saucer) */}
    <ellipse cx="22" cy="40" rx="17" ry="2.5" fill="#CBD5E1" opacity="0.5" />
    <path d="M7 39C7 41 13 42.5 22 42.5C31 42.5 37 41 37 39H7Z" fill="#E2E8F0" />
    <ellipse cx="22" cy="39" rx="15" ry="2" fill="#F8FAFC" />

    {/* Finjon qulog'i (Handle) */}
    <path 
      d="M30 22C36 22 38 31 30 33" 
      stroke="#CBD5E1" 
      strokeWidth="3.2" 
      strokeLinecap="round" 
    />

    {/* Finjon tanasi (Mug Body) */}
    <path 
      d="M10 20C10 32 15 38 22 38C29 38 34 32 34 20H10Z" 
      fill="url(#cupCeramic)" 
    />
    <ellipse cx="22" cy="20" rx="12" ry="2.8" fill="#E2E8F0" />

    {/* Mazali qahva yuzasi (Crema) */}
    <ellipse cx="22" cy="20.5" rx="10.5" ry="2.2" fill="url(#coffeeCrema)" />

    {/* Latte Art yurakcha */}
    <path 
      d="M22 21.5C21 20 19 20 19 21C19 22 22 23 22 23C22 23 25 22 25 21C25 20 23 20 22 21.5Z" 
      fill="#FEF3C7" 
    />

    {/* Xushbo'y issiq bug' (Aroma steam) */}
    <path d="M17 14C16 11 18 9 17 6" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
    <path d="M22 13C21 10 23 8 22 5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
    <path d="M27 14C26 11 28 9 27 6" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
  </svg>
);

/**
 * Kategoriya nomi yoki belgisi bo'yicha mos keluvchi professional SVG ikonasini tanlab beradi
 */
export function getCategoryIcon(nameOrKey?: string, className: string = "w-6 h-6"): React.ReactNode {
  if (!nameOrKey) return <AllFoodIcon className={className} />;

  const lower = nameOrKey.toLowerCase();

  if (lower.includes('barchasi') || lower === 'all' || lower.includes('menu')) {
    return <AllFoodIcon className={className} />;
  }

  if (lower.includes('desert') || lower.includes('shirinlik') || lower.includes('tort') || lower.includes('cake') || lower.includes('piroj') || lower.includes('muzqaymoq')) {
    return <CakeIcon className={className} />;
  }

  if (lower.includes('salat') || lower.includes('salad') || lower.includes('tsezar') || lower.includes('olivye')) {
    return <SaladIcon className={className} />;
  }

  if (lower.includes('tovuq') || lower.includes('strips') || lower.includes('chiken') || lower.includes('chicken') || lower.includes('qanot') || lower.includes('naggets') || lower.includes('kfc')) {
    return <ChickenIcon className={className} />;
  }

  if (lower.includes('sendvich') || lower.includes('sandwich') || lower.includes('toster') || lower.includes('toast') || lower.includes('panini')) {
    return <SandwichIcon className={className} />;
  }

  if (lower.includes('kombo') || lower.includes('combo') || lower.includes('set') || lower.includes('to\'plam')) {
    return <ComboIcon className={className} />;
  }

  if (lower.includes('sous') || lower.includes('sauce') || lower.includes('ketchup') || lower.includes('mayonez')) {
    return <SauceIcon className={className} />;
  }

  if (lower.includes('qahva') || lower.includes('kofe') || lower.includes('coffee') || lower.includes('choy') || lower.includes('tea') || lower.includes('latte') || lower.includes('kapuchino')) {
    return <CoffeeIcon className={className} />;
  }

  if (lower.includes('burger') || lower.includes('chizburger') || lower.includes('gamburger')) {
    return <BurgerIcon className={className} />;
  }

  if (lower.includes('lavash') || lower.includes('doner') || lower.includes('donar') || lower.includes('shaurma') || lower.includes('wrap') || lower.includes('burrito')) {
    return <LavashIcon className={className} />;
  }

  if (lower.includes('hot') || lower.includes('dog') || lower.includes('sosiska')) {
    return <HotDogIcon className={className} />;
  }

  if (lower.includes('pitsa') || lower.includes('pizza')) {
    return <PizzaIcon className={className} />;
  }

  if (lower.includes('fri') || lower.includes('gazak') || lower.includes('kartoshka') || lower.includes('snack')) {
    return <FriesIcon className={className} />;
  }

  if (lower.includes('ichimlik') || lower.includes('cola') || lower.includes('sharbat') || lower.includes('suv') || lower.includes('drink')) {
    return <DrinkIcon className={className} />;
  }

  return <DefaultDishIcon className={className} />;
}

/**
 * Kategoriya nomidagi oddiy stiker va emojilarni olib tashlab,
 * sof, chiroyli matnni qaytaradi (masalan: "🍔 Burgerlar" -> "Burgerlar")
 */
export function cleanCategoryName(name: string): string {
  if (!name) return '';
  return name.replace(/^[\p{Extended_Pictographic}\p{Emoji}\uFE0F\u200D\s]+/u, '').trim();
}
