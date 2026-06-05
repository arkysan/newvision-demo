(function () {
  'use strict';

  const LANGS = ['EN', 'AR', 'FR', 'ZH'];
  const STORE_KEY = 'newvision.lang';
  const LABELS = { EN: 'EN', AR: 'AR', FR: 'FR', ZH: '中文' };
  const HTML_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION']);
  const ATTRS = ['placeholder', 'title', 'aria-label', 'value'];
  let applying = false;
  let currentLang = 'EN';
  let wrappedPageSetLang = null;

  const phrase = {
    FR: {
      'New Vision': 'New Vision',
      'Inventory': 'Inventaire',
      'Premium Brands': 'Marques premium',
      'Brands': 'Marques',
      'Ship Routes': 'Routes maritimes',
      'Track': 'Suivi',
      'Owner Login': 'Connexion propriétaire',
      'Owner Portal': 'Portail propriétaire',
      'Sales Portal': 'Portail ventes',
      'Sales View': 'Vue ventes',
      'Quote': 'Devis',
      'Quote this vehicle': 'Demander un devis pour ce véhicule',
      'Track your vehicle': 'Suivre votre véhicule',
      'Vehicle Shipment Tracking': 'Suivi d’expédition véhicule',
      'World Shipping Map': 'Carte mondiale du transport',
      '🌍 WORLD SHIPPING MAP': '🌍 CARTE MONDIALE DU TRANSPORT',
      'Open Map': 'Ouvrir la carte',
      'Track →': 'Suivre →',
      'Estimated arrival in': 'Arrivée estimée dans',
      'Origin': 'Origine',
      'Destination': 'Destination',
      'Vehicle': 'Véhicule',
      'Vessel': 'Navire',
      'Tracking code': 'Code de suivi',
      'Status': 'Statut',
      'Premium brand board': 'Tableau des marques premium',
      'All brands and the strongest premium vehicle match.': 'Toutes les marques et la meilleure correspondance de véhicule premium.',
      'Loading brand catalog from the New Vision public stock file...': 'Chargement du catalogue des marques depuis le stock public New Vision...',
      'Brands shown': 'Marques affichées',
      'Public vehicles': 'Véhicules publics',
      'Premium picks': 'Sélections premium',
      'Sourcing lanes': 'Demandes de sourcing',
      'All': 'Tous',
      'China': 'Chine',
      'Germany': 'Allemagne',
      'Japan': 'Japon',
      'Korea': 'Corée',
      'USA': 'États-Unis',
      'Sourcing request': 'Demande de sourcing',
      'Owner live edit lane': 'Voie d’édition propriétaire',
      'Open Review Editor': 'Ouvrir l’éditeur de revue',
      'Main site': 'Site principal',
      'Vehicle deal page': 'Page offre véhicule',
      'China vehicle export deal desk': 'Bureau d’export automobile Chine',
      'Loading stock': 'Chargement du stock',
      'Loading vehicle photos': 'Chargement des photos du véhicule',
      'Public stock reference, export route preview, inspection/docs options, and quote capture.': 'Référence stock public, aperçu route export, options inspection/documents et capture du devis.',
      'FOB price': 'Prix FOB',
      'Estimated CIF': 'CIF estimé',
      'Generate quote preview': 'Générer l’aperçu du devis',
      'Track stock ID': 'Suivre l’ID stock',
      'Export readiness': 'Préparation export',
      'Public stock ID locked': 'ID stock public verrouillé',
      'Proof before deposit': 'Preuve avant acompte',
      'Docs and freight confirmed by sales': 'Documents et fret confirmés par les ventes',
      'Export quote preview': 'Aperçu du devis export',
      'Name *': 'Nom *',
      'Country *': 'Pays *',
      'WhatsApp / phone *': 'WhatsApp / téléphone *',
      'Destination port *': 'Port de destination *',
      'Inspection / proof': 'Inspection / preuve',
      'Photo/video inspection': 'Inspection photo/vidéo',
      'Live video call': 'Appel vidéo en direct',
      'Full export inspection': 'Inspection export complète',
      'No inspection yet': 'Pas encore d’inspection',
      'Docs option': 'Option documents',
      'Export docs check': 'Vérification documents export',
      'Invoice + export clearance pack': 'Facture + dossier dédouanement export',
      'Dealer batch document pack': 'Dossier documents lot revendeur',
      'Confirm documents later': 'Confirmer les documents plus tard',
      'Message / quantity *': 'Message / quantité *',
      'Capture NVQ and open WhatsApp': 'Capturer le NVQ et ouvrir WhatsApp',
      'Community': 'Communauté',
      'Logged in as': 'Connecté comme',
      'Sign out': 'Déconnexion',
      'Back to site': 'Retour au site',
      'Follow New Vision': 'Suivre New Vision',
      'Followers': 'Abonnés',
      'Posts': 'Publications',
      'Follow': 'Suivre',
      'Following': 'Suivi',
      'Back to feed': 'Retour au fil',
      'Comments': 'Commentaires',
      'Post comment': 'Publier le commentaire',
      'Sign in': 'Connexion',
      'to leave a comment.': 'pour laisser un commentaire.',
      'Latest from New Vision': 'Dernières nouvelles de New Vision',
      'News': 'Actualités',
      'Updates': 'Mises à jour',
      'Markets': 'Marchés',
      'Vehicles': 'Véhicules',
      'Loading posts…': 'Chargement des publications…',
      'Join the Community': 'Rejoindre la communauté',
      'Register': 'Créer un compte',
      'Sign In': 'Connexion',
      'Your Name *': 'Votre nom *',
      'Country': 'Pays',
      'Email *': 'E-mail *',
      'Password *': 'Mot de passe *',
      'WhatsApp (optional)': 'WhatsApp (facultatif)',
      'Create Account →': 'Créer le compte →',
      'Email': 'E-mail',
      'Password': 'Mot de passe',
      'Sign In →': 'Connexion →',
      'Quick Links': 'Liens rapides',
      'Browse inventory': 'Parcourir l’inventaire',
      'Track my shipment': 'Suivre mon expédition',
      'Request a quote': 'Demander un devis',
      'Shipping routes': 'Routes maritimes',
      'WhatsApp Us →': 'Nous écrire sur WhatsApp →',
      'About New Vision': 'À propos de New Vision',
      'Browse Cars': 'Voir les voitures',
      'Get Quote': 'Obtenir un devis',
      'WORLD SHIPPING MAP': 'CARTE MONDIALE DU TRANSPORT',
      'Route Brief': 'Brief route',
      '3D Globe': 'Globe 3D',
      'Site': 'Site',
      'Ship Tracker': 'Suivi navire',
      'Track any vessel': 'Suivre n’importe quel navire',
      'World Events': 'Événements mondiaux',
      'Risk Zones': 'Zones de risque',
      'Loading…': 'Chargement…',
      'NV Destination Ports': 'Ports de destination NV',
      'Route Risk Brief': 'Brief risque route',
      'Close': 'Fermer',
      'Active Route': 'Route active',
      'All Routes': 'Toutes les routes',
      '6 ports': '6 ports',
      '16–48 days': '16–48 jours',
      'FOB → CIF': 'FOB → CIF',
      'Gulf (Jebel Ali)': 'Golfe (Jebel Ali)',
      'East Africa': 'Afrique de l’Est',
      'West Africa': 'Afrique de l’Ouest',
      'Europe': 'Europe',
      'Latin America': 'Amérique latine',
      'Caribbean': 'Caraïbes',
      'Track Shipment': 'Suivre l’expédition',
      '🚢 Track Shipment': '🚢 Suivre l’expédition',
      'Get CIF Quote →': 'Obtenir un devis CIF →',
      '📋 Get CIF Quote →': '📋 Obtenir un devis CIF →',
      'New Vision — Active Routes': 'New Vision — Routes actives',
      'Public stock pick': 'Sélection stock public',
      'View full deal': 'Voir l’offre complète',
      'Quote premium': 'Devis premium',
      'FOB GUIDE': 'GUIDE FOB',
      'STOCK STATUS': 'STATUT STOCK',
      'POWER LANE': 'ÉNERGIE',
      'BODY / MATCH': 'CARROSSERIE / MATCH',
      'Loaded from the static New Vision stock file on this site. A Vercel-backed refresh is checking for owner portal updates.': 'Chargé depuis le fichier de stock statique New Vision sur ce site. Une actualisation Vercel vérifie les mises à jour du portail propriétaire.',
      'Name': 'Nom',
      'Password': 'Mot de passe',
      'or': 'ou',
      'Sign in with a Google account': 'Connexion avec un compte Google',
      'Edit Site Live': 'Modifier le site en direct',
      'Sign out': 'Déconnexion',
      'Total Visitors': 'Visiteurs totaux',
      'Visitors Today': 'Visiteurs aujourd’hui',
      'Vehicle Requests': 'Demandes véhicules',
      'Net Profit': 'Bénéfice net',
      'Deal Desk': 'Bureau des offres',
      'Client Data': 'Données client',
      'Vehicle List': 'Liste véhicules',
      'Route & Close': 'Route et clôture',
      'Team & Sold': 'Équipe et vendus',
      'Clients': 'Clients',
      'Deal Brief': 'Résumé offre',
      'Select a client': 'Sélectionner un client',
      'Copy WhatsApp script': 'Copier le script WhatsApp',
      'Copy deal summary': 'Copier le résumé offre',
      'Full Vehicle List': 'Liste complète des véhicules',
      'All stock': 'Tout le stock',
      'EV / PHEV': 'EV / PHEV',
      'Gas / Diesel': 'Essence / Diesel',
      'Premium': 'Premium',
      'Docs ready': 'Documents prêts',
      'Advanced owner route map': 'Carte route propriétaire avancée',
      'Lane shipments': 'Expéditions par voie',
      'Normal quote': 'Devis normal',
      'Hot buyer / call now': 'Acheteur chaud / appeler',
      'Needs photos': 'Besoin de photos',
      'Needs inspection proof': 'Besoin preuve inspection',
      'Ready for deposit': 'Prêt pour acompte',
      'Income': 'Revenu',
      'Expense': 'Dépense',
      'Add': 'Ajouter',
      'Date': 'Date',
      'Type': 'Type',
      'Label': 'Libellé',
      'Amount': 'Montant',
      'Inventory manager': 'Gestion inventaire',
      'Add vehicle': 'Ajouter véhicule',
      'Save to server': 'Enregistrer serveur',
      'Download JSON': 'Télécharger JSON',
      'Stock ID': 'ID stock',
      'Make': 'Marque',
      'Model': 'Modèle',
      'Year': 'Année',
      'Andy / Eissa Sales Portal': 'Portail ventes Andy / Eissa',
      'Deal desk for leads, stock, vehicle proof, route planning, and handoff scripts.': 'Bureau de vente pour leads, stock, preuves véhicule, planification route et scripts de transfert.',
      'Sales Deal Cockpit': 'Cockpit ventes',
      'Public Site': 'Site public',
      'Open leads': 'Leads ouverts',
      'Ready to quote': 'Prêt à deviser',
      'Proof pending': 'Preuve en attente',
      'Sold vehicles': 'Véhicules vendus',
      'Close Tools': 'Outils clôture',
      'Copy WhatsApp Script': 'Copier script WhatsApp',
      'Copy Deal Summary': 'Copier résumé offre',
      'Sales Script': 'Script ventes',
      'Back-room Notes': 'Notes internes',
      'Vehicle Editor': 'Éditeur véhicule',
      'Condition': 'État',
      'New': 'Neuf',
      'Used': 'Occasion',
      'Old stock': 'Ancien stock',
      'Fuel': 'Carburant',
      'Body': 'Carrosserie',
      'Drive': 'Transmission',
      'Back-room location': 'Emplacement interne',
      'Private VIN/frame': 'VIN/châssis privé',
      'Docs status': 'Statut documents',
      'Inspection status': 'Statut inspection',
      'Image URL': 'URL image',
      'Available': 'Disponible',
      'Sold': 'Vendu',
      'Archived': 'Archivé',
      'Sold by': 'Vendu par',
      'Sold price': 'Prix vendu',
      'Buyer': 'Acheteur',
      'Save Vehicle': 'Enregistrer véhicule',
      'Mark old vehicle SOLD': 'Marquer ancien véhicule VENDU',
      'Archive Vehicle': 'Archiver véhicule',
      'Route Planner': 'Planificateur route',
      'Destination Port': 'Port destination',
      'Customer urgency': 'Urgence client',
      'Needs photos today': 'Besoin photos aujourd’hui',
      'Ready to deposit': 'Prêt pour acompte',
      'Dealer batch': 'Lot revendeur',
      'Close Packet': 'Dossier clôture',
      'Next Action': 'Action suivante',
      'Sales Team': 'Équipe ventes',
      'Person name': 'Nom personne',
      'WhatsApp': 'WhatsApp',
      'Commission %': 'Commission %',
      'Bank / payout provider': 'Banque / paiement',
      'Account number': 'Numéro de compte',
      'Payout notes': 'Notes paiement',
      'Add / Update Salesperson': 'Ajouter / mettre à jour vendeur',
      'Store Archive Data': 'Stocker données archive',
      'Sold Inventory & Commission': 'Inventaire vendu et commission',
      'Track a shipment': 'Suivre une expédition',
      'Open full map': 'Ouvrir carte complète',
      'Active Shipping Alerts:': 'Alertes transport actives :'
    },
    AR: {
      'Inventory': 'المخزون',
      'Premium Brands': 'العلامات الفاخرة',
      'Brands': 'العلامات',
      'Ship Routes': 'مسارات الشحن',
      'Track': 'التتبع',
      'Owner Login': 'دخول المالك',
      'Owner Portal': 'بوابة المالك',
      'Sales Portal': 'بوابة المبيعات',
      'Quote': 'عرض سعر',
      'Quote this vehicle': 'اطلب عرض سعر لهذه السيارة',
      'Track your vehicle': 'تتبع سيارتك',
      'Vehicle Shipment Tracking': 'تتبع شحن السيارة',
      'World Shipping Map': 'خريطة الشحن العالمية',
      '🌍 WORLD SHIPPING MAP': '🌍 خريطة الشحن العالمية',
      'Open Map': 'افتح الخريطة',
      'Track →': 'تتبع →',
      'Estimated arrival in': 'الوصول المتوقع خلال',
      'Origin': 'المنشأ',
      'Destination': 'الوجهة',
      'Vehicle': 'السيارة',
      'Vessel': 'السفينة',
      'Tracking code': 'رمز التتبع',
      'Status': 'الحالة',
      'Premium brand board': 'لوحة العلامات الفاخرة',
      'All brands and the strongest premium vehicle match.': 'كل العلامات وأقوى سيارة فاخرة مناسبة.',
      'Loading brand catalog from the New Vision public stock file...': 'جاري تحميل كتالوج العلامات من ملف مخزون New Vision العام...',
      'Brands shown': 'العلامات المعروضة',
      'Public vehicles': 'سيارات عامة',
      'Premium picks': 'اختيارات فاخرة',
      'Sourcing lanes': 'طلبات التوريد',
      'All': 'الكل',
      'China': 'الصين',
      'Germany': 'ألمانيا',
      'Japan': 'اليابان',
      'Korea': 'كوريا',
      'USA': 'الولايات المتحدة',
      'Sourcing request': 'طلب توريد',
      'Open Review Editor': 'فتح محرر المراجعة',
      'Vehicle deal page': 'صفحة صفقة السيارة',
      'China vehicle export deal desk': 'مكتب صفقات تصدير السيارات من الصين',
      'Loading stock': 'تحميل المخزون',
      'Loading vehicle photos': 'تحميل صور السيارة',
      'Public stock reference, export route preview, inspection/docs options, and quote capture.': 'مرجع مخزون عام، معاينة مسار التصدير، خيارات الفحص والمستندات، وتسجيل العرض.',
      'FOB price': 'سعر FOB',
      'Estimated CIF': 'CIF تقديري',
      'Generate quote preview': 'إنشاء معاينة العرض',
      'Track stock ID': 'تتبع رقم المخزون',
      'Export readiness': 'جاهزية التصدير',
      'Public stock ID locked': 'رقم المخزون العام مثبت',
      'Proof before deposit': 'إثبات قبل العربون',
      'Docs and freight confirmed by sales': 'المستندات والشحن يؤكدها فريق المبيعات',
      'Export quote preview': 'معاينة عرض التصدير',
      'Name *': 'الاسم *',
      'Country *': 'الدولة *',
      'WhatsApp / phone *': 'واتساب / الهاتف *',
      'Destination port *': 'ميناء الوجهة *',
      'Inspection / proof': 'الفحص / الإثبات',
      'Photo/video inspection': 'فحص صور/فيديو',
      'Live video call': 'مكالمة فيديو مباشرة',
      'Full export inspection': 'فحص تصدير كامل',
      'No inspection yet': 'لا يوجد فحص بعد',
      'Docs option': 'خيار المستندات',
      'Export docs check': 'فحص مستندات التصدير',
      'Invoice + export clearance pack': 'فاتورة + ملف تخليص التصدير',
      'Dealer batch document pack': 'ملف مستندات دفعة تاجر',
      'Confirm documents later': 'تأكيد المستندات لاحقاً',
      'Message / quantity *': 'الرسالة / الكمية *',
      'Capture NVQ and open WhatsApp': 'تسجيل NVQ وفتح واتساب',
      'Community': 'المجتمع',
      'Logged in as': 'تم الدخول باسم',
      'Sign out': 'تسجيل الخروج',
      'Back to site': 'العودة للموقع',
      'Follow New Vision': 'تابع New Vision',
      'Followers': 'المتابعون',
      'Posts': 'المنشورات',
      'Follow': 'متابعة',
      'Following': 'تتم المتابعة',
      'Back to feed': 'العودة للمنشورات',
      'Comments': 'التعليقات',
      'Post comment': 'نشر تعليق',
      'Sign in': 'تسجيل الدخول',
      'to leave a comment.': 'لترك تعليق.',
      'Latest from New Vision': 'آخر أخبار New Vision',
      'News': 'الأخبار',
      'Updates': 'التحديثات',
      'Markets': 'الأسواق',
      'Vehicles': 'السيارات',
      'Loading posts…': 'جاري تحميل المنشورات…',
      'Join the Community': 'انضم إلى المجتمع',
      'Register': 'تسجيل',
      'Sign In': 'تسجيل الدخول',
      'Your Name *': 'اسمك *',
      'Country': 'الدولة',
      'Email *': 'البريد الإلكتروني *',
      'Password *': 'كلمة المرور *',
      'WhatsApp (optional)': 'واتساب (اختياري)',
      'Create Account →': 'إنشاء حساب →',
      'Email': 'البريد الإلكتروني',
      'Password': 'كلمة المرور',
      'Sign In →': 'تسجيل الدخول →',
      'Quick Links': 'روابط سريعة',
      'Browse inventory': 'تصفح المخزون',
      'Track my shipment': 'تتبع شحنتي',
      'Request a quote': 'اطلب عرض سعر',
      'Shipping routes': 'مسارات الشحن',
      'WhatsApp Us →': 'راسلنا واتساب →',
      'About New Vision': 'حول New Vision',
      'Browse Cars': 'تصفح السيارات',
      'Get Quote': 'احصل على عرض',
      'WORLD SHIPPING MAP': 'خريطة الشحن العالمية',
      'Route Brief': 'ملخص المسار',
      '3D Globe': 'كرة ثلاثية الأبعاد',
      'Site': 'الموقع',
      'Ship Tracker': 'تتبع السفينة',
      'Track any vessel': 'تتبع أي سفينة',
      'World Events': 'أحداث العالم',
      'Risk Zones': 'مناطق الخطر',
      'Loading…': 'جاري التحميل…',
      'NV Destination Ports': 'موانئ وجهة NV',
      'Route Risk Brief': 'ملخص مخاطر المسار',
      'Close': 'إغلاق',
      'Active Route': 'المسار النشط',
      'All Routes': 'كل المسارات',
      '6 ports': '6 موانئ',
      '16–48 days': '16-48 يوماً',
      'FOB → CIF': 'FOB → CIF',
      'Gulf (Jebel Ali)': 'الخليج (جبل علي)',
      'East Africa': 'شرق أفريقيا',
      'West Africa': 'غرب أفريقيا',
      'Europe': 'أوروبا',
      'Latin America': 'أمريكا اللاتينية',
      'Caribbean': 'الكاريبي',
      'Track Shipment': 'تتبع الشحنة',
      '🚢 Track Shipment': '🚢 تتبع الشحنة',
      'Get CIF Quote →': 'احصل على عرض CIF →',
      '📋 Get CIF Quote →': '📋 احصل على عرض CIF →',
      'New Vision — Active Routes': 'New Vision — المسارات النشطة',
      'Public stock pick': 'اختيار من المخزون العام',
      'View full deal': 'عرض الصفقة الكاملة',
      'Quote premium': 'عرض سعر فاخر',
      'FOB GUIDE': 'دليل FOB',
      'STOCK STATUS': 'حالة المخزون',
      'POWER LANE': 'نوع الطاقة',
      'BODY / MATCH': 'الفئة / المطابقة',
      'Loaded from the static New Vision stock file on this site. A Vercel-backed refresh is checking for owner portal updates.': 'تم التحميل من ملف مخزون New Vision الثابت على هذا الموقع. يجري تحديث مدعوم من Vercel للتحقق من تحديثات بوابة المالك.',
      'Name': 'الاسم',
      'Password': 'كلمة المرور',
      'or': 'أو',
      'Sign in with a Google account': 'الدخول بحساب Google',
      'Edit Site Live': 'تعديل الموقع مباشرة',
      'Total Visitors': 'إجمالي الزوار',
      'Visitors Today': 'زوار اليوم',
      'Vehicle Requests': 'طلبات السيارات',
      'Net Profit': 'صافي الربح',
      'Deal Desk': 'مكتب الصفقات',
      'Client Data': 'بيانات العميل',
      'Vehicle List': 'قائمة السيارات',
      'Route & Close': 'المسار والإغلاق',
      'Team & Sold': 'الفريق والمبيعات',
      'Clients': 'العملاء',
      'Deal Brief': 'ملخص الصفقة',
      'Select a client': 'اختر عميلاً',
      'Copy WhatsApp script': 'نسخ نص واتساب',
      'Copy deal summary': 'نسخ ملخص الصفقة',
      'Full Vehicle List': 'قائمة السيارات الكاملة',
      'All stock': 'كل المخزون',
      'EV / PHEV': 'كهربائي / هجين',
      'Gas / Diesel': 'بنزين / ديزل',
      'Premium': 'فاخر',
      'Docs ready': 'المستندات جاهزة',
      'Normal quote': 'عرض عادي',
      'Needs photos': 'يحتاج صور',
      'Ready for deposit': 'جاهز للعربون',
      'Income': 'دخل',
      'Expense': 'مصروف',
      'Add': 'إضافة',
      'Date': 'التاريخ',
      'Type': 'النوع',
      'Label': 'العنوان',
      'Amount': 'المبلغ',
      'Inventory manager': 'مدير المخزون',
      'Add vehicle': 'إضافة سيارة',
      'Save to server': 'حفظ في الخادم',
      'Download JSON': 'تنزيل JSON',
      'Stock ID': 'رقم المخزون',
      'Make': 'الماركة',
      'Model': 'الموديل',
      'Year': 'السنة',
      'Andy / Eissa Sales Portal': 'بوابة مبيعات Andy / Eissa',
      'Sales Deal Cockpit': 'لوحة صفقات المبيعات',
      'Deal desk for leads, stock, vehicle proof, route planning, and handoff scripts.': 'مكتب صفقات للعملاء والمخزون وإثبات السيارة وتخطيط المسار ونصوص التسليم.',
      'Public Site': 'الموقع العام',
      'Open leads': 'عملاء مفتوحون',
      'Ready to quote': 'جاهز للتسعير',
      'Proof pending': 'إثبات معلق',
      'Sold vehicles': 'سيارات مباعة',
      'Close Tools': 'أدوات الإغلاق',
      'Copy WhatsApp Script': 'نسخ نص واتساب',
      'Copy Deal Summary': 'نسخ ملخص الصفقة',
      'Sales Script': 'نص المبيعات',
      'Back-room Notes': 'ملاحظات داخلية',
      'Vehicle Editor': 'محرر السيارة',
      'Condition': 'الحالة',
      'New': 'جديد',
      'Used': 'مستعمل',
      'Old stock': 'مخزون قديم',
      'Fuel': 'الوقود',
      'Body': 'الفئة',
      'Drive': 'الدفع',
      'Back-room location': 'الموقع الداخلي',
      'Private VIN/frame': 'VIN/الشاسيه الخاص',
      'Docs status': 'حالة المستندات',
      'Inspection status': 'حالة الفحص',
      'Image URL': 'رابط الصورة',
      'Available': 'متاح',
      'Sold': 'مباع',
      'Archived': 'مؤرشف',
      'Sold by': 'باعه',
      'Sold price': 'سعر البيع',
      'Buyer': 'المشتري',
      'Save Vehicle': 'حفظ السيارة',
      'Mark old vehicle SOLD': 'تحديد السيارة القديمة كمباعة',
      'Archive Vehicle': 'أرشفة السيارة',
      'Route Planner': 'مخطط المسار',
      'Destination Port': 'ميناء الوجهة',
      'Customer urgency': 'استعجال العميل',
      'Needs photos today': 'يحتاج صور اليوم',
      'Dealer batch': 'دفعة تاجر',
      'Next Action': 'الإجراء التالي',
      'Sales Team': 'فريق المبيعات',
      'Person name': 'اسم الشخص',
      'WhatsApp': 'واتساب',
      'Commission %': 'نسبة العمولة',
      'Bank / payout provider': 'البنك / جهة الدفع',
      'Account number': 'رقم الحساب',
      'Payout notes': 'ملاحظات الدفع',
      'Add / Update Salesperson': 'إضافة / تحديث مندوب',
      'Sold Inventory & Commission': 'المخزون المباع والعمولة',
      'Track a shipment': 'تتبع شحنة',
      'Open full map': 'فتح الخريطة كاملة',
      'Active Shipping Alerts:': 'تنبيهات الشحن النشطة:'
    },
    ZH: {
      'Inventory': '库存',
      'Premium Brands': '高端品牌',
      'Brands': '品牌',
      'Ship Routes': '航运路线',
      'Track': '追踪',
      'Owner Login': '老板登录',
      'Owner Portal': '老板后台',
      'Sales Portal': '销售后台',
      'Sales View': '销售视图',
      'Quote': '报价',
      'Quote this vehicle': '为这台车报价',
      'Track your vehicle': '追踪车辆',
      'Vehicle Shipment Tracking': '车辆运输追踪',
      'World Shipping Map': '全球航运地图',
      '🌍 WORLD SHIPPING MAP': '🌍 全球航运地图',
      'Open Map': '打开地图',
      'Track →': '追踪 →',
      'Estimated arrival in': '预计到达倒计时',
      'Origin': '起运地',
      'Destination': '目的地',
      'Vehicle': '车辆',
      'Vessel': '船舶',
      'Tracking code': '追踪编号',
      'Status': '状态',
      'Premium brand board': '高端品牌看板',
      'All brands and the strongest premium vehicle match.': '所有品牌和最强高端车型匹配。',
      'This page turns the New Vision public stock file into a brand-by-brand buying board. Each card shows the highest-value public match for that brand; brands without a current public card are marked as sourcing requests, not live stock.': '本页面把 New Vision 公共库存整理成按品牌查看的采购看板。每张卡显示该品牌当前最有价值的公开车型；没有公开车辆的品牌会标为寻源请求，不是现货。',
      'Loading brand catalog from the New Vision public stock file...': '正在从 New Vision 公共库存加载品牌目录...',
      'Brands shown': '显示品牌',
      'Public vehicles': '公开车辆',
      'Premium picks': '高端推荐',
      'Sourcing lanes': '寻源通道',
      'All': '全部',
      'China': '中国',
      'Germany': '德国',
      'Japan': '日本',
      'Korea': '韩国',
      'USA': '美国',
      'Sourcing request': '寻源请求',
      'Owner live edit lane': '老板实时编辑区',
      'Open Review Editor': '打开审核编辑器',
      'Main site': '主站',
      'Vehicle deal page': '车辆成交页',
      'China vehicle export deal desk': '中国汽车出口成交台',
      'Loading stock': '正在加载库存',
      'Loading vehicle photos': '正在加载车辆图片',
      'Public stock reference, export route preview, inspection/docs options, and quote capture.': '公开库存参考、出口路线预览、验车/文件选项和报价收集。',
      'FOB price': 'FOB 价格',
      'Estimated CIF': '预估 CIF',
      'Generate quote preview': '生成报价预览',
      'Track stock ID': '追踪库存编号',
      'Export readiness': '出口准备',
      'Public stock ID locked': '公开库存编号已锁定',
      'Use this ID in every quote, payment, and tracking message.': '每次报价、付款和追踪信息都使用这个编号。',
      'Proof before deposit': '定金前证明',
      'Request current photos, walkaround video, or live video call.': '可请求当前照片、环绕视频或实时视频通话。',
      'Docs and freight confirmed by sales': '文件和运费由销售确认',
      'Final CIF depends on destination port, carrier rate, vehicle size, and document requirements.': '最终 CIF 取决于目的港、船公司费率、车辆尺寸和文件要求。',
      'Export quote preview': '出口报价预览',
      'Name *': '姓名 *',
      'Country *': '国家 *',
      'WhatsApp / phone *': 'WhatsApp / 电话 *',
      'Destination port *': '目的港 *',
      'Inspection / proof': '验车 / 证明',
      'Photo/video inspection': '照片/视频验车',
      'Live video call': '实时视频通话',
      'Full export inspection': '完整出口验车',
      'No inspection yet': '暂不验车',
      'Docs option': '文件选项',
      'Export docs check': '出口文件检查',
      'Invoice + export clearance pack': '发票 + 出口清关文件包',
      'Dealer batch document pack': '经销商批量文件包',
      'Confirm documents later': '稍后确认文件',
      'Message / quantity *': '留言 / 数量 *',
      'Estimate only. New Vision sales confirms live freight, docs, and final CIF before deposit.': '仅为估算。定金前 New Vision 销售会确认实时运费、文件和最终 CIF。',
      'Capture NVQ and open WhatsApp': '生成 NVQ 并打开 WhatsApp',
      'Community': '社区',
      'Logged in as': '已登录为',
      'Sign out': '退出登录',
      'Back to site': '返回网站',
      'Follow New Vision': '关注 New Vision',
      'Get updates on new arrivals, market news, shipping alerts, and EV deals — direct from our export team.': '获取新到车、市场资讯、航运提醒和新能源车优惠，由出口团队直接发布。',
      'Followers': '粉丝',
      'Posts': '帖子',
      'Follow': '关注',
      'Following': '已关注',
      'Back to feed': '返回动态',
      'Comments': '评论',
      'Post comment': '发表评论',
      'Sign in': '登录',
      'to leave a comment.': '后可发表评论。',
      'Latest from New Vision': 'New Vision 最新动态',
      'News': '新闻',
      'Updates': '更新',
      'Markets': '市场',
      'Vehicles': '车辆',
      'Loading posts…': '正在加载帖子…',
      'Join the Community': '加入社区',
      'Register': '注册',
      'Sign In': '登录',
      'Your Name *': '姓名 *',
      'Country': '国家',
      'Email *': '邮箱 *',
      'Password *': '密码 *',
      'WhatsApp (optional)': 'WhatsApp（选填）',
      'Create Account →': '创建账号 →',
      'Email': '邮箱',
      'Password': '密码',
      'Sign In →': '登录 →',
      'Quick Links': '快捷链接',
      'Browse inventory': '浏览库存',
      'Track my shipment': '追踪运输',
      'Request a quote': '请求报价',
      'Shipping routes': '航运路线',
      'WhatsApp Us →': 'WhatsApp 联系 →',
      'About New Vision': '关于 New Vision',
      'Browse Cars': '浏览车辆',
      'Get Quote': '获取报价',
      'WORLD SHIPPING MAP': '全球航运地图',
      'Route Brief': '路线简报',
      '3D Globe': '3D 地球',
      'Site': '网站',
      'Ship Tracker': '船运追踪',
      'Enter an NVS shipment code, IMO number, MMSI, or vessel name to track live position and ETA.': '输入 NVS 运输编号、IMO、MMSI 或船名，追踪实时位置和 ETA。',
      'Track any vessel': '追踪任意船舶',
      'Enter your NVS shipment ID, IMO number, or vessel name.': '输入 NVS 运输编号、IMO 或船名。',
      'The customer map shows New Vision trade routes and destination ports.': '客户地图显示 New Vision 贸易路线和目的港。',
      'World Events': '全球事件',
      'Risk Zones': '风险区域',
      'Loading…': '加载中…',
      'NV Destination Ports': 'NV 目的港',
      'Route Risk Brief': '路线风险简报',
      'Close': '关闭',
      'Select destination port to generate a live risk brief:': '选择目的港生成实时风险简报：',
      'Fetching live intelligence…': '正在获取实时情报…',
      'Live AIS — VesselFinder': '实时 AIS — VesselFinder',
      'Active Route': '当前路线',
      'All Routes': '全部路线',
      '6 ports': '6 个港口',
      '16–48 days': '16-48 天',
      'FOB → CIF': 'FOB → CIF',
      'Gulf (Jebel Ali)': '海湾（Jebel Ali）',
      'East Africa': '东非',
      'West Africa': '西非',
      'Europe': '欧洲',
      'Latin America': '拉美',
      'Caribbean': '加勒比',
      'Track Shipment': '追踪运输',
      '🚢 Track Shipment': '🚢 追踪运输',
      'Get CIF Quote →': '获取 CIF 报价 →',
      '📋 Get CIF Quote →': '📋 获取 CIF 报价 →',
      'New Vision — Active Routes': 'New Vision — 当前路线',
      'Public stock pick': '公开库存推荐',
      'View full deal': '查看完整成交页',
      'Quote premium': '高端车报价',
      'FOB GUIDE': 'FOB 参考',
      'STOCK STATUS': '库存状态',
      'POWER LANE': '能源类型',
      'BODY / MATCH': '车身 / 匹配',
      'Loaded from the static New Vision stock file on this site. A Vercel-backed refresh is checking for owner portal updates.': '已从本站 New Vision 静态库存文件加载。Vercel 后端正在检查老板后台更新。',
      'Name': '姓名',
      'Password': '密码',
      'or': '或',
      'Sign in with a Google account': '使用 Google 账号登录',
      'Edit Site Live': '实时编辑网站',
      'Total Visitors': '总访客',
      'Visitors Today': '今日访客',
      'Vehicle Requests': '车辆询盘',
      'Net Profit': '净利润',
      'Sales portal oversight': '销售后台监督',
      'Deal Desk': '成交台',
      'Client Data': '客户数据',
      'Vehicle List': '车辆列表',
      'Route & Close': '路线与成交',
      'Team & Sold': '团队与已售',
      'Clients': '客户',
      'Deal Brief': '成交摘要',
      'Select a client': '选择客户',
      'Choose a lead or a vehicle to build the owner close packet.': '选择线索或车辆，生成老板成交包。',
      'Copy WhatsApp script': '复制 WhatsApp 话术',
      'Copy deal summary': '复制成交摘要',
      'Full Vehicle List': '完整车辆列表',
      'All stock': '全部库存',
      'EV / PHEV': '纯电 / 插混',
      'Gas / Diesel': '燃油 / 柴油',
      'Premium': '高端',
      'Docs ready': '文件已准备',
      'Advanced owner route map': '老板高级路线图',
      'Lane shipments': '航线运输',
      'Normal quote': '普通报价',
      'Hot buyer / call now': '热客户 / 立即电话',
      'Needs photos': '需要照片',
      'Needs inspection proof': '需要验车证明',
      'Ready for deposit': '准备付定金',
      'Income': '收入',
      'Expense': '支出',
      'Add': '添加',
      'Date': '日期',
      'Type': '类型',
      'Label': '标签',
      'Amount': '金额',
      'Inventory manager': '库存管理',
      'Add vehicle': '添加车辆',
      'Save to server': '保存到服务器',
      'Download JSON': '下载 JSON',
      'Stock ID': '库存编号',
      'Make': '品牌',
      'Model': '车型',
      'Year': '年份',
      'Andy / Eissa Sales Portal': 'Andy / Eissa 销售后台',
      'Deal desk for leads, stock, vehicle proof, route planning, and handoff scripts.': '用于线索、库存、车辆证明、路线规划和交接话术的销售成交台。',
      'Sales Deal Cockpit': '销售成交驾驶舱',
      'Public Site': '公开网站',
      'Open leads': '待跟进线索',
      'Ready to quote': '可报价',
      'Proof pending': '证明待处理',
      'Sold vehicles': '已售车辆',
      'Close Tools': '成交工具',
      'Copy WhatsApp Script': '复制 WhatsApp 话术',
      'Copy Deal Summary': '复制成交摘要',
      'Sales Script': '销售话术',
      'Back-room Notes': '内部备注',
      'Vehicle Editor': '车辆编辑器',
      'Condition': '车况',
      'New': '新车',
      'Used': '二手',
      'Old stock': '旧库存',
      'Fuel': '能源',
      'Body': '车身',
      'Drive': '驱动',
      'Back-room location': '内部位置',
      'Private VIN/frame': '内部 VIN/车架号',
      'Docs status': '文件状态',
      'Inspection status': '验车状态',
      'Image URL': '图片 URL',
      'Available': '可售',
      'Sold': '已售',
      'Archived': '已归档',
      'Sold by': '销售人员',
      'Sold price': '成交价',
      'Buyer': '买家',
      'Save Vehicle': '保存车辆',
      'Mark old vehicle SOLD': '标记旧车已售',
      'Archive Vehicle': '归档车辆',
      'Route Planner': '路线规划',
      'Destination Port': '目的港',
      'Customer urgency': '客户紧急程度',
      'Needs photos today': '今天需要照片',
      'Dealer batch': '经销商批量',
      'Close Packet': '成交包',
      'Next Action': '下一步',
      'Sales Team': '销售团队',
      'Person name': '人员姓名',
      'WhatsApp': 'WhatsApp',
      'Commission %': '佣金比例',
      'Bank / payout provider': '银行 / 收款方式',
      'Account number': '账号',
      'Payout notes': '打款备注',
      'Add / Update Salesperson': '添加 / 更新销售',
      'Store Archive Data': '存储归档数据',
      'Sold Inventory & Commission': '已售库存与佣金',
      'Track a shipment': '追踪运输',
      'Open full map': '打开完整地图',
      'Active Shipping Alerts:': '当前航运警报：'
    }
  };

  const placeholders = {
    FR: {
      'Andy, Eissa, or owner': 'Andy, Eissa ou propriétaire',
      'Search client, vehicle, country': 'Rechercher client, véhicule, pays',
      'Search stock ID, brand, model, fuel, location, docs': 'Rechercher ID stock, marque, modèle, carburant, lieu, docs',
      'Display name': 'Nom affiché',
      'e.g. Nigeria': 'ex. Nigeria',
      'your@email.com': 'votre@email.com',
      'Min 6 characters': 'Minimum 6 caractères',
      'Your password': 'Votre mot de passe',
      'Write a comment…': 'Écrire un commentaire…',
      'NV-2026-0001 / NVQ-... / NVS-...': 'NV-2026-0001 / NVQ-... / NVS-...',
      'Enter NVS code or vessel name': 'Entrer code NVS ou nom du navire',
      'Sale price': 'Prix de vente',
      'Buyer / dealer': 'Acheteur / revendeur'
    },
    AR: {
      'Andy, Eissa, or owner': 'Andy أو Eissa أو المالك',
      'Search client, vehicle, country': 'ابحث عن عميل أو سيارة أو دولة',
      'Search stock ID, brand, model, fuel, location, docs': 'ابحث برقم المخزون أو العلامة أو الموديل أو الوقود أو الموقع أو المستندات',
      'Display name': 'اسم العرض',
      'e.g. Nigeria': 'مثال: نيجيريا',
      'your@email.com': 'your@email.com',
      'Min 6 characters': '6 أحرف على الأقل',
      'Your password': 'كلمة المرور',
      'Write a comment…': 'اكتب تعليقاً…',
      'NV-2026-0001 / NVQ-... / NVS-...': 'NV-2026-0001 / NVQ-... / NVS-...',
      'Enter NVS code or vessel name': 'أدخل رمز NVS أو اسم السفينة',
      'Sale price': 'سعر البيع',
      'Buyer / dealer': 'المشتري / التاجر'
    },
    ZH: {
      'Andy, Eissa, or owner': 'Andy、Eissa 或老板',
      'Search client, vehicle, country': '搜索客户、车辆、国家',
      'Search stock ID, brand, model, fuel, location, docs': '搜索库存编号、品牌、车型、能源、位置、文件',
      'Display name': '显示名称',
      'e.g. Nigeria': '例如 Nigeria',
      'your@email.com': 'your@email.com',
      'Min 6 characters': '至少 6 个字符',
      'Your password': '你的密码',
      'Write a comment…': '写评论…',
      'NV-2026-0001 / NVQ-... / NVS-...': 'NV-2026-0001 / NVQ-... / NVS-...',
      'Enter NVS code or vessel name': '输入 NVS 编号或船名',
      'Sale price': '成交价',
      'Buyer / dealer': '买家 / 经销商'
    }
  };

  function normalizeLang(value) {
    const v = String(value || '').trim().toUpperCase();
    if (v === 'ZH-CN' || v === 'CN' || v === '中文') return 'ZH';
    if (v.startsWith('AR')) return 'AR';
    if (v.startsWith('FR')) return 'FR';
    if (v.startsWith('ZH')) return 'ZH';
    return LANGS.includes(v) ? v : 'EN';
  }

  function detectLang() {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('lang');
    if (fromUrl) return normalizeLang(fromUrl);
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return normalizeLang(saved);
    } catch (_) {}
    return 'EN';
  }

  function tr(text) {
    const raw = String(text || '');
    if (currentLang === 'EN') return raw;
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (!trimmed) return raw;
    const dict = phrase[currentLang] || {};
    if (dict[trimmed]) return raw.replace(trimmed, dict[trimmed]);
    return raw;
  }

  function trAttr(text) {
    const raw = String(text || '');
    if (currentLang === 'EN') return raw;
    const p = placeholders[currentLang] || {};
    return p[raw] || tr(raw);
  }

  function translateTextNode(node) {
    const original = node.__nvOriginalText || node.nodeValue;
    if (!node.__nvOriginalText) node.__nvOriginalText = original;
    node.nodeValue = currentLang === 'EN' ? original : tr(original);
  }

  function translateElement(el) {
    if (!el || el.nodeType !== 1 || HTML_TEXT_TAGS.has(el.tagName) || el.closest('[data-nv-i18n-skip],script,style,noscript')) return;
    if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-html') || el.hasAttribute('data-i18n-placeholder')) return;
    for (const attr of ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      const key = `__nvOriginal_${attr}`;
      const original = el[key] || el.getAttribute(attr);
      if (!el[key]) el[key] = original;
      if (attr === 'value' && !['BUTTON', 'INPUT'].includes(el.tagName)) continue;
      if (attr === 'value' && el.tagName === 'INPUT' && !['button', 'submit', 'reset'].includes((el.type || '').toLowerCase())) continue;
      el.setAttribute(attr, currentLang === 'EN' ? original : trAttr(original));
    }
    for (const node of el.childNodes) {
      if (node.nodeType === 3) translateTextNode(node);
    }
  }

  function applyTree(root) {
    if (applying) return;
    applying = true;
    try {
      const scope = root && root.nodeType === 1 ? root : document.body;
      if (!scope) return;
      if (scope.nodeType === 1) translateElement(scope);
      scope.querySelectorAll('*').forEach(translateElement);
      document.documentElement.lang = currentLang.toLowerCase() === 'zh' ? 'zh-CN' : currentLang.toLowerCase();
      document.documentElement.dir = currentLang === 'AR' ? 'rtl' : 'ltr';
      document.querySelectorAll('[data-nv-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nvLang === currentLang);
        btn.setAttribute('aria-pressed', btn.dataset.nvLang === currentLang ? 'true' : 'false');
      });
      preserveLangLinks();
    } finally {
      applying = false;
    }
  }

  function css() {
    if (document.getElementById('nv-i18n-style')) return;
    const s = document.createElement('style');
    s.id = 'nv-i18n-style';
    s.textContent = `
      .nv-language-switch{display:inline-flex;align-items:center;gap:4px;margin-left:8px;position:relative;z-index:10000}
      .nv-language-switch.floating{position:fixed;top:10px;right:10px;margin:0;background:rgba(10,28,16,.88);border:1px solid rgba(76,175,80,.35);border-radius:10px;padding:5px;box-shadow:0 10px 24px rgba(0,0,0,.22)}
      .nv-language-switch button{min-width:34px;height:32px;border-radius:7px;border:1px solid rgba(76,175,80,.35);background:rgba(255,255,255,.08);color:inherit;font:800 11px/1 system-ui,sans-serif;cursor:pointer;padding:0 7px}
      .nv-language-switch button.active,.nv-language-switch button:hover{background:#2E7D32;color:#fff;border-color:#43A047}
      html[dir="rtl"] body{text-align:right}
      html[dir="rtl"] .nav,html[dir="rtl"] nav,html[dir="rtl"] header{direction:rtl}
      @media(max-width:720px){.nv-language-switch{width:100%;margin:8px 0 0;justify-content:flex-start}.nv-language-switch button{height:34px}}
    `;
    document.head.appendChild(s);
  }

  function injectControls() {
    if (document.querySelector('.nv-language-switch')) return;
    css();
    const wrap = document.createElement('div');
    wrap.className = 'nv-language-switch';
    wrap.setAttribute('aria-label', 'Language');
    wrap.setAttribute('data-nv-i18n-skip', 'true');
    wrap.innerHTML = LANGS.map(l => `<button type="button" data-nv-lang="${l}" aria-pressed="false">${LABELS[l]}</button>`).join('');
    wrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-nv-lang]');
      if (btn) setLang(btn.dataset.nvLang);
    });
    const target = document.querySelector('header .nav, nav .nav, .topbar .nav, header nav, nav, header') || document.body;
    target.appendChild(wrap);
    if (!wrap.getClientRects().length) {
      wrap.classList.add('floating');
      document.body.insertBefore(wrap, document.body.firstChild);
    }
  }

  function preserveLangLinks() {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('https://wa.me')) return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (currentLang === 'EN') url.searchParams.delete('lang');
        else url.searchParams.set('lang', currentLang.toLowerCase());
        const leaf = url.pathname.split('/').pop();
        a.setAttribute('href', (leaf || './') + url.search + url.hash);
        if (href.startsWith('./') && !a.getAttribute('href').startsWith('./') && !a.getAttribute('href').startsWith('#')) {
          a.setAttribute('href', './' + a.getAttribute('href'));
        }
      } catch (_) {}
    });
  }

  function setLang(lang) {
    currentLang = normalizeLang(lang);
    try { localStorage.setItem(STORE_KEY, currentLang); } catch (_) {}
    if (wrappedPageSetLang && wrappedPageSetLang !== setLang) {
      try {
        const btn = document.querySelector(`.lang-btn[data-lang="${currentLang}"],.mobile-lang-choice[data-lang-choice="${currentLang}"]`);
        wrappedPageSetLang(currentLang, btn);
      } catch (_) {}
    }
    applyTree(document.body);
    window.dispatchEvent(new CustomEvent('newvision:langchange', { detail: { lang: currentLang } }));
  }

  function observe() {
    const mo = new MutationObserver(records => {
      if (applying) return;
      for (const r of records) {
        r.addedNodes.forEach(n => {
          if (n.nodeType === 1) applyTree(n);
          if (n.nodeType === 3) translateTextNode(n);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    wrappedPageSetLang = typeof window.setLang === 'function' ? window.setLang : null;
    window.NewVisionI18n = { setLang, apply: () => applyTree(document.body), t: tr, current: () => currentLang, languages: LANGS };
    window.setLang = setLang;
    currentLang = detectLang();
    injectControls();
    applyTree(document.body);
    observe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
