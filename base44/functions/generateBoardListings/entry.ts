const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Модель с поддержкой веб-поиска (add_context_from_internet).
const WEB_MODEL = 'gemini_3_flash';
const FALLBACK_MODEL = 'automatic';
const SOURCE_LABEL = 'Веб-импорт';

// География для автоматического наполнения (старна → валюта + города)
const COUNTRIES = [
  { code: 'RU', currency: 'RUB', cities: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Казань'] },
  { code: 'BY', currency: 'BYN', cities: ['Минск', 'Гомель'] },
  { code: 'PL', currency: 'PLN', cities: ['Warszawa', 'Kraków', 'Wrocław'] },
  { code: 'UA', currency: 'UAH', cities: ['Київ', 'Львів', 'Одеса'] },
  { code: 'KZ', currency: 'KZT', cities: ['Алматы', 'Астана'] },
  { code: 'DE', currency: 'EUR', cities: ['Berlin', 'München', 'Hamburg'] },
];

const countryMeta = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

async function fetchListingsForCity(base44, { country, city, currency, categoryCode, count, existing }) {
  const meta = countryMeta(country);
  const cur = currency || meta.currency;
  const cats = await db.asServiceRole.entities.Category.list();
  const catList = cats.filter((c) => !c.isArchived).map((c) => c.code).join(', ');

  const dupHint = existing.length
    ? `Уже есть объявления (не дублируй их по заголовку+городу): ${existing.slice(0, 40).map((e) => `${e.title} (${e.city})`).join('; ')}.`
    : '';

  const prompt = [
    'Ты — парсер биржи бытовых и деловых услуг «НАРЯД».',
    `Используя актуальные данные из интернета, найди реальные объявления об услугах.`,
    `Страна: ${country}. Город: ${city || 'любой крупный город страны'}.`,
    `Категория (code): ${categoryCode || 'любая из списка'}.`,
    `Валюта цен: ${cur}.`,
    `Доступные коды категорий: ${catList}.`,
    `Нужно объявлений: ${count}.`,
    dupHint,
    '',
    'Верни JSON { listings: [ { title, description, categoryCode, city, price, priceMax, sourceName, sourceUrl } ] }.',
    'title — короткий заголовок на языке, типичном для страны (опирайся на реальные объявления).',
    'description — 1-2 предложения, реалистичное объявление.',
    'city — реальный город указанной страны.',
    'price/priceMax — числа в указанной валюте (priceMax может быть null).',
    'categoryCode — только из списка выше.',
    'sourceName — название сайта-источника (например «Авито», «OLX», «Fixly»), sourceUrl — ссылка если есть, иначе пустая строка.',
    'Не выдумывай города, которых нет в стране. Не дублируй уже существующие.'
  ].filter(Boolean).join('\n');

  const schema = {
    type: 'object',
    properties: {
      listings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            categoryCode: { type: 'string' },
            city: { type: 'string' },
            price: { type: 'number' },
            priceMax: { type: 'number' },
            sourceName: { type: 'string' },
            sourceUrl: { type: 'string' }
          },
          required: ['title', 'categoryCode', 'city', 'price']
        }
      }
    }
  };

  let result;
  try {
    result = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      add_context_from_internet: true,
      model: WEB_MODEL
    });
  } catch (e) {
    // fallback без веб-поиска
    result = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      model: FALLBACK_MODEL
    });
  }

  return (result?.listings || [])
    .filter((l) => l.title && l.categoryCode)
    .map((l) => ({
      title: l.title,
      description: l.description || '',
      categoryCode: l.categoryCode,
      country,
      city: l.city || city || '—',
      currency: cur,
      price: Number(l.price) || null,
      priceMax: l.priceMax != null ? Number(l.priceMax) : null,
      sourceName: l.sourceName || SOURCE_LABEL,
      sourceUrl: l.sourceUrl || '',
      isSeed: true,
      status: 'ACTIVE'
    }));
}

function dedupe(listings, existing) {
  const seen = new Set(existing.map((e) => `${(e.title || '').toLowerCase().trim()}|${(e.city || '').toLowerCase().trim()}`));
  const out = [];
  for (const l of listings) {
    const key = `${(l.title || '').toLowerCase().trim()}|${(l.city || '').toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Запуск по расписанию — без пользователя. Ручной запуск — только админ.
    let user = null;
    try { user = await db.auth.me(); } catch {}
    if (user && user.role !== 'admin') {
      return Response.json({ ok: false, error: 'Только для администратора' });
    }

    const body = await req.json().catch(() => ({})) || {};
    const isScheduled = !user;

    const existing = await db.asServiceRole.entities.BoardListing.filter({ status: 'ACTIVE' }, '-created_date', 200);

    let createdTotal = 0;
    const audit = async (details) => {
      await db.asServiceRole.entities.AdminAuditLog.create({
        adminId: user?.id || 'SYSTEM',
        action: 'IMPORT_BOARD',
        entity: 'BoardListing',
        entityId: 'web',
        details
      }).catch(() => {});
    };

    if (isScheduled) {
      // Автоматический импорт: ротация стран по дню недели, чтобы покрывать все города
      const dayIdx = new Date().getDay() % COUNTRIES.length;
      const targets = [COUNTRIES[dayIdx], COUNTRIES[(dayIdx + 1) % COUNTRIES.length]];
      for (const c of targets) {
        for (const city of c.cities) {
          const raw = await fetchListingsForCity(base44, { country: c.code, city, currency: c.currency, categoryCode: '', count: 5, existing });
          const fresh = dedupe(raw, existing);
          if (fresh.length) {
            await db.asServiceRole.entities.BoardListing.bulkCreate(fresh);
            existing.push(...fresh);
            createdTotal += fresh.length;
          }
        }
      }
      await audit(`Авто-импорт (web): добавлено ${createdTotal} объявлений`);
      return Response.json({ ok: true, created: createdTotal, scheduled: true });
    }

    // Ручной запуск админом: для указанных страны/города/категории
    const country = (body.country || 'RU').toString();
    const city = (body.city || '').toString();
    const categoryCode = (body.categoryCode || '').toString();
    const currency = (body.currency || countryMeta(country).currency).toString();
    const count = Math.min(Math.max(Number(body.count) || 8, 1), 20);

    const raw = await fetchListingsForCity(base44, { country, city, currency, categoryCode, count, existing });
    const fresh = dedupe(raw, existing);
    if (fresh.length) {
      await db.asServiceRole.entities.BoardListing.bulkCreate(fresh);
    }
    createdTotal = fresh.length;
    await audit(`Ручной импорт (web): ${createdTotal} объявлений (${country}/${city || 'all'}${categoryCode ? '/' + categoryCode : ''})`);
    return Response.json({ ok: true, created: createdTotal, skipped: raw.length - fresh.length });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}