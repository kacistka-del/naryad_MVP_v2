// Страны, валюты, города и языки для НАРЯД — международный сервис.

export const LANGUAGES = [
  { code: "ru", label: "Русский", intl: "ru-RU" },
  { code: "be", label: "Беларуская", intl: "be-BY" },
  { code: "pl", label: "Polski", intl: "pl-PL" },
  { code: "uk", label: "Українська", intl: "uk-UA" },
  { code: "en", label: "English", intl: "en-US" },
  { code: "de", label: "Deutsch", intl: "de-DE" },
];

export const CURRENCIES = {
  RUB: { code: "RUB", symbol: "₽", label: { ru: "Рубль", be: "Рубель", pl: "Rubel", uk: "Карбованець", en: "Ruble", de: "Rubel" } },
  BYN: { code: "BYN", symbol: "Br", label: { ru: "Бел. рубль", be: "Беларускі рубель", pl: "Rubel białoruski", uk: "Біл. рубль", en: "Belarusian ruble", de: "Belarusischer Rubel" } },
  PLN: { code: "PLN", symbol: "zł", label: { ru: "Злотый", be: "Злоты", pl: "Złoty", uk: "Злотий", en: "Zloty", de: "Złoty" } },
  UAH: { code: "UAH", symbol: "₴", label: { ru: "Гривна", be: "Грыўня", pl: "Hrywna", uk: "Гривня", en: "Hryvnia", de: "Hrywnja" } },
  KZT: { code: "KZT", symbol: "₸", label: { ru: "Тенге", be: "Тэнге", pl: "Tenge", uk: "Тенге", en: "Tenge", de: "Tenge" } },
  EUR: { code: "EUR", symbol: "€", label: { ru: "Евро", be: "Еўра", pl: "Euro", uk: "Євро", en: "Euro", de: "Euro" } },
  USD: { code: "USD", symbol: "$", label: { ru: "Доллар", be: "Долар", pl: "Dolar", uk: "Долар", en: "Dollar", de: "Dollar" } },
  GBP: { code: "GBP", symbol: "£", label: { ru: "Фунт", be: "Фунт", pl: "Funt", uk: "Фунт", en: "Pound", de: "Pfund" } },
};

export const COUNTRIES = [
  {
    code: "RU", currency: "RUB", phone: "+7",
    name: { ru: "Россия", be: "Расія", pl: "Rosja", uk: "Росія", en: "Russia", de: "Russland" },
    cities: ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Краснодар", "Самара", "Ростов-на-Дону", "Уфа", "Воронеж", "Пермь"],
  },
  {
    code: "BY", currency: "BYN", phone: "+375",
    name: { ru: "Беларусь", be: "Беларусь", pl: "Białoruś", uk: "Білорусь", en: "Belarus", de: "Belarus" },
    cities: ["Минск", "Гомель", "Могилёв", "Витебск", "Гродно", "Брест", "Бобруйск", "Барановичи"],
  },
  {
    code: "PL", currency: "PLN", phone: "+48",
    name: { ru: "Польша", be: "Польшча", pl: "Polska", uk: "Польща", en: "Poland", de: "Polen" },
    cities: ["Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Lublin", "Katowice", "Białystok", "Bydgoszcz"],
  },
  {
    code: "UA", currency: "UAH", phone: "+380",
    name: { ru: "Украина", be: "Украіна", pl: "Ukraina", uk: "Україна", en: "Ukraine", de: "Ukraine" },
    cities: ["Київ", "Львів", "Одеса", "Дніпро", "Харків", "Запоріжжя", "Вінниця", "Полтава"],
  },
  {
    code: "KZ", currency: "KZT", phone: "+7",
    name: { ru: "Казахстан", be: "Казахстан", pl: "Kazachstan", uk: "Казахстан", en: "Kazakhstan", de: "Kasachstan" },
    cities: ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Павлодар"],
  },
  {
    code: "DE", currency: "EUR", phone: "+49",
    name: { ru: "Германия", be: "Германія", pl: "Niemcy", uk: "Німеччина", en: "Germany", de: "Deutschland" },
    cities: ["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Leipzig", "Düsseldorf"],
  },
  {
    code: "OTHER_EU", currency: "EUR", phone: "+",
    name: { ru: "Другое (ЕС)", be: "Іншае (ЕС)", pl: "Inne (UE)", uk: "Інше (ЄС)", en: "Other (EU)", de: "Andere (EU)" },
    cities: ["—"],
  },
  {
    code: "OTHER", currency: "USD", phone: "+",
    name: { ru: "Другое", be: "Іншае", pl: "Inne", uk: "Інше", en: "Other", de: "Andere" },
    cities: ["—"],
  },
];

export function getCountry(code) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}

export function getCurrency(code) {
  return CURRENCIES[code] || CURRENCIES.USD;
}

export function currencyLabel(code, locale) {
  const c = getCurrency(code);
  return c.label[locale] || c.label.en || c.label.ru || code;
}

export function formatMoney(amount, currency, locale = "ru") {
  if (amount == null || isNaN(Number(amount))) return "";
  const intl = LANGUAGES.find((l) => l.code === locale)?.intl || "en-US";
  try {
    return new Intl.NumberFormat(intl, { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${amount} ${getCurrency(currency).symbol}`;
  }
}