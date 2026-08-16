import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { loadUser, authRequired, adminRequired, cronOrAdmin } from './middleware.js';
import { wrap } from './http.js';
import { store } from './store.js';
import { pool } from './db.js';
import { query } from './db.js';
import { withTransaction } from './db.js';
import { sendMail, mailConfigured } from './mailer.js';
import { signToken } from './jwt.js';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============ Конфигурация ============
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============ Middleware ============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : process.env.APP_BASE_URL || 'http://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cron-Token'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов, попробуйте позже',
});

app.use('/api/auth/register', limiter);
app.use('/api/auth/login', limiter);

// Загрузка пользователя из токена
app.use(loadUser);

// Статические файлы
app.use('/uploads', express.static(UPLOAD_DIR));

// ============ Утилиты ============
const upload = multer({ 
  dest: UPLOAD_DIR,
  limits: { fileSize: (process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024 }
});

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    dbConnected: pool._clients.length > 0 || 'pending'
  });
});

// ============ Auth Routes ============
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const { rows } = await query(
      `insert into users (email, password_hash, data, is_verified)
       values ($1, $2, $3, $4)
       on conflict (email) do nothing
       returning *`,
      [email, hashedPassword, JSON.stringify({ name: name || email }), false]
    );

    if (!rows[0]) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    const token = signToken(rows[0]);
    res.status(201).json({
      token,
      user: {
        id: rows[0].id,
        email: rows[0].email,
        role: rows[0].role,
        data: rows[0].data,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const { rows } = await query('select * from users where email = $1', [email]);
  const user = rows[0];

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Неверные учётные данные' });
  }

  const valid = await bcryptjs.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Неверные учётные данные' });
  }

  if (user.is_blocked) {
    return res.status(403).json({ error: 'Пользователь заблокирован' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      data: user.data,
    }
  });
}));

app.get('/api/auth/me', authRequired, wrap(async (req, res) => {
  const { rows } = await query('select * from users where id = $1', [req.user.id]);
  if (!rows[0]) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json({
    id: rows[0].id,
    email: rows[0].email,
    role: rows[0].role,
    is_verified: rows[0].is_verified,
    data: rows[0].data,
  });
}));

app.post('/api/auth/logout', authRequired, (req, res) => {
  // JWT stateless - просто удалить токен на клиенте
  res.json({ message: 'Вы вышли' });
});

// ============ Entity CRUD Routes ============
app.get('/api/entities/:entity', wrap(async (req, res) => {
  const { entity } = req.params;
  const { sort, limit } = req.query;

  const entities = await store.list(entity, sort, parseInt(limit) || 500);
  res.json(entities);
}));

app.get('/api/entities/:entity/search', wrap(async (req, res) => {
  const { entity } = req.params;
  const { q, sort, limit } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Параметр q обязателен' });
  }

  // Простой поиск по JSONB данным
  const searchObj = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'q' && key !== 'sort' && key !== 'limit') {
      searchObj[key] = value;
    }
  }

  const entities = await store.filter(entity, searchObj, sort, parseInt(limit) || 500);
  res.json(entities);
}));

app.get('/api/entities/:entity/:id', wrap(async (req, res) => {
  const { entity, id } = req.params;
  const item = await store.get(entity, id);
  
  if (!item) {
    return res.status(404).json({ error: 'Не найдено' });
  }

  res.json(item);
}));

app.post('/api/entities/:entity', authRequired, wrap(async (req, res) => {
  const { entity } = req.params;
  const item = await store.create(entity, req.body, req.user.id);
  res.status(201).json(item);
}));

app.put('/api/entities/:entity/:id', authRequired, wrap(async (req, res) => {
  const { entity, id } = req.params;
  const item = await store.update(entity, id, req.body);
  res.json(item);
}));

app.delete('/api/entities/:entity/:id', authRequired, wrap(async (req, res) => {
  const { entity, id } = req.params;
  const result = await store.remove(entity, id);
  res.json(result);
}));

// ============ Orders Routes ============
app.get('/api/orders', authRequired, wrap(async (req, res) => {
  const orders = await store.filter('Order', { created_by: req.user.id }, '-created_date', 100);
  res.json(orders);
}));

app.get('/api/orders/:id', authRequired, wrap(async (req, res) => {
  const order = await store.get('Order', req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Заказ не найден' });
  }
  res.json(order);
}));

app.post('/api/orders', authRequired, wrap(async (req, res) => {
  const order = await store.create('Order', {
    ...req.body,
    status: 'new',
    client_id: req.user.id,
  }, req.user.id);
  res.status(201).json(order);
}));

app.put('/api/orders/:id/status', authRequired, wrap(async (req, res) => {
  const { status } = req.body;
  const order = await store.update('Order', req.params.id, { status });
  
  // Создаём запись в истории
  await store.create('OrderStatusHistory', {
    order_id: req.params.id,
    status,
    changed_by: req.user.id,
  }, req.user.id);

  res.json(order);
}));

// ============ Users Routes ============
app.get('/api/users/:id', wrap(async (req, res) => {
  const user = await store.get('User', req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json(user);
}));

app.get('/api/users', wrap(async (req, res) => {
  const { role, search, limit } = req.query;
  const where = {};
  if (role) where.role = role;
  
  const users = await store.filter('User', where, '-created_date', parseInt(limit) || 100);
  res.json(users);
}));

app.put('/api/users/:id', authRequired, adminRequired, wrap(async (req, res) => {
  const user = await store.update('User', req.params.id, req.body);
  res.json(user);
}));

// ============ Admin Routes ============
app.get('/api/admin/stats', authRequired, adminRequired, wrap(async (req, res) => {
  const { rows: userStats } = await query(
    `select count(*) as total, 
            sum(case when is_verified then 1 else 0 end) as verified,
            sum(case when role = 'admin' then 1 else 0 end) as admins
     from users`
  );

  const { rows: orderStats } = await query(
    `select count(*) as total,
            count(distinct created_by) as clients,
            max(created_date) as last_order
     from records where entity = 'Order'`
  );

  res.json({
    users: userStats[0],
    orders: orderStats[0],
    timestamp: new Date().toISOString(),
  });
}));

app.get('/api/admin/audit-log', authRequired, adminRequired, wrap(async (req, res) => {
  const logs = await store.list('AdminAuditLog', '-created_date', 100);
  res.json(logs);
}));

// ============ Upload Routes ============
app.post('/api/upload', authRequired, upload.single('file'), wrap(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const filename = req.file.filename;
  const url = `/uploads/${filename}`;

  // Сохраняем информацию о файле в БД
  await store.create('FileRecord', {
    filename: req.file.originalname,
    path: filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    user_id: req.user.id,
  }, req.user.id);

  res.json({
    filename: req.file.originalname,
    path: filename,
    url,
    size: req.file.size,
  });
}));

// ============ Currency Routes ============
app.get('/api/fx/rates', wrap(async (req, res) => {
  const { base = 'EUR', quote } = req.query;
  
  if (!quote) {
    return res.status(400).json({ error: 'Параметр quote обязателен' });
  }

  const { rows } = await query(
    `select rate, fetched_at from fx_rates 
     where base = $1 and quote = $2 
     order by fetched_at desc limit 1`,
    [base, quote]
  );

  res.json({
    base,
    quote,
    rate: rows[0]?.rate || 1,
    fetched_at: rows[0]?.fetched_at,
  });
}));

// ============ Seed/Init Routes (Admin Only) ============
app.post('/api/admin/seed', authRequired, adminRequired, wrap(async (req, res) => {
  // Создаём категории по умолчанию
  const categories = [
    { name: 'Сантехника', description: 'Работы по сантехнике' },
    { name: 'Электричество', description: 'Электромонтажные работы' },
    { name: 'Ремонт', description: 'Ремонт и отделка' },
    { name: 'Уборка', description: 'Уборка помещений' },
  ];

  for (const cat of categories) {
    await store.create('Category', cat, req.user.id);
  }

  res.json({ message: 'Данные инициализированы', categories: categories.length });
}));

// ============ Error Handling ============
app.use((err, req, res, next) => {
  console.error('[error]', err.message || err);
  
  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  
  res.status(status).json({
    error: message,
    code: err.code,
    status,
  });
});

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
    method: req.method,
  });
});

// ============ Server Start ============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 NARYAD Backend v2.0.0              ║
╠════════════════════════════════════════╣
║  Environment: ${NODE_ENV.padEnd(27)}║
║  Port: ${String(PORT).padEnd(38)}║
║  Upload Dir: ${UPLOAD_DIR.padEnd(31)}║
╠════════════════════════════════════════╣
║  📍 API: http://localhost:${PORT}${' '.repeat(22 - String(PORT).length)}║
║  📊 Health: /health                    ║
║  📚 Auth: /api/auth/*                  ║
║  🏪 Entities: /api/entities/*          ║
╚════════════════════════════════════════╝
  `);
});

// ============ Graceful Shutdown ============
process.on('SIGTERM', async () => {
  console.log('[shutdown] SIGTERM получен, закрываю соединения...');
  await pool.end();
  process.exit(0);
});
