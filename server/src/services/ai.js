import 'dotenv/config';

/**
 * 🤖 AI Service для классификации заказов и ассистента
 * Поддерживает Ollama (локальный), OpenAI, и fallback на правила
 */

const PROVIDERS = (process.env.AI_PROVIDERS || 'ollama,openai_compatible,rules').split(',').map(s => s.trim());
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';
const AI_TIMEOUT = Number(process.env.AI_TIMEOUT_MS || 20000);

export class AIService {
  /**
   * Классифицировать заказ автоматически
   */
  static async classifyOrder(order) {
    const prompt = `Классифицируй заказ по категории. Возвращай ТОЛЬКО название категории.
    
Заказ: "${order.title}"
Описание: "${order.description || ''}"
Бюджет: ${order.budget || '?'}

Возможные категории: Сантехника, Электричество, Ремонт квартиры, Уборка, Мебель, Окна и двери, Кровля, Фасад

Категория:`;

    const response = await this.query(prompt, { max_tokens: 50 });
    return response?.trim() || order.category || 'Ремонт квартиры';
  }

  /**
   * Рекомендовать исполнителей по заказу
   */
  static async suggestExecutors(order) {
    const prompt = `На основе заказа, дай краткие критерии выбора исполнителя.

Заказ: "${order.title}"
Категория: ${order.category}
Описание: "${order.description || ''}"

Ответ в формате JSON:
{"skills": ["skill1", "skill2"], "experience_min_years": 1, "rating_min": 4.0}`;

    const response = await this.query(prompt, { max_tokens: 200 });
    try {
      return JSON.parse(response);
    } catch {
      return { skills: [order.category], experience_min_years: 0, rating_min: 4.0 };
    }
  }

  /**
   * Генерировать описание для заказа
   */
  static async generateDescription(title, category) {
    const prompt = `Напиши профессиональное описание для заказа на выполнение работ.

Название: "${title}"
Категория: ${category}

Описание (50-100 слов):`;

    return await this.query(prompt, { max_tokens: 150 });
  }

  /**
   * Анализировать отзыв (spam/legit)
   */
  static async analyzeReview(review) {
    const prompt = `Проанализируй отзыв. Ответь ТОЛЬКО одним словом: LEGIT или SPAM.

Отзыв: "${review.text}"
Рейтинг: ${review.rating}/5

Результат:`;

    const response = await this.query(prompt, { max_tokens: 20 });
    return response?.trim().toUpperCase() === 'SPAM' ? 'spam' : 'legit';
  }

  /**
   * Главный метод для запроса к AI
   */
  static async query(prompt, options = {}) {
    for (const provider of PROVIDERS) {
      try {
        console.log(`[ai] Пытаюсь ${provider}...`);

        if (provider === 'ollama') {
          return await this.queryOllama(prompt, options);
        } else if (provider === 'openai_compatible') {
          return await this.queryOpenAI(prompt, options);
        } else if (provider === 'rules') {
          return await this.queryRules(prompt, options);
        }
      } catch (e) {
        console.warn(`[ai] ${provider} не работает:`, e.message);
        continue;
      }
    }

    // Fallback
    console.warn('[ai] Все провайдеры недоступны, используем rules');
    return await this.queryRules(prompt, options);
  }

  /**
   * Ollama (локальный LLM)
   */
  static async queryOllama(prompt, options = {}) {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        temperature: 0.7,
        num_predict: options.max_tokens || 100,
      }),
      timeout: AI_TIMEOUT,
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  /**
   * OpenAI compatible API (OpenAI, OpenRouter, Groq, etc)
   */
  static async queryOpenAI(prompt, options = {}) {
    if (!process.env.AI_API_KEY) {
      throw new Error('AI_API_KEY не установлен');
    }

    const response = await fetch(
      `${process.env.AI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Ты помощник для маркетплейса услуг. Отвечай кратко и по делу.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: options.max_tokens || 100,
        }),
        timeout: AI_TIMEOUT,
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Fallback: правила без нейросетей
   */
  static async queryRules(prompt, options = {}) {
    // Классификация по ключевым словам
    if (prompt.includes('Классифицируй')) {
      const keywords = {
        'сантехника': ['водопровод', 'кран', 'труба', 'унитаз', 'ванна'],
        'электричество': ['провод', 'розетка', 'лампа', 'выключатель', 'ток'],
        'ремонт': ['краска', 'обои', 'полы', 'стены', 'потолок'],
        'уборка': ['чистка', 'уборка', 'мусор', 'пыль'],
        'мебель': ['стол', 'шкаф', 'диван', 'сборка'],
      };

      for (const [category, words] of Object.entries(keywords)) {
        if (words.some(w => prompt.toLowerCase().includes(w))) {
          return category;
        }
      }

      return 'Ремонт квартиры';
    }

    // Анализ отзывов
    if (prompt.includes('SPAM') || prompt.includes('LEGIT')) {
      const spamWords = ['купи', 'ссылка', 'кликни', 'заработай', 'рекламa'];
      return spamWords.some(w => prompt.toLowerCase().includes(w)) ? 'SPAM' : 'LEGIT';
    }

    // Генерация описания
    if (prompt.includes('Напиши профессиональное')) {
      const category = prompt.match(/Категория: ([^\n]+)/)?.[1] || 'работ';
      return `Профессиональное выполнение ${category}. Опытный специалист гарантирует качество и своевременность. Используются только проверенные материалы.`;
    }

    // Для всего остального - просто повторяем часть промпта
    return prompt.substring(0, Math.min(100, prompt.length));
  }
}

// Export готовые функции
export const classifyOrder = (order) => AIService.classifyOrder(order);
export const suggestExecutors = (order) => AIService.suggestExecutors(order);
export const generateDescription = (title, cat) => AIService.generateDescription(title, cat);
export const analyzeReview = (review) => AIService.analyzeReview(review);
