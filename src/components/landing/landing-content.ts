import type { Lang } from "@/lib/i18n";

export type LandingCopy = {
  nav: {
    product: string;
    workflow: string;
    showcase: string;
    value: string;
    faq: string;
    signIn: string;
  };
  actions: {
    exploreLefto: string;
    downloadApk: string;
    comingSoon: string;
    explorePlatform: string;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    note: string;
  };
  problem: {
    eyebrow: string;
    title: string;
    description: string;
    cards: { title: string; description: string }[];
  };
  solution: {
    eyebrow: string;
    title: string;
    description: string;
    benefits: { title: string; description: string }[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };
  value: {
    eyebrow: string;
    title: string;
    description: string;
    cards: { title: string; description: string }[];
  };
  impact: {
    eyebrow: string;
    title: string;
    description: string;
    note: string;
    status: string;
    metrics: { label: string; value: string }[];
  };
  qr: {
    eyebrow: string;
    title: string;
    description: string;
    hotel: string;
    charity: string;
    verification: string;
    confirmed: string;
    steps: { title: string; description: string }[];
  };
  showcase: {
    eyebrow: string;
    title: string;
    description: string;
    hotelTab: string;
    charityTab: string;
  };
  preview: {
    available: string;
    listingTitle: string;
    listingCategory: string;
    listingMeta: string;
    browse: string;
    dashboard: string;
    requests: string;
    published: string;
    activeRequests: string;
    qrVerificationBadge: string;
    viewDetails: string;
    statusPending: string;
    statusAccepted: string;
    slogan: string;
    hotelName: string;
    orgName: string;
    location: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    entries: { question: string; answer: string }[];
  };
  closing: {
    title: string;
    description: string;
  };
  footer: {
    description: string;
    privacy: string;
    terms: string;
    contact: string;
    rights: string;
  };
};

export const landingContent: Record<Lang, LandingCopy> = {
  ar: {
    nav: {
      product: "المنصة",
      workflow: "مسار العمل",
      showcase: "المعاينة",
      value: "المميزات",
      faq: "الأسئلة الشائعة",
      signIn: "تسجيل الدخول",
    },
    actions: {
      exploreLefto: "إنشاء حساب",
      downloadApk: "تحميل تطبيق Android",
      comingSoon: "قريبًا",
      explorePlatform: "ابدأ استخدام المنصة",
    },
    hero: {
      badge: "المنصة الرقمية لإدارة فائض الطعام",
      title: "منصة رقمية موحدة لنشر وإدارة فائض الطعام بين الفنادق والجمعيات.",
      description:
        "يجمع Lefto الفنادق والجمعيات في مسار عمل متكامل لتنسيق العروض، استقبال طلبات الاستلام، وتأكيد عمليات النقل عبر الرمز الرقمي QR.",
      note: "بنية رقمية مصممة للتشغيل اليومي المباشر بدون تعقيد.",
    },
    problem: {
      eyebrow: "تحديات الإدارة التقليدية",
      title: "إدارة الفائض بالطرق اليدوية تستهلك الوقت وتفتقر إلى الشفافية.",
      description:
        "تولد الفنادق يوميًا فائضًا غذائيًا عالي الجودة، لكن الاعتماد على الاتصالات الفردية والرسائل المتفرقة يجعل تنظيم الاستلام معقدًا وغير مضمون.",
      cards: [
        {
          title: "فائض محدد بزمن",
          description: "تتغير الكميات وصلاحيات الاستلام خلال ساعات محددة تتطلب استجابة فورية.",
        },
        {
          title: "تواصل يدوي غير منظم",
          description: "المكالمات الهاتفية تفتقر إلى مسار توثيق موحد لمتابعة الطلبات والحالات.",
        },
        {
          title: "غياب الرؤية اللحظية",
          description: "صعوبة وصول الجمعيات إلى عروض الفائض المتاحة بالقرب منها في الوقت المناسب.",
        },
      ],
    },
    solution: {
      eyebrow: "حل رقمي شامل",
      title: "نظام موحد لإعادة توزيع الفائض الغذائي بكفاءة وموثوقية.",
      description:
        "يوفر Lefto بيئة عمل سحابية تمكّن الفنادق من نشر العروض بضغطة زر، وتتيح للجمعيات تقديم طلبات الاستلام ومتابعتها خطوة بخطوة.",
      benefits: [
        {
          title: "مركزية البيانات",
          description: "توحيد العروض والطلبات والحالات في لوحة قيادة واحدة.",
        },
        { title: "سرعة التنفيذ", description: "اختصار زمن التنسيق بين النشر والموافقات والجمع." },
        {
          title: "توثيق آمن",
          description: "التحقق الرقمي عبر رمز QR يضمن وصول العرض للجهة المعتمدة.",
        },
        { title: "تتبع كامل", description: "شفافية مطلقة لكافة مراحل مسار العرض الغذائي." },
      ],
    },
    workflow: {
      eyebrow: "خطوات مسار العمل",
      title: "مسار عمل سلس يتكون من 6 مراحل واضحة.",
      description: "آلية عمل مدروسة تضمن الانتقال المنظم من النشر وحتى اكتمال عملية الاستلام.",
      steps: [
        {
          title: "1. نشر الفائض الغذائي",
          description: "يقوم الفندق بإدخال تفاصيل فائض الطعام المتاح ونطاق مواعيد الاستلام.",
        },
        {
          title: "2. استكشاف العروض",
          description: "تتصفح الجمعيات العروض المتاحة جغرافيا وتراجع التفاصيل الفنية والكميات.",
        },
        {
          title: "3. تقديم طلب الاستلام",
          description: "ترسل الجمعية طلب استلام رسمي للعرض المحدد مع تحديد موعد الوصول.",
        },
        {
          title: "4. اعتماد الطلب",
          description: "يراجع الفندق الطلبات المرفوعة ويعتمد الجمعية المناسبة للعرض.",
        },
        {
          title: "5. التحقق عبر رمز QR",
          description: "عند موقع الاستلام، يتم مسح رمز QR للتأكد من هوية الجمعية وصحة الطلب.",
        },
        {
          title: "6. اكتمال عملية الاستلام",
          description: "يُغلق العرض تلقائيًا في النظام وتُسجل العملية في السجل الموثق.",
        },
      ],
    },
    value: {
      eyebrow: "المميزات التشغيلية",
      title: "أدوات مخصصة لتسهيل عمليات الفنادق والجمعيات.",
      description:
        "تم تصميم Lefto ليتوافق مع متطلبات التشغيل اليومي للفنادق واحتياجات الجمعيات على حد سواء.",
      cards: [
        {
          title: "إدارة العروض الفورية",
          description: "نشر وإلغاء وتعديل مواصفات الفائض الغذائي بسهولة وسرعة.",
        },
        {
          title: "نظام موافقات ذكي",
          description: "التحكم في اختيار الجمعيات المستلمة بناءً على الجداول الزمنية والقدرات.",
        },
        {
          title: "مسح وتأكيد QR",
          description: "نظام تحقق ميداني يلغي الأخطاء الميدانية ويضمن الانضباط.",
        },
        {
          title: "تنبيهات وحالات مباشرة",
          description: "تحديثات فورية لحالة كل طلب من مرحلة الانتظار حتى الاستلام.",
        },
      ],
    },
    impact: {
      eyebrow: "مؤشرات الأثر والتشغيل الميداني",
      title: "قياس دقيق لحجم التوزيع والحد من الهدر الغذائي.",
      description:
        "مقاييس تشغيلية مخصصة لمتابعة الأثر البيئي والاجتماعي اليومي لعمليات نقل وتوزيع الطعام الفائض.",
      note: "تحديث لحظي لمؤشرات الأداء التشغيلية ومسارات التوزيع.",
      status: "متابعة تشغيلية مباشرة",
      metrics: [
        { label: "إجمالي الوجبات الموزعة", value: "+1,250 وجبة" },
        { label: "الفنادق والمؤسسات الشريكة", value: "+12 فندق" },
        { label: "الجمعيات المعتمدة", value: "+18 جمعية" },
        { label: "عروض الفائض المتاحة", value: "24/7" },
        { label: "نسبة التوثيق والالتزام", value: "100%" },
      ],
    },
    qr: {
      eyebrow: "نظام التوثيق الميداني",
      title: "تأكيد رقمي موثق عند نقطة الاستلام.",
      description:
        "يضمن رمز الـ QR عدم تسليم أي فائض غذائي إلا للجهة المعتمدة رسميًا من قبل الفندق.",
      hotel: "الفندق ينشر الفائض",
      charity: "الجمعية ترسل طلب الاستلام",
      verification: "التحقق الرقمي عبر QR",
      confirmed: "تأكيد اكتمال التسليم",
      steps: [
        { title: "إنشاء الرمز", description: "يصدر النظام رمز QR فريد لكل طلب معتمد." },
        { title: "إبراز الرمز", description: "تعرض الجمعية الرمز عند وصول مندوب الاستلام للفندق." },
        { title: "المسح الميداني", description: "يمسح مسئول الفندق الرمز عبر تطبيق المنصة." },
        { title: "التأكيد الفوري", description: "يتغير وضع الطلب تلقائيًا إلى مكتمل وموثق." },
      ],
    },
    showcase: {
      eyebrow: "واجهات المنصة",
      title: "لوحات تحكم متخصصة لكل مستخدم.",
      description:
        "تجربة مستخدم مصممة بدقة لتلائم طبيعة عمل الفنادق ومسؤولي جمع التوزيع في الجمعيات.",
      hotelTab: "لوحة الفندق",
      charityTab: "لوحة الجمعية",
    },
    preview: {
      available: "متاح للاستلام اليوم",
      listingTitle: "وجبات ومخبوزات طازجة",
      listingCategory: "وجبات مطبوخة ومخبوزات",
      listingMeta: "45 وجبة · نافذة الاستلام: 17:30 - 19:00",
      browse: "استكشاف العروض",
      dashboard: "تطبيق Lefto للموبايل",
      requests: "طلبات الاستلام الواردة",
      published: "العروض المنشورة",
      activeRequests: "طلبات قيد المعالجة",
      qrVerificationBadge: "توثيق مباشر بـ QR",
      viewDetails: "معاينة تفاصيل العرض",
      statusPending: "قيد المراجعة",
      statusAccepted: "طلب معتمد",
      slogan: "أثر مستدام، صفر هدر.",
      hotelName: "فندق سوفيتيل العاصمة",
      orgName: "الهلال الأحمر الجزائري",
      location: "الجزائر العاصمة",
    },
    faq: {
      eyebrow: "الأسئلة الشائعة",
      title: "إجابات شمولية عن آلية عمل منصة Lefto.",
      description: "كل ما تحتاج معرفته عن انضمام المؤسسات والجمعيات وكيفية إدارة الفائض.",
      entries: [
        {
          question: "ما هي منصة Lefto وما الهدف منها؟",
          answer:
            "Lefto هي منصة رقمية متخصصة تربط بين الفنادق والجمعيات لتنظيم وتسهيل عملية إعادة توزيع فائض الطعام عبر مسار عمل رقمي موثق.",
        },
        {
          question: "كيف تقوم الجمعيات بطلب استلام الفائض؟",
          answer:
            "تتصفح الجمعية العروض المتاحة في منطقتها الجغرافية، وتطلع على نوعية الكميات ومواعيد الاستلام، ثم تقدم طلبًا رسميًا ينتظر موافقة الفندق.",
        },
        {
          question: "كيف يتم تأكيد تسليم الفائض عند الوصول؟",
          answer:
            "يحتوي كل طلب معتمد على رمز QR خاص، يقوم ممثل الجمعية بإبرازه لمسؤول الفندق لمسحه وتأكيد عملية التسليم في النظام مباشرة.",
        },
        {
          question: "كيف تضمن المنصة موثوقية الجهات المسجلة؟",
          answer:
            "تخضع حسابات الفنادق والجمعيات لعملية تحقق من الهوية قبل تفعيل صلاحيات نشر العروض أو إرسال طلبات الاستلام.",
        },
      ],
    },
    closing: {
      title: "ابدأ تنظيم فائض الطعام بنظام رقمي موثوق اليوم.",
      description: "انضم إلى الفنادق والجمعيات التي تعتمد Lefto لتحسين كفاءة إدارة الفائض الغذائي.",
    },
    footer: {
      description: "المنصة الرقمية الموحدة لإدارة وتنسيق فائض الطعام.",
      privacy: "سياسة الخصوصية",
      terms: "شروط الاستخدام",
      contact: "الدعم والتواصل",
      rights: "جميع الحقوق محفوظة.",
    },
  },
  fr: {
    nav: {
      product: "Plateforme",
      workflow: "Workflow",
      showcase: "Aperçu",
      value: "Avantages",
      faq: "FAQ",
      signIn: "Se connecter",
    },
    actions: {
      exploreLefto: "Créer un compte",
      downloadApk: "Télécharger l'APK Android",
      comingSoon: "Bientôt disponible",
      explorePlatform: "Accéder à la plateforme",
    },
    hero: {
      badge: "Plateforme SaaS de gestion des surplus alimentaires",
      title:
        "La solution digitale pour organiser le surplus alimentaire entre hôtels et associations.",
      description:
        "Lefto réunit les établissements hôteliers et les organisations caritatives dans un workflow structuré : publication des offres, validation des demandes de collecte et vérification par code QR.",
      note: "Une infrastructure conçue pour les opérations quotidiennes sur le terrain.",
    },
    problem: {
      eyebrow: "Les limites de la gestion manuelle",
      title: "La gestion informelle du surplus manque de réactivité et de traçabilité.",
      description:
        "Les hôtels génèrent quotidiennement des surplus alimentaires de qualité, mais l'absence d'outil dédié rend la coordination lourde, incertaine et chronophage.",
      cards: [
        {
          title: "Fenêtres horaires courtes",
          description:
            "Les volumes et délais de disponibilité exigent une réactivité immédiate et planifiée.",
        },
        {
          title: "Communications dispersées",
          description:
            "Les échanges téléphoniques ou par messagerie ne garantissent aucun suivi rigoureux.",
        },
        {
          title: "Visibilité restreinte",
          description:
            "Les associations manquent d'un accès centralisé aux disponibilités locales en temps réel.",
        },
      ],
    },
    solution: {
      eyebrow: "Notre approche produit",
      title: "Un workflow unique pour centraliser et sécuriser chaque collecte.",
      description:
        "Lefto apporte une interface épurée et performante permettant aux hôtels de publier leurs surplus en quelques clics et aux associations de planifier leurs retraits sans friction.",
      benefits: [
        {
          title: "Centralisation complète",
          description: "Toutes les offres et demandes regroupées sur un seul tableau de bord.",
        },
        {
          title: "Exécution rapide",
          description: "Réduction drastique du temps entre publication et validation.",
        },
        {
          title: "Vérification QR sécurisée",
          description: "Confirmation systématique de l'identité du collecteur sur place.",
        },
        {
          title: "Traçabilité intégrale",
          description: "Historique clair et auditable de toutes les étapes de redistribution.",
        },
      ],
    },
    workflow: {
      eyebrow: "Fonctionnement détaillé",
      title: "Un processus structuré en 6 étapes clés.",
      description:
        "Une méthodologie rigoureuse pour garantir la fluidité de la chaîne d'approvisionnement.",
      steps: [
        {
          title: "1. Publication du surplus",
          description: "L'hôtel renseigne la nature des lots disponibles et le créneau de retrait.",
        },
        {
          title: "2. Exploration des offres",
          description:
            "L'association consulte les offres disponibles à proximité et analyse les détails.",
        },
        {
          title: "3. Demande de collecte",
          description:
            "L'association soumet une demande de réservation avec l'heure d'arrivée estimée.",
        },
        {
          title: "4. Validation par l'hôtel",
          description:
            "L'hôtel examine la demande et valide l'attribution à l'association retenue.",
        },
        {
          title: "5. Vérification par code QR",
          description: "Au moment du retrait, le code QR est scanné pour authentifier l'opération.",
        },
        {
          title: "6. Clôture de la collecte",
          description:
            "La transaction est finalisée dans le système et enregistrée dans le registre d'activité.",
        },
      ],
    },
    value: {
      eyebrow: "Fonctionnalités clés",
      title: "Des outils puissants conçus pour l'efficacité opérationnelle.",
      description:
        "Chaque module de Lefto a été pensé pour répondre aux exigences professionnelles des hôtels et des associations.",
      cards: [
        {
          title: "Publication instantanée",
          description:
            "Saisie rapide du type de nourriture, des quantités et des contraintes horaires.",
        },
        {
          title: "Gestion des réservations",
          description: "Arbitrage et validation des demandes de collecte en toute simplicité.",
        },
        {
          title: "Vérification QR Code",
          description: "Sécurisation du processus d'enlèvement sur le site de l'établissement.",
        },
        {
          title: "Statuts en temps réel",
          description: "Suivi en direct de l'avancement : publié, demandé, validé, collecté.",
        },
      ],
    },
    impact: {
      eyebrow: "Impact opérationnel",
      title: "Des métriques clés pour mesurer l'impact et réduire le gaspillage.",
      description:
        "Indicateurs opérationnels dédiés au suivi de la distribution et de la traçabilité des surplus alimentaires.",
      note: "Mise à jour en temps réel des indicateurs de performance.",
      status: "Suivi opérationnel en direct",
      metrics: [
        { label: "Repas redistribués", value: "+1 250 repas" },
        { label: "Établissements partenaires", value: "+12 hôtels" },
        { label: "Associations agréées", value: "+18 assos" },
        { label: "Offres en cours", value: "24/7" },
        { label: "Taux de traçabilité QR", value: "100%" },
      ],
    },
    qr: {
      eyebrow: "Sécurisation du retrait",
      title: "Une authentification garantie à la remise du surplus.",
      description:
        "La technologie QR Code élimine tout risque d'erreur lors du retrait physique dans l'établissement.",
      hotel: "Publication par l'hôtel",
      charity: "Demande par l'association",
      verification: "Vérification QR sécurisée",
      confirmed: "Collecte validée & clôturée",
      steps: [
        {
          title: "Génération du code",
          description: "Le système produit un QR Code unique lors de la validation.",
        },
        {
          title: "Présentation au retrait",
          description: "Le représentant de l'association présente son code QR sur place.",
        },
        {
          title: "Scan de contrôle",
          description: "Le responsable de l'hôtel scanne le code depuis l'application.",
        },
        {
          title: "Clôture instantanée",
          description: "Le statut de l'offre passe automatiquement à 'Collecté'.",
        },
      ],
    },
    showcase: {
      eyebrow: "Découverte produit",
      title: "Des espaces dédiés à chaque acteur du réseau.",
      description: "Découvrez l'ergonomie moderne et épurée des espaces Hôtel et Association.",
      hotelTab: "Espace Hôtel",
      charityTab: "Espace Association",
    },
    preview: {
      available: "Disponible aujourd'hui",
      listingTitle: "Buffet chaud & viennoiseries",
      listingCategory: "Plats cuisinés & boulangerie",
      listingMeta: "45 portions · Créneau : 17:30 - 19:00",
      browse: "Explorer le surplus",
      dashboard: "Application Mobile Lefto",
      requests: "Demandes de collecte reçues",
      published: "Offres publiées",
      activeRequests: "Demandes actives",
      qrVerificationBadge: "Authentification QR directe",
      viewDetails: "Voir la fiche détaillée",
      statusPending: "En attente de validation",
      statusAccepted: "Demande validée",
      slogan: "Impact durable, zéro gaspillage.",
      hotelName: "Hôtel Sofitel Alger",
      orgName: "Croissant-Rouge Algérien",
      location: "Alger Centre",
    },
    faq: {
      eyebrow: "Foire aux questions",
      title: "Tout ce que vous devez savoir sur Lefto.",
      description: "Des réponses claires à vos interrogations opérationnelles et techniques.",
      entries: [
        {
          question: "Qu'est-ce que Lefto et à qui s'adresse la plateforme ?",
          answer:
            "Lefto est une plateforme SaaS permettant d'interconnecter les hôtels et les associations caritatives pour organiser et suivre la redistribution de leurs surplus alimentaires de manière professionnelle.",
        },
        {
          question: "Comment une association réserve-t-elle une offre ?",
          answer:
            "L'association consulte la carte des offres disponibles à proximité, vérifie le détail du surplus et les horaires de retrait, puis soumet une demande de collecte directe à l'hôtel.",
        },
        {
          question: "À quoi sert le système de validation par QR Code ?",
          answer:
            "Le QR Code garantit l'authentification lors de la remise physique du lot. L'hôtel scanne le code de l'association pour valider officiellement la collecte dans le système.",
        },
        {
          question: "Comment est garantie la sécurité des données ?",
          answer:
            "Lefto applique des normes de sécurité rigoureuses avec authentification stricte et contrôle d'accès pour protéger les informations des établissements et associations partenaires.",
        },
      ],
    },
    closing: {
      title: "Optimisez dès aujourd'hui la gestion de votre surplus alimentaire.",
      description:
        "Rejoignez les hôtels et associations qui font confiance à Lefto pour leurs opérations de redistribution.",
    },
    footer: {
      description: "La plateforme SaaS dédiée à la gestion du surplus alimentaire.",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      contact: "Support & Contact",
      rights: "Tous droits réservés.",
    },
  },
};
