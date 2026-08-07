import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "ar" | "fr";

type Dict = Record<string, { ar: string; fr: string }>;

export const dict = {
  appName: { ar: "ليفتو", fr: "Lefto" },
  tagline: {
    ar: "فائض طعام الفنادق يصل إلى من يحتاجه",
    fr: "Le surplus des hôtels arrive à ceux qui en ont besoin",
  },
  onboard1Title: { ar: "لا طعام يُهدر", fr: "Zéro gaspillage" },
  onboard1Body: {
    ar: "تنشر الفنادق فائض الطعام الصالح خلال ثوانٍ.",
    fr: "Les hôtels publient leur surplus en quelques secondes.",
  },
  onboard2Title: { ar: "جمعيات قريبة منك", fr: "Des associations proches" },
  onboard2Body: {
    ar: "تتصفح الجمعيات العروض المتاحة وتطلبها فوراً.",
    fr: "Les associations parcourent les offres et les demandent aussitôt.",
  },
  onboard3Title: { ar: "تتبّع كل وجبة", fr: "Chaque repas suivi" },
  onboard3Body: {
    ar: "من النشر إلى الاستلام، كل خطوة موثّقة وشفافة.",
    fr: "De la publication à la collecte, chaque étape est tracée.",
  },
  getStarted: { ar: "ابدأ الآن", fr: "Commencer" },
  skip: { ar: "تخطي", fr: "Passer" },
  next: { ar: "التالي", fr: "Suivant" },
  signIn: { ar: "تسجيل الدخول", fr: "Se connecter" },
  signUp: { ar: "إنشاء حساب", fr: "Créer un compte" },
  signOut: { ar: "تسجيل الخروج", fr: "Déconnexion" },
  email: { ar: "البريد الإلكتروني", fr: "E-mail" },
  password: { ar: "كلمة المرور", fr: "Mot de passe" },
  forgotPassword: { ar: "نسيت كلمة المرور؟", fr: "Mot de passe oublié ?" },
  resetPassword: { ar: "إعادة تعيين كلمة المرور", fr: "Réinitialiser le mot de passe" },
  sendResetLink: { ar: "إرسال رابط الاستعادة", fr: "Envoyer le lien" },
  backToSignIn: { ar: "العودة لتسجيل الدخول", fr: "Retour à la connexion" },
  newPassword: { ar: "كلمة المرور الجديدة", fr: "Nouveau mot de passe" },
  updatePassword: { ar: "تحديث كلمة المرور", fr: "Mettre à jour" },
  chooseRole: { ar: "اختر نوع الحساب", fr: "Choisissez votre profil" },
  hotel: { ar: "فندق", fr: "Hôtel" },
  charity: { ar: "جمعية", fr: "Association" },
  admin: { ar: "الإدارة", fr: "Administration" },
  hotelRoleDesc: { ar: "أنشر فائض الطعام لديك", fr: "Publiez votre surplus alimentaire" },
  charityRoleDesc: { ar: "استلم الطعام ووزّعه", fr: "Recevez et distribuez les repas" },
  fullName: { ar: "الاسم الكامل", fr: "Nom complet" },
  firstName: { ar: "الاسم", fr: "Prénom" },
  lastName: { ar: "اللقب", fr: "Nom" },
  orgName: { ar: "اسم المؤسسة", fr: "Nom de l'organisation" },
  phone: { ar: "رقم الهاتف", fr: "Téléphone" },
  wilaya: { ar: "الولاية", fr: "Wilaya" },
  address: { ar: "العنوان", fr: "Adresse" },
  alreadyHaveAccount: { ar: "لديك حساب بالفعل؟", fr: "Vous avez déjà un compte ?" },
  noAccount: { ar: "ليس لديك حساب؟", fr: "Pas encore de compte ?" },

  home: { ar: "الرئيسية", fr: "Accueil" },
  dashboard: { ar: "لوحة التحكم", fr: "Tableau de bord" },
  browse: { ar: "استكشاف", fr: "Explorer" },
  myListings: { ar: "منشوراتي", fr: "Mes annonces" },
  requests: { ar: "الطلبات", fr: "Demandes" },
  favorites: { ar: "المفضلة", fr: "Favoris" },
  notifications: { ar: "الإشعارات", fr: "Notifications" },
  profile: { ar: "الملف الشخصي", fr: "Profil" },
  settings: { ar: "الإعدادات", fr: "Paramètres" },
  map: { ar: "الخريطة", fr: "Carte" },

  newSurplus: { ar: "فائض جديد", fr: "Nouveau surplus" },
  editSurplus: { ar: "تعديل الفائض", fr: "Modifier le surplus" },
  title: { ar: "عنوان الطعام", fr: "Titre" },
  description: { ar: "الوصف", fr: "Description" },
  mealsCount: { ar: "عدد الوجبات (إجباري)", fr: "Nombre de repas (Obligatoire)" },
  pickupFrom: { ar: "بداية الاستلام", fr: "Retrait à partir de" },
  pickupTo: { ar: "نهاية الاستلام", fr: "Retrait jusqu'à" },
  expiresAt: { ar: "تاريخ الصلاحية", fr: "Date d'expiration" },
  gps: { ar: "الموقع الجغرافي", fr: "Position GPS" },
  useMyLocation: { ar: "استخدم موقعي الحالي", fr: "Utiliser ma position" },
  photo: { ar: "الصورة", fr: "Photo" },
  notes: { ar: "ملاحظات", fr: "Notes" },
  publish: { ar: "نشر", fr: "Publier" },
  save: { ar: "حفظ", fr: "Enregistrer" },
  cancel: { ar: "إلغاء", fr: "Annuler" },
  edit: { ar: "تعديل", fr: "Modifier" },
  delete: { ar: "حذف", fr: "Supprimer" },
  confirm: { ar: "تأكيد", fr: "Confirmer" },
  search: { ar: "بحث", fr: "Rechercher" },
  filters: { ar: "تصفية", fr: "Filtres" },
  all: { ar: "الكل", fr: "Tous" },
  details: { ar: "التفاصيل", fr: "Détails" },
  requestFood: { ar: "طلب الطعام", fr: "Demander" },
  requestSent: { ar: "تم إرسال الطلب", fr: "Demande envoyée" },
  accept: { ar: "قبول", fr: "Accepter" },
  reject: { ar: "رفض", fr: "Refuser" },
  markCollected: { ar: "تم الاستلام", fr: "Marquer collecté" },
  distance: { ar: "المسافة", fr: "Distance" },
  km: { ar: "كم", fr: "km" },
  openInMaps: { ar: "فتح في الخرائط", fr: "Ouvrir dans Maps" },

  statusAvailable: { ar: "متاح", fr: "Disponible" },
  statusReserved: { ar: "محجوز", fr: "Réservé" },
  statusCollected: { ar: "تم الاستلام", fr: "Collecté" },
  statusExpired: { ar: "منتهي", fr: "Expiré" },
  statusPending: { ar: "قيد الانتظار", fr: "En attente" },
  statusAccepted: { ar: "مقبول", fr: "Accepté" },
  statusRejected: { ar: "مرفوض", fr: "Refusé" },
  statusCompleted: { ar: "مكتمل", fr: "Terminé" },
  statusCancelled: { ar: "ملغى", fr: "Annulé" },

  statPublished: { ar: "منشورات", fr: "Publications" },
  statActiveRequests: { ar: "طلبات نشطة", fr: "Demandes actives" },
  statAccepted: { ar: "طلبات مقبولة", fr: "Demandes acceptées" },
  statCompleted: { ar: "عمليات استلام مكتملة", fr: "Collectes finalisées" },
  statMeals: { ar: "وجبات مُنقذة", fr: "Repas sauvés" },
  statHotels: { ar: "فنادق", fr: "Hôtels" },
  statCharities: { ar: "جمعيات", fr: "Associations" },
  statListings: { ar: "عروض", fr: "Annonces" },
  weeklyActivity: { ar: "نشاط الأسبوع", fr: "Activité de la semaine" },
  recent: { ar: "الأحدث", fr: "Récent" },
  viewAll: { ar: "عرض الكل", fr: "Tout voir" },

  emptyListings: { ar: "لا توجد منشورات بعد", fr: "Aucune annonce pour l'instant" },
  emptyListingsBody: {
    ar: "انشر أول فائض طعام لديك وسيصل إلى الجمعيات فوراً.",
    fr: "Publiez votre premier surplus, les associations le verront aussitôt.",
  },
  emptyBrowse: { ar: "لا يوجد طعام متاح حالياً", fr: "Aucune offre disponible" },
  emptyBrowseBody: {
    ar: "جرّب تغيير عوامل التصفية أو عد لاحقاً.",
    fr: "Modifiez les filtres ou revenez plus tard.",
  },
  emptyRequests: { ar: "لا توجد طلبات", fr: "Aucune demande" },
  emptyFavorites: { ar: "لا توجد مفضلات", fr: "Aucun favori" },
  emptyNotifications: { ar: "لا توجد إشعارات", fr: "Aucune notification" },
  errorTitle: { ar: "حدث خطأ", fr: "Une erreur est survenue" },
  retry: { ar: "إعادة المحاولة", fr: "Réessayer" },
  offline: { ar: "أنت غير متصل بالإنترنت", fr: "Vous êtes hors ligne" },
  loading: { ar: "جارٍ التحميل…", fr: "Chargement…" },
  pullToRefresh: { ar: "اسحب للتحديث", fr: "Tirez pour actualiser" },

  verification: { ar: "التحقق", fr: "Vérification" },
  verified: { ar: "موثّق", fr: "Vérifié" },
  unverified: { ar: "غير موثّق", fr: "Non vérifié" },
  approve: { ar: "اعتماد", fr: "Approuver" },
  suspend: { ar: "تعليق", fr: "Suspendre" },
  reinstate: { ar: "إلغاء التعليق", fr: "Réactiver" },
  suspended: { ar: "معلّق", fr: "Suspendu" },
  organizations: { ar: "الشركاء", fr: "Partenaires" },
  partnerHotels: { ar: "الفنادق", fr: "Hôtels" },
  analytics: { ar: "التحليلات", fr: "Analyses" },
  overview: { ar: "نظرة عامة", fr: "Aperçu" },
  language: { ar: "اللغة", fr: "Langue" },
  theme: { ar: "المظهر", fr: "Thème" },
  light: { ar: "فاتح", fr: "Clair" },
  dark: { ar: "داكن", fr: "Sombre" },
  markAllRead: { ar: "تعليم الكل كمقروء", fr: "Tout marquer comme lu" },
  hotelInfo: { ar: "معلومات الفندق", fr: "Informations de l'hôtel" },
  contact: { ar: "اتصال", fr: "Contact" },
  message: { ar: "رسالة", fr: "Message" },
  optional: { ar: "اختياري", fr: "Optionnel" },
  required: { ar: "حقل مطلوب", fr: "Champ requis" },
  saved: { ar: "تم الحفظ", fr: "Enregistré" },
  deleted: { ar: "تم الحذف", fr: "Supprimé" },
} satisfies Dict;

export type TKey = keyof typeof dict;

type I18nValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
};

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "lefto.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang: (l) => {
        window.localStorage.setItem(STORAGE_KEY, l);
        setLangState(l);
      },
      t: (key) => dict[key][lang],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
