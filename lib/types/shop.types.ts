// ═══════════════════════════════════════
// تایپ‌های سیستم فروشگاه مجازی
// ═══════════════════════════════════════

// نوع آیتم فروشگاه
export type ShopItemType = 'avatar' | 'background' | 'theme' | 'badge' | 'power_up';

// نادری آیتم
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

// نوع تراکنش سکه
export type CoinTransactionType = 'earn' | 'spend' | 'bonus' | 'refund';

// آیتم فروشگاه
export interface ShopItem {
  id: string;
  name: string;
  name_en: string;
  description: string | null;
  type: ShopItemType;
  price_coins: number;
  image_url: string;
  preview_url: string | null;
  required_level: number;
  is_limited: boolean;
  limited_quantity: number | null;
  available_until: string | null;
  is_active: boolean;
  is_featured: boolean;
  rarity: ItemRarity;
  theme_config: ThemeConfig | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // محاسبه‌شده
  sold_count?: number;
  remaining_quantity?: number;
  is_purchased?: boolean;
  can_purchase?: boolean;
  purchase_blocked_reason?: string;
}

// تنظیمات تم
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

// خرید کاربر
export interface UserPurchase {
  id: string;
  user_id: string;
  item_id: string;
  price_paid: number;
  is_equipped: boolean;
  equipped_at: string | null;
  expires_at: string | null;
  is_used: boolean;
  purchased_at: string;
  // با جوین
  item?: ShopItem;
}

// تراکنش سکه
export interface CoinTransaction {
  id: string;
  user_id: string;
  type: CoinTransactionType;
  amount: number;
  source: string | null;
  reference_id: string | null;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

// اطلاعات کاربر (talent_garden)
export interface UserTalentInfo {
  user_id: string;
  coins: number;
  xp: number;
  level: number;
  streak_days: number;
}

// آیتم‌های فعال کاربر
export interface EquippedItems {
  avatar?: ShopItem;
  background?: ShopItem;
  theme?: ShopItem;
  badge?: ShopItem;
}

// نتیجه خرید
export interface PurchaseResult {
  success: boolean;
  message: string;
  new_balance: number;
  purchase_id?: string;
}

// نتیجه تجهیز
export interface EquipResult {
  success: boolean;
  message: string;
}

// فیلترهای فروشگاه
export interface ShopFilters {
  type?: ShopItemType | 'all';
  rarity?: ItemRarity | 'all';
  sortBy?: 'price_asc' | 'price_desc' | 'rarity' | 'newest';
  search?: string;
  onlyAffordable?: boolean;
  onlyAvailable?: boolean;
}

// تنظیمات نمایش آیتم
export const ITEM_TYPE_CONFIG: Record<ShopItemType, {
  label: string;
  icon: string;
  color: string;
}> = {
  avatar: { label: 'آواتار', icon: '👤', color: 'blue' },
  background: { label: 'پس‌زمینه', icon: '🖼️', color: 'green' },
  theme: { label: 'تم', icon: '🎨', color: 'purple' },
  badge: { label: 'نشان', icon: '🏅', color: 'yellow' },
  power_up: { label: 'قدرت', icon: '⚡', color: 'orange' },
};

// تنظیمات نادری
export const RARITY_CONFIG: Record<ItemRarity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
}> = {
  common: {
    label: 'معمولی',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-600 dark:text-gray-400',
    glowColor: 'shadow-gray-200',
  },
  rare: {
    label: 'نادر',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-400 dark:border-blue-600',
    textColor: 'text-blue-600 dark:text-blue-400',
    glowColor: 'shadow-blue-200',
  },
  epic: {
    label: 'حماسی',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-400 dark:border-purple-600',
    textColor: 'text-purple-600 dark:text-purple-400',
    glowColor: 'shadow-purple-200',
  },
  legendary: {
    label: 'افسانه‌ای',
    color: 'amber',
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    borderColor: 'border-amber-400 dark:border-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    glowColor: 'shadow-amber-200',
  },
};

// آیکون‌های نادری
export const RARITY_ICONS: Record<ItemRarity, string> = {
  common: '⚪',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
};

// فرمت کردن قیمت
export function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

// فرمت کردن زمان باقی‌مانده
export function formatTimeRemaining(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) return 'منقضی شده';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} روز`;
  if (hours > 0) return `${hours} ساعت`;
  
  return 'کمتر از یک ساعت';
}

// چک کردن انقضا
export function isExpired(dateString: string | null): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

// داده نمونه برای توسعه
export const SAMPLE_SHOP_ITEMS: Partial<ShopItem>[] = [
  {
    id: '1',
    name: 'ستاره درخشان',
    name_en: 'Shining Star',
    description: 'آواتار ستاره طلایی',
    type: 'avatar',
    price_coins: 100,
    image_url: '/shop/avatars/star.png',
    rarity: 'common',
    required_level: 1,
  },
  {
    id: '2',
    name: 'شیر شجاع',
    name_en: 'Brave Lion',
    description: 'آواتار شیر قدرتمند',
    type: 'avatar',
    price_coins: 500,
    image_url: '/shop/avatars/lion.png',
    rarity: 'rare',
    required_level: 5,
    is_featured: true,
  },
];



















