const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Модель по умолчанию — 'automatic' (бесплатная). Админ может переопределить через
// SystemSetting.aiModel на любую доступную, в т.ч. бесплатную.
const DEFAULT_MODEL = 'automatic';

const LANG_WORD = { ru: 'русском', be: 'беларускай', pl: 'polskim', uk: 'українській', en: 'English', de: 'Deutsch' };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' });

    const body = await req.json().catch(() => ({}));
    const description = (body?.description || '').toString().trim();
    const currency = (body?.currency || 'RUB').toString();
    const language = (body?.language || 'ru').toString();
    if (!description || description.length < 5) {
      return Response.json({ ok: false, error: 'Описание слишком короткое' });
    }

    let model = DEFAULT_MODEL;
    try {
      const settings = await db.asServiceRole.entities.SystemSetting.filter({ key: 'aiModel' });
      if (settings[0]?.value) model = settings[0].value;
    } catch {}

    const categories = await db.asServiceRole.entities.Category.list();
    const catList = categories
      .filter(c => !c.isArchived)
      .map(c => `${c.code} — ${c.name}`)
      .join('\n');

    const prompt = [
      'Ты — ассистент сервиса бытовых и деловых заказов «НАРЯД».',
      'На основе описания задачи предложи структуру наряда.',
      'Доступные категории (используй поле code как categoryId):',
      catList,
      '',
      `Описание задачи: "${description}"`,
      `Валюта для оценки цены: ${currency}.`,
      `Уточняющие вопросы задавай на языке: ${LANG_WORD[language] || 'русском'}.`,
      '',
      'Верни JSON со следующими полями:',
      'categoryId — code подходящей категории из списка выше;',
      'specialties — массив строк (узкие специализации);',
      'estimatedComplexity — low | medium | high;',
      `estimatedCost — объект { min, max, currency:"${currency}" };`,
      'estimatedDurationDays — число дней;',
      'clarifyingQuestions — массив уточняющих вопросов на указанном языке;',
      'confidence — число от 0 до 1.',
      'Не выдумывай категории, не вошедшие в список.'
    ].join('\n');

    const schema = {
      type: 'object',
      properties: {
        categoryId: { type: 'string' },
        specialties: { type: 'array', items: { type: 'string' } },
        estimatedComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
        estimatedCost: {
          type: 'object',
          properties: { min: { type: 'number' }, max: { type: 'number' }, currency: { type: 'string' } }
        },
        estimatedDurationDays: { type: 'number' },
        clarifyingQuestions: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number' }
      }
    };

    const result = await db.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      model
    });

    return Response.json({ ok: true, suggestion: result });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}