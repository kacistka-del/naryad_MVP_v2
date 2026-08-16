// Расширенное дерево категорий НАРЯД.
// Уклон — клиент пишет задачу словами, AI (structureOrder) подбирает категорию.
// name — локализованные названия; отсутствующие локали падают на ru → en.

export const CATEGORY_GROUPS = [
  { code: "HOME", label: { ru: "Дом и ремонт", be: "Дом і рамонт", pl: "Dom i remont", uk: "Дім і ремонт", en: "Home & repair", de: "Haus & Reparatur" } },
  { code: "TECH", label: { ru: "Ремонт техники", be: "Рамонт тэхнікі", pl: "Naprawa sprzętu", uk: "Ремонт техніки", en: "Appliance repair", de: "Gerätereparatur" } },
  { code: "BEAUTY", label: { ru: "Красота и здоровье", be: "Прыгажосць і здароўе", pl: "Uroda i zdrowie", uk: "Краса і здоров'я", en: "Beauty & health", de: "Schönheit & Gesundheit" } },
  { code: "TRANSPORT", label: { ru: "Транспорт и переезды", be: "Транспарт і пераезды", pl: "Transport i przeprowadzki", uk: "Транспорт і переїзди", en: "Transport & moving", de: "Transport & Umzug" } },
  { code: "BIZ", label: { ru: "Деловые услуги", be: "Дзелавыя паслугі", pl: "Usługi biznesowe", uk: "Ділові послуги", en: "Business services", de: "Geschäftsdienste" } },
  { code: "DIGITAL", label: { ru: "IT и digital", be: "ІТ і digital", pl: "IT i digital", uk: "IT та digital", en: "IT & digital", de: "IT & Digital" } },
  { code: "LEARN", label: { ru: "Обучение", be: "Навучанне", pl: "Edukacja", uk: "Навчання", en: "Learning", de: "Lernen" } },
  { code: "EVENT", label: { ru: "Мероприятия", be: "Мерапрыемствы", pl: "Wydarzenia", uk: "Заходи", en: "Events", de: "Veranstaltungen" } },
  { code: "DELIVERY", label: { ru: "Доставка и грузы", be: "Дастаўка і грузы", pl: "Dostawa i ładunki", uk: "Доставка та вантажі", en: "Delivery & cargo", de: "Lieferung & Fracht" } },
  { code: "CARE", label: { ru: "Уход и присмотр", be: "Догляд і нагляд", pl: "Opieka", uk: "Догляд та нагляд", en: "Care & sitting", de: "Betreuung" } },
  { code: "GARDEN", label: { ru: "Сад и участок", be: "Сад і ўчастак", pl: "Ogród i działka", uk: "Сад та ділянка", en: "Garden & plot", de: "Garten & Grundstück" } },
  { code: "OTHER", label: { ru: "Прочее", be: "Іншае", pl: "Inne", uk: "Інше", en: "Other", de: "Sonstiges" } },
];

export const CATEGORIES = [
  { code: "РЕМ", group: "HOME", icon: "Hammer", name: { ru: "Ремонт квартир", be: "Рамонт кватэр", pl: "Remont mieszkań", uk: "Ремонт квартир", en: "Apartment renovation", de: "Wohnungsrenovierung" } },
  { code: "САН", group: "HOME", icon: "Wrench", name: { ru: "Сантехника", be: "Сантэхніка", pl: "Hydraulika", uk: "Сантехніка", en: "Plumbing", de: "Sanitär" } },
  { code: "ЭЛЕ", group: "HOME", icon: "Plug", name: { ru: "Электрика", be: "Электрыка", pl: "Elektryka", uk: "Електрика", en: "Electrical", de: "Elektrik" } },
  { code: "ОТД", group: "HOME", icon: "PaintRoller", name: { ru: "Отделочные работы", be: "Аздабленчныя работы", pl: "Wykończenia", uk: "Оздоблювальні роботи", en: "Finishing works", de: "Innenausbau" } },
  { code: "СТР", group: "HOME", icon: "Building2", name: { ru: "Строительство", be: "Будаўніцтва", pl: "Budownictwo", uk: "Будівництво", en: "Construction", de: "Bauwesen" } },
  { code: "МЕБ", group: "HOME", icon: "Armchair", name: { ru: "Сборка мебели", be: "Зборка мэблі", pl: "Montaż mebli", uk: "Збірка меблів", en: "Furniture assembly", de: "Möbelmontage" } },
  { code: "ОКН", group: "HOME", icon: "RectangleVertical", name: { ru: "Окна и двери", be: "Вакна і дзверы", pl: "Okna i drzwi", uk: "Вікна та двері", en: "Windows & doors", de: "Fenster & Türen" } },
  { code: "ЗАМ", group: "HOME", icon: "KeyRound", name: { ru: "Замки и ключи", be: "Замкі і ключы", pl: "Zamki i klucze", uk: "Замки та ключі", en: "Locks & keys", de: "Schlösser & Schlüssel" } },
  { code: "КЛИ", group: "HOME", icon: "Sparkles", name: { ru: "Клининг", be: "Клінінг", pl: "Sprzątanie", uk: "Клінінг", en: "Cleaning", de: "Reinigung" } },
  { code: "ЛАН", group: "HOME", icon: "Pickaxe", name: { ru: "Ландшафт и участок", be: "Ландшафт і ўчастак", pl: "Ogród i teren", uk: "Ландшафт та ділянка", en: "Landscaping", de: "Landschaft" } },

  { code: "БТХ", group: "TECH", icon: "Refrigerator", name: { ru: "Бытовая техника", be: "Побытавая тэхніка", pl: "AGD", uk: "Побутова техніка", en: "Home appliances", de: "Haushaltsgeräte" } },
  { code: "ЭЛК", group: "TECH", icon: "Cpu", name: { ru: "Электроника", be: "Электроніка", pl: "Elektronika", uk: "Електроніка", en: "Electronics", de: "Elektronik" } },
  { code: "АВТ", group: "TECH", icon: "Car", name: { ru: "Автосервис", be: "Аўтасэрвіс", pl: "Autoserwis", uk: "Автосервіс", en: "Auto repair", de: "Autowerkstatt" } },
  { code: "КОМ", group: "TECH", icon: "MonitorSmartphone", name: { ru: "Компьютеры", be: "Камп'ютары", pl: "Komputery", uk: "Комп'ютери", en: "Computers", de: "Computer" } },
  { code: "ТЕЛ", group: "TECH", icon: "Smartphone", name: { ru: "Телефоны", be: "Тэлефоны", pl: "Telefony", uk: "Телефони", en: "Phones", de: "Telefone" } },
  { code: "ПОЧ", group: "TECH", icon: "Shirt", name: { ru: "Ремонт одежды и обуви", be: "Рамонт адзення і абутку", pl: "Naprawa odzieży i obuwia", uk: "Ремонт одягу та взуття", en: "Clothing & shoe repair", de: "Kleidungs-/Schuhreparatur" } },

  { code: "КРА", group: "BEAUTY", icon: "Scissors", name: { ru: "Парикмахер, визажист", be: "Цырульнік, візажыст", pl: "Fryzjer, wizażysta", uk: "Перукар, візажист", en: "Hair & makeup", de: "Friseur & Visagist" } },
  { code: "МАС", group: "BEAUTY", icon: "HandHeart", name: { ru: "Массаж", be: "Масаж", pl: "Masaż", uk: "Масаж", en: "Massage", de: "Massage" } },
  { code: "ТРН", group: "BEAUTY", icon: "Dumbbell", name: { ru: "Тренер", be: "Трэнер", pl: "Trener", uk: "Тренер", en: "Personal trainer", de: "Trainer" } },
  { code: "ЗДВ", group: "BEAUTY", icon: "HeartPulse", name: { ru: "Здоровье и сопровождение", be: "Здароўе і суправаджэнне", pl: "Zdrowie i opieka", uk: "Здоров'я та супровід", en: "Health & care", de: "Gesundheit & Betreuung" } },

  { code: "ПЕР", group: "TRANSPORT", icon: "Truck", name: { ru: "Перевозки и переезды", be: "Перавозкі і пераезды", pl: "Transport i przeprowadzki", uk: "Перевезення та переїзди", en: "Moving & hauling", de: "Transport & Umzug" } },
  { code: "ГРУ", group: "TRANSPORT", icon: "Package", name: { ru: "Грузчики", be: "Грузчыкі", pl: "Tragarze", uk: "Вантажники", en: "Movers", de: "Hilfskräfte" } },
  { code: "ВОЖ", group: "TRANSPORT", icon: "CarFront", name: { ru: "Личный водитель", be: "Асабісты кіроўца", pl: "Kierowca prywatny", uk: "Особистий водій", en: "Personal driver", de: "Privatfahrer" } },
  { code: "ЭВА", group: "TRANSPORT", icon: "LifeBuoy", name: { ru: "Эвакуатор", be: "Эвакуатар", pl: "Pomoc drogowa", uk: "Евакуатор", en: "Tow truck", de: "Abschleppwagen" } },

  { code: "БУХ", group: "BIZ", icon: "Calculator", name: { ru: "Бухгалтерия", be: "Бухгалтэрыя", pl: "Księgowość", uk: "Бухоблік", en: "Accounting", de: "Buchhaltung" } },
  { code: "ЮРД", group: "BIZ", icon: "Scale", name: { ru: "Юрист", be: "Юрыст", pl: "Prawnik", uk: "Юрист", en: "Legal", de: "Recht" } },
  { code: "ПЕРВ", group: "BIZ", icon: "Languages", name: { ru: "Переводчик", be: "Перакладчык", pl: "Tłumacz", uk: "Перекладач", en: "Translator", de: "Dolmetscher" } },
  { code: "РЕГ", group: "BIZ", icon: "FileText", name: { ru: "Регистрация бизнеса", be: "Рэгістрацыя бізнесу", pl: "Rejestracja firmy", uk: "Реєстрація бізнесу", en: "Business registration", de: "Firmengründung" } },
  { code: "КОН", group: "BIZ", icon: "Briefcase", name: { ru: "Консультации", be: "Кансультацыі", pl: "Konsultacje", uk: "Консультації", en: "Consulting", de: "Beratung" } },

  { code: "САЙ", group: "DIGITAL", icon: "Globe", name: { ru: "Сайты", be: "Сайты", pl: "Strony WWW", uk: "Сайти", en: "Websites", de: "Webseiten" } },
  { code: "РАЗ", group: "DIGITAL", icon: "Code2", name: { ru: "Разработка ПО", be: "Распрацоўка ПЗ", pl: "Tworzenie oprogramowania", uk: "Розробка ПЗ", en: "Software dev", de: "Softwareentwicklung" } },
  { code: "ДИЗ", group: "DIGITAL", icon: "PenTool", name: { ru: "Дизайн", be: "Дызайн", pl: "Projektowanie", uk: "Дизайн", en: "Design", de: "Design" } },
  { code: "СЕО", group: "DIGITAL", icon: "BarChart3", name: { ru: "Маркетинг и SEO", be: "Маркетынг і SEO", pl: "Marketing i SEO", uk: "Маркетинг та SEO", en: "Marketing & SEO", de: "Marketing & SEO" } },
  { code: "ФОТ", group: "DIGITAL", icon: "Camera", name: { ru: "Фото и видео", be: "Фота і відэа", pl: "Foto i wideo", uk: "Фото та відео", en: "Photo & video", de: "Foto & Video" } },
  { code: "АДМ", group: "DIGITAL", icon: "Server", name: { ru: "Сисадмин", be: "Сісадмін", pl: "Admin IT", uk: "Сисадмін", en: "Sysadmin", de: "Sysadmin" } },

  { code: "РЕП", group: "LEARN", icon: "GraduationCap", name: { ru: "Репетитор", be: "Рэпетітор", pl: "Korepetytor", uk: "Репетитор", en: "Tutoring", de: "Nachhilfe" } },
  { code: "ЯЗК", group: "LEARN", icon: "BookOpen", name: { ru: "Языки", be: "Мовы", pl: "Języki", uk: "Мови", en: "Languages", de: "Sprachen" } },
  { code: "МУЗ", group: "LEARN", icon: "Music", name: { ru: "Музыка", be: "Музыка", pl: "Muzyka", uk: "Музика", en: "Music", de: "Musik" } },
  { code: "ВОД", group: "LEARN", icon: "Car", name: { ru: "Вождение", be: "Ваджэнне", pl: "Jazda", uk: "Водіння", en: "Driving lessons", de: "Fahrunterricht" } },

  { code: "ВЕД", group: "EVENT", icon: "Mic", name: { ru: "Ведущий", be: "Вядучы", pl: "Prowadzący", uk: "Ведучий", en: "MC / host", de: "Moderator" } },
  { code: "ОРГ", group: "EVENT", icon: "PartyPopper", name: { ru: "Организация мероприятий", be: "Арганізацыя мерапрыемстваў", pl: "Organizacja wydarzeń", uk: "Організація заходів", en: "Event planning", de: "Eventplanung" } },
  { code: "КЕЙ", group: "EVENT", icon: "Utensils", name: { ru: "Кейтеринг", be: "Кейтерынг", pl: "Catering", uk: "Кейтеринг", en: "Catering", de: "Catering" } },
  { code: "ФОТ0", group: "EVENT", icon: "Camera", name: { ru: "Фотограф на мероприятие", be: "Фотограф на мерапрыемства", pl: "Fotograf na wydarzenie", uk: "Фотограф на захід", en: "Event photographer", de: "Eventfotograf" } },

  { code: "КУР", group: "DELIVERY", icon: "Bike", name: { ru: "Курьер", be: "Кур'ер", pl: "Kurier", uk: "Кур'єр", en: "Courier", de: "Kurier" } },
  { code: "ДОС", group: "DELIVERY", icon: "ShoppingBasket", name: { ru: "Доставка продуктов", be: "Дастаўка прадуктаў", pl: "Dostawa produktów", uk: "Доставка продуктів", en: "Grocery delivery", de: "Lebensmittellieferung" } },

  { code: "НЯН", group: "CARE", icon: "Baby", name: { ru: "Няня", be: "Няня", pl: "Niania", uk: "Няня", en: "Nanny", de: "Kindermädchen" } },
  { code: "СИД", group: "CARE", icon: "HeartHandshake", name: { ru: "Сиделка", be: "Сядзелка", pl: "Opiekunka", uk: "Сиділка", en: "Caregiver", de: "Pflegekraft" } },
  { code: "ПЕТ", group: "CARE", icon: "PawPrint", name: { ru: "Зооуслуги", be: "Зааўслуги", pl: "Usługi dla zwierząt", uk: "Зоопослуги", en: "Pet services", de: "Tierdienstleistungen" } },

  { code: "САД", group: "GARDEN", icon: "Trees", name: { ru: "Садовник", be: "Садоўнік", pl: "Ogrodnik", uk: "Садівник", en: "Gardener", de: "Gärtner" } },
  { code: "РУБ", group: "GARDEN", icon: "Axe", name: { ru: "Заготовка дров", be: "Загатоўка дроў", pl: "Rąbienie drewna", uk: "Заготівля дров", en: "Firewood", de: "Brennholz" } },
  { code: "ОЧ", group: "GARDEN", icon: "Leaf", name: { ru: "Уборка участка", be: "Уборка ўчастка", pl: "Porządkowanie terenu", uk: "Прибрання ділянки", en: "Plot clearing", de: "Grundstückspflege" } },

  { code: "РАЗН", group: "OTHER", icon: "MoreHorizontal", name: { ru: "Разное", be: "Разное", pl: "Inne", uk: "Різне", en: "Other", de: "Sonstiges" } },
];

export function categoryName(code, locale) {
  const c = CATEGORIES.find((x) => x.code === code);
  if (!c) return code;
  return c.name[locale] || c.name.ru || c.name.en || code;
}

export function categoryIcon(code) {
  return CATEGORIES.find((x) => x.code === code)?.icon || "MoreHorizontal";
}

export function groupLabel(groupCode, locale) {
  const g = CATEGORY_GROUPS.find((x) => x.code === groupCode);
  return g ? (g.label[locale] || g.label.ru || g.label.en) : groupCode;
}