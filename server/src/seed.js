import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from './db.js';
import { store } from './store.js';
import bcryptjs from 'bcryptjs';

const here = path.dirname(fileURLToPath(import.meta.url));

const CATEGORIES = [
  { name: 'Сантехника', description: 'Водопровод, канализация, отопление' },
  { name: 'Электричество', description: 'Электромонтажные работы' },
  { name: 'Ремонт квартиры', description: 'Капитальный и текущий ремонт' },
  { name: 'Уборка', description: 'Уборка помещений и организация' },
  { name: 'Мебель', description: 'Сборка и ремонт мебели' },
  { name: 'Окна и двери', description: 'Установка и ремонт окон/дверей' },
  { name: 'Кровля', description: 'Работы по крыше' },
  { name: 'Фасад', description: 'Фасадные работы' },
];

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@naryad.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_me_123';

async function seed() {
  try {
    console.log('[seed] Начинаем инициализацию...');

    // 1. Создаём администратора
    console.log('[seed] Создаём администратора...');
    const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, 10);
    
    const { rows: adminRows } = await query(
      `insert into users (email, password_hash, role, is_verified, data)
       values ($1, $2, 'admin', true, $3)
       on conflict (email) do nothing
       returning id, email, role`,
      [ADMIN_EMAIL, hashedPassword, JSON.stringify({ name: 'Administrator' })]
    );

    if (adminRows[0]) {
      console.log(`✅ Администратор создан: ${adminRows[0].email}`);
      console.log(`   ID: ${adminRows[0].id}`);
    } else {
      console.log(`ℹ️  Администратор уже существует: ${ADMIN_EMAIL}`);
    }

    // 2. Создаём категории
    console.log('[seed] Создаём категории...');
    let createdCats = 0;

    for (const cat of CATEGORIES) {
      const { rows } = await query(
        `insert into records (entity, data, created_by)
         select $1, $2::jsonb, (select id from users where role = 'admin' limit 1)
         where not exists (
           select 1 from records 
           where entity = 'Category' 
           and data->>'name' = $3
         )
         returning id`,
        ['Category', JSON.stringify(cat), cat.name]
      );

      if (rows[0]) createdCats++;
    }

    console.log(`✅ Категории инициализированы: ${createdCats} новых`);

    // 3. Создаём системные настройки
    console.log('[seed] Создаём системные настройки...');
    
    const settings = {
      platform_name: 'NARYAD',
      currency: process.env.BASE_CURRENCY || 'EUR',
      commission_percent: process.env.ESCROW_COMMISSION_PERCENT || 8,
      email_verification_required: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      maintenance_mode: false,
    };

    const { rows: settingRows } = await query(
      `insert into records (entity, data, created_by)
       select $1, $2::jsonb, (select id from users where role = 'admin' limit 1)
       where not exists (
         select 1 from records where entity = 'SystemSetting'
       )
       returning id`,
      ['SystemSetting', JSON.stringify(settings)]
    );

    if (settingRows[0]) {
      console.log('✅ Системные настройки созданы');
    } else {
      console.log('ℹ️  Системные настройки уже существуют');
    }

    // 4. Создаём тестовых исполнителей (если нужны)
    console.log('[seed] Создаём примеры исполнителей...');
    
    const testExecutors = [
      { name: 'Иван Петров', phone: '+7-999-123-45-67', rating: 4.8, reviews: 45 },
      { name: 'Мария Сидорова', phone: '+7-999-234-56-78', rating: 4.9, reviews: 32 },
      { name: 'Сергей Волков', phone: '+7-999-345-67-89', rating: 4.7, reviews: 28 },
    ];

    let createdExecutors = 0;

    for (const executor of testExecutors) {
      const { rows: execRows } = await query(
        `insert into records (entity, data, created_by)
         select $1, $2::jsonb, (select id from users where role = 'admin' limit 1)
         where not exists (
           select 1 from records 
           where entity = 'Executor' 
           and data->>'name' = $3
         )
         returning id`,
        ['Executor', JSON.stringify(executor), executor.name]
      );

      if (execRows[0]) createdExecutors++;
    }

    console.log(`✅ Примеры исполнителей созданы: ${createdExecutors} новых`);

    // 5. Логируем в аудит
    const { adminId } = await query(
      'select id from users where role = $1 limit 1',
      ['admin']
    );

    if (adminId) {
      await query(
        `insert into records (entity, data, created_by)
         values ($1, $2::jsonb, $3)`,
        ['AdminAuditLog', JSON.stringify({
          action: 'DATABASE_SEED',
          timestamp: new Date().toISOString(),
          status: 'success',
          details: {
            admin_created: adminRows[0] ? true : false,
            categories_added: createdCats,
            executors_added: createdExecutors,
          }
        }), adminId]
      );
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ Инициализация базы данных успешна ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  📧 Admin Email: ${ADMIN_EMAIL.padEnd(26)}║`);
    console.log(`║  🔑 Default Password: ${ADMIN_PASSWORD.padEnd(16)}║`);
    console.log(`║  📚 Categories: ${String(createdCats).padEnd(27)}║`);
    console.log(`║  👥 Test Executors: ${String(createdExecutors).padEnd(18)}║`);
    console.log('╚════════════════════════════════════════╝\n');

  } catch (e) {
    console.error('[seed] ❌ Ошибка:', e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// Запуск
seed();
