import type { Tables } from "@/integrations/supabase/types";
import type { TKey } from "./i18n";

export type Profile = Tables<"profiles"> & {
  first_name?: string;
  last_name?: string;
  is_suspended?: boolean;
};

export type Listing = Tables<"listings"> & {
  price_dzd?: number;
};

export type PaymentMethodId = "espece" | "edahabia" | "lefto_cash";

export type FoodRequest = Tables<"food_requests"> & {
  price_dzd?: number;
  commission_dzd?: number;
  hotel_net_dzd?: number;
  qr_token?: string;
  qr_expires_at?: string;
  qr_used_at?: string;
  payment_method?: string;
  caisse_status?: string;
};

export interface PaymentMethodMeta {
  id: PaymentMethodId;
  nameAr: string;
  nameFr: string;
  shortAr: string;
  shortFr: string;
  descAr: string;
  descFr: string;
  available: boolean;
  badgeAr?: string;
  badgeFr?: string;
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  {
    id: "espece",
    nameAr: "Espèce — نقداً عند الاستلام",
    nameFr: "Espèce — Paiement au retrait",
    shortAr: "نقداً (Espèce)",
    shortFr: "Espèce",
    descAr: "الدفع كاش مباشرة لدى الفندق عند معاينة واستلام الوجبات",
    descFr: "Paiement en espèces directement auprès de l'hôtel lors du retrait",
    available: true,
  },
  {
    id: "edahabia",
    nameAr: "بطاقة الذهبية / CIB (Edahabia)",
    nameFr: "Carte Edahabia / CIB",
    shortAr: "بطاقة الذهبية",
    shortFr: "Edahabia",
    descAr: "الدفع الإلكتروني المباشر عبر البطاقة الذهبية أو CIB",
    descFr: "Paiement en ligne sécurisé par Carte Edahabia ou CIB",
    available: false,
    badgeAr: "قريباً",
    badgeFr: "Bientôt disponible",
  },
  {
    id: "lefto_cash",
    nameAr: "رصيد لفتو (Lefto Cash)",
    nameFr: "Lefto Cash",
    shortAr: "رصيد لفتو",
    shortFr: "Lefto Cash",
    descAr: "الدفع الفوري اقتطاعاً من محفظتك الرقمية في لفتو",
    descFr: "Paiement instantané depuis votre solde Lefto Cash",
    available: false,
    badgeAr: "قريباً",
    badgeFr: "Bientôt disponible",
  },
];

export function getPaymentMethodMeta(methodId?: string | null): PaymentMethodMeta {
  const found = PAYMENT_METHODS.find((m) => m.id === methodId);
  return found ?? PAYMENT_METHODS[0]; // default to espece
}

export type NotificationRow = Tables<"notifications">;

export type ActivityLog = {
  id: string;
  user_id?: string;
  user_role?: string;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
};

export type AppRole = "hotel" | "charity" | "admin";
export type ListingStatus = "draft" | "available" | "reserved" | "collected" | "expired";
export type RequestStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

export type ListingWithHotel = Listing & { profiles: Profile | null };
export type RequestWithRelations = FoodRequest & {
  listings: Listing | null;
  charity: Profile | null;
  hotel: Profile | null;
};

export const LEFTO_COMMISSION_RATE = 0.15; // 15% Lefto commission

/** Calculates 15% Lefto Commission and 85% Hotel Net Income. */
export function calculateCommission(price: number): {
  price: number;
  commission: number;
  hotelNet: number;
} {
  const p = Math.max(0, Number(price) || 0);
  const commission = Math.round(p * LEFTO_COMMISSION_RATE);
  const hotelNet = p - commission;
  return { price: p, commission, hotelNet };
}

/** Resolves request price safely, prioritizing positive price_dzd or falling back to listing price_dzd. */
export function getRequestPrice(r: {
  price_dzd?: number | null;
  listings?: { price_dzd?: number | null } | null;
}): number {
  if (r.price_dzd != null && Number(r.price_dzd) > 0) {
    return Number(r.price_dzd);
  }
  if (r.listings?.price_dzd != null && Number(r.listings.price_dzd) > 0) {
    return Number(r.listings.price_dzd);
  }
  return 0;
}

/** Check if hotel offer editing is locked (Locked if any request exists or completed). */
export function isListingLockedForHotel(requestsCount: number, status?: ListingStatus): boolean {
  return requestsCount > 0 || status === "reserved" || status === "collected";
}

/** Check if charity request cancellation is allowed (Allowed ONLY before hotel approval, status === pending). */
export function isRequestCancellableByCharity(status: RequestStatus): boolean {
  return status === "pending";
}

export const LISTING_STATUS_KEY: Record<ListingStatus, TKey> = {
  available: "statusAvailable",
  reserved: "statusReserved",
  collected: "statusCollected",
  expired: "statusExpired",
};

export const REQUEST_STATUS_KEY: Record<RequestStatus, TKey> = {
  pending: "statusPending",
  accepted: "statusAccepted",
  rejected: "statusRejected",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

export const WILAYAS = [
  "01 - أدرار (Adrar)",
  "02 - الشلف (Chlef)",
  "03 - الأغواط (Laghouat)",
  "04 - أم البواقي (Oum El Bouaghi)",
  "05 - باتنة (Batna)",
  "06 - بجاية (Béjaïa)",
  "07 - بسكرة (Biskra)",
  "08 - بشار (Béchar)",
  "09 - البليدة (Blida)",
  "10 - البويرة (Bouira)",
  "11 - تمنراست (Tamanrasset)",
  "12 - تبسة (Tébessa)",
  "13 - تلمسان (Tlemcen)",
  "14 - تيارت (Tiaret)",
  "15 - تيزي وزو (Tizi Ouzou)",
  "16 - الجزائر (Alger)",
  "17 - الجلفة (Djelfa)",
  "18 - جيجل (Jijel)",
  "19 - سطيف (Sétif)",
  "20 - سعيدة (Saïda)",
  "21 - سكيكدة (Skikda)",
  "22 - سيدي بلعباس (Sidi Bel Abbès)",
  "23 - عنابة (Annaba)",
  "24 - قالمة (Guelma)",
  "25 - قسنطينة (Constantine)",
  "26 - المدية (Médéa)",
  "27 - مستغانم (Mostaganem)",
  "28 - المسيلة (M'Sila)",
  "29 - معسكر (Mascara)",
  "30 - ورقلة (Ouargla)",
  "31 - وهران (Oran)",
  "32 - البيض (El Bayadh)",
  "33 - إليزي (Illizi)",
  "34 - برج بوعريريج (Bordj Bou Arreridj)",
  "35 - بومرداس (Boumerdès)",
  "36 - الطارف (El Tarf)",
  "37 - تندوف (Tindouf)",
  "38 - تيسمسيلت (Tissemsilt)",
  "39 - الوادي (El Oued)",
  "40 - خنشلة (Khenchela)",
  "41 - سوق أهراس (Souk Ahras)",
  "42 - تيبازة (Tipaza)",
  "43 - ميلة (Mila)",
  "44 - عين الدفلى (Aïn Defla)",
  "45 - النعامة (Naâma)",
  "46 - عين تموشنت (Aïn Témouchent)",
  "47 - غرداية (Ghardaïa)",
  "48 - غليزان (Relizane)",
  "49 - تيميمون (Timimoun)",
  "50 - برج باجي مختار (Bordj Badji Mokhtar)",
  "51 - أولاد جلال (Ouled Djellal)",
  "52 - بني عباس (Béni Abbès)",
  "53 - عين صالح (In Salah)",
  "54 - عين قزام (In Guezzam)",
  "55 - تقرت (Touggourt)",
  "56 - جانت (Djanet)",
  "57 - المغير (El M'Ghair)",
  "58 - المنيعة (El Meniaa)",
  "59 - أفلو (Aflo)",
  "60 - بريكة (Barika)",
  "61 - القنطرة (El Kantara)",
  "62 - بئر العاتر (Bir El Ater)",
  "63 - العريشة (El Aricha)",
  "64 - قصر الشلالة (Ksar Chellala)",
  "65 - عين وسارة (Ain Oussera)",
  "66 - مسعد (Messaad)",
  "67 - قصر البخاري (Ksar El Boukhari)",
  "68 - بوسعادة (Bou Saada)",
  "69 - الأبيض سيدي الشيخ (El Abiodh Sidi Cheikh)",
];

/** Haversine distance in km. */
export function distanceKm(
  a: { lat?: number | null; lng?: number | null },
  b: { lat?: number | null; lng?: number | null },
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

export const WILAYA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "01": { lat: 27.8742, lng: -0.2939 },
  "02": { lat: 36.1653, lng: 1.3347 },
  "03": { lat: 33.8, lng: 2.8651 },
  "04": { lat: 35.8754, lng: 7.1135 },
  "05": { lat: 35.5559, lng: 6.1741 },
  "06": { lat: 36.7511, lng: 5.0567 },
  "07": { lat: 34.8503, lng: 5.728 },
  "08": { lat: 31.6167, lng: -2.2167 },
  "09": { lat: 36.47, lng: 2.83 },
  "10": { lat: 36.3749, lng: 3.902 },
  "11": { lat: 22.785, lng: 5.5228 },
  "12": { lat: 35.4042, lng: 8.1242 },
  "13": { lat: 34.8783, lng: -1.315 },
  "14": { lat: 35.371, lng: 1.3169 },
  "15": { lat: 36.7118, lng: 4.0459 },
  "16": { lat: 36.7538, lng: 3.0588 },
  "17": { lat: 34.6728, lng: 3.263 },
  "18": { lat: 36.8205, lng: 5.7667 },
  "19": { lat: 36.1905, lng: 5.4137 },
  "20": { lat: 34.8303, lng: 0.1517 },
  "21": { lat: 36.8792, lng: 6.9069 },
  "22": { lat: 35.1899, lng: -0.6308 },
  "23": { lat: 36.9, lng: 7.7667 },
  "24": { lat: 36.4621, lng: 7.4261 },
  "25": { lat: 36.365, lng: 6.6147 },
  "26": { lat: 36.2675, lng: 2.75 },
  "27": { lat: 35.9311, lng: 0.0892 },
  "28": { lat: 35.7058, lng: 4.5419 },
  "29": { lat: 35.3966, lng: 0.1403 },
  "30": { lat: 31.9493, lng: 5.325 },
  "31": { lat: 35.6971, lng: -0.6308 },
  "32": { lat: 33.6831, lng: 1.0192 },
  "33": { lat: 26.4833, lng: 8.4667 },
  "34": { lat: 36.0732, lng: 4.7621 },
  "35": { lat: 36.7664, lng: 3.4772 },
  "36": { lat: 36.7672, lng: 8.3138 },
  "37": { lat: 27.6711, lng: -8.1478 },
  "38": { lat: 35.6072, lng: 1.8106 },
  "39": { lat: 33.3683, lng: 6.8674 },
  "40": { lat: 35.4358, lng: 7.1433 },
  "41": { lat: 36.2864, lng: 7.9511 },
  "42": { lat: 36.5897, lng: 2.4475 },
  "43": { lat: 36.4503, lng: 6.2644 },
  "44": { lat: 36.2641, lng: 1.9679 },
  "45": { lat: 33.2667, lng: -0.3167 },
  "46": { lat: 35.2975, lng: -1.1404 },
  "47": { lat: 32.49, lng: 3.6733 },
  "48": { lat: 35.7372, lng: 0.5558 },
  "49": { lat: 29.2639, lng: 0.231 },
  "50": { lat: 21.3283, lng: 0.9547 },
  "51": { lat: 34.4214, lng: 5.0689 },
  "52": { lat: 30.1333, lng: -2.1667 },
  "53": { lat: 27.1936, lng: 2.4822 },
  "54": { lat: 19.5686, lng: 5.7686 },
  "55": { lat: 33.1053, lng: 6.0642 },
  "56": { lat: 24.5533, lng: 9.4839 },
  "57": { lat: 33.95, lng: 5.92 },
  "58": { lat: 30.5833, lng: 2.8833 },
  "59": { lat: 34.1167, lng: 2.1 },
  "60": { lat: 35.3833, lng: 5.3667 },
  "61": { lat: 35.2333, lng: 5.7 },
  "62": { lat: 34.75, lng: 8.0667 },
  "63": { lat: 34.2333, lng: -1.25 },
  "64": { lat: 35.2167, lng: 2.3167 },
  "65": { lat: 35.45, lng: 2.9 },
  "66": { lat: 34.15, lng: 3.5 },
  "67": { lat: 35.8833, lng: 2.75 },
  "68": { lat: 35.2167, lng: 4.1833 },
  "69": { lat: 32.8833, lng: 0.55 },
};

export function getWilayaCoords(wilaya?: string | null): { lat: number; lng: number } | null {
  if (!wilaya) return null;
  const code = wilaya.trim().slice(0, 2);
  return WILAYA_COORDINATES[code] ?? null;
}

export function resolveEntityCoords(
  entity?: {
    lat?: number | null;
    lng?: number | null;
    wilaya?: string | null;
  } | null,
): { lat: number; lng: number } | null {
  if (!entity) return null;
  if (entity.lat != null && entity.lng != null) {
    return { lat: Number(entity.lat), lng: Number(entity.lng) };
  }
  return getWilayaCoords(entity.wilaya);
}
