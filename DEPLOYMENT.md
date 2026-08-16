# 📚 DEPLOYMENT.md - Полное руководство развертывания на Render

## 🚀 Быстрый старт (5-10 минут)

### Шаг 1: Подготовьте GitHub репозиторий
```bash
git push origin main
```

### Шаг 2: Создайте аккаунт Render
- Зайдите на https://render.com
- Авторизуйтесь через GitHub
- Создайте Team (если нужно)

### Шаг 3: Свяжите репозиторий
1. В Render Dashboard → **New**
2. Выберите **Web Service**
3. Подключите репо `kacistka-del/naryad_MVP_v2`
4. Выберите ветку `main`

### Шаг 4: Настройте Backend
**Name:** `naryad-api`

**Build Command:**
```
cd server && npm install
```

**Start Command:**
```
cd server && npm start
```

**Environment Variables:**

| Key | Value | Описание |
|-----|-------|---------|
| `NODE_ENV` | `production` | Продакшн режим |
| `PORT` | `8080` | Порт (Render сам выберет) |
| `JWT_SECRET` | `your_long_random_string_min_32_chars` | ⚠️ Генерируйте случайно! |
| `ADMIN_EMAIL` | `admin@naryad.local` | Email администратора |
| `ADMIN_PASSWORD` | `SecurePassword123!` | ⚠️ Смените на своё! |
| `DATABASE_URL` | (Автоматически) | Будет заполнена после создания БД |
| `CORS_ORIGIN` | `https://naryad-frontend.onrender.com` | URL фронтенда |
| `APP_BASE_URL` | `https://naryad-frontend.onrender.com` | URL фронтенда |
| `PUBLIC_API_URL` | `https://naryad-api.onrender.com` | Это будет создано автоматически |
| `BASE_CURRENCY` | `EUR` | Базовая валюта |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Поначалу выключите |

### Шаг 5: Создайте PostgreSQL БД
1. В Dashboard → **New** → **PostgreSQL**
2. **Name:** `naryad-db`
3. **Region:** Frankfurt (или ближайший)
4. **PostgreSQL Version:** 15
5. Создайте ✅

Render автоматически добавит `DATABASE_URL` в переменные сервиса.

### Шаг 6: Настройте Frontend
**Name:** `naryad-frontend`

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run preview
```

**Environment Variables:**

| Key | Value |
|-----|-------|
| `VITE_BASE44_APP_ID` | `your_app_id` |
| `VITE_BASE44_APP_BASE_URL` | `https://naryad-api.onrender.com` |

### Шаг 7: Инициализируйте БД
После первого деплоя backend'а:

1. Откройте **нераст-api** в Render
2. Перейдите на вкладку **Shell**
3. Выполните:
```bash
npm run migrate
npm run seed
```

**Вывод должен быть:**
```
✅ Инициализация базы данных успешна
📧 Admin Email: admin@naryad.local
🔑 Default Password: SecurePassword123!
📚 Categories: 8
👥 Test Executors: 3
```

### Шаг 8: Проверьте здоровье сервисов
```bash
# Backend health check
curl https://naryad-api.onrender.com/health

# Ответ должен быть:
# {"status":"ok","timestamp":"...","environment":"production","dbConnected":true}
```

---

## 🔐 Безопасность - ВАЖНО!

### Генерируйте надежные пароли:

```bash
# Для JWT_SECRET (32 символа случайные)
openssl rand -base64 32

# Для ADMIN_PASSWORD
openssl rand -hex 16
```

### Чек-лист безопасности:
- [ ] JWT_SECRET изменён (минимум 32 символа)
- [ ] ADMIN_PASSWORD не совпадает с default
- [ ] Database приватная (не публичная)
- [ ] CORS_ORIGIN установлен правильно
- [ ] Включить HTTPS (Render делает автоматически)

---

## 🌐 API Endpoints

### Auth
```
POST   /api/auth/register      - Регистрация
POST   /api/auth/login         - Вход
GET    /api/auth/me            - Профиль (требует токен)
POST   /api/auth/logout        - Выход
```

### Orders
```
GET    /api/orders             - Список заказов пользователя
POST   /api/orders             - Создать заказ
GET    /api/orders/:id         - Детали заказа
PUT    /api/orders/:id/status  - Изменить статус
```

### Entities (CRUD)
```
GET    /api/entities/:entity              - Список сущностей
GET    /api/entities/:entity/search       - Поиск
GET    /api/entities/:entity/:id          - Получить
POST   /api/entities/:entity              - Создать
PUT    /api/entities/:entity/:id          - Обновить
DELETE /api/entities/:entity/:id          - Уд��лить
```

### Admin
```
GET    /api/admin/stats                   - Статистика
GET    /api/admin/audit-log               - Логи действий
POST   /api/admin/seed                    - Инициализировать данные
```

### Upload
```
POST   /api/upload                        - Загрузить файл (multipart/form-data)
```

### Currency
```
GET    /api/fx/rates?base=EUR&quote=USD  - Получить курс
```

---

## 🚨 Troubleshooting

### "Cannot find module"
```bash
cd server && npm install
git add package-lock.json
git push
```

### Database connection error
```
Проверьте DATABASE_URL в Render Dashboard
Убедитесь что PostgreSQL сервис запущен
Перезагрузите backend
```

### Frontend не видит backend
```
Проверьте CORS_ORIGIN = URL вашего frontend
Проверьте что backend запущен и здоров (/health)
```

### Ошибка при seed
```bash
# Подключитесь к БД через Shell и проверьте:
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 1;"
```

---

## 📊 Мониторинг

### Логи
- Backend: Dashboard → naryad-api → Logs
- Frontend: Dashboard → naryad-frontend → Logs

### Метрики
- CPU, Memory, Network в разделе Metrics
- Response time на вкладке Health

### Alerts
Настройте уведомления в **Settings** → **Notifications**

---

## 🔄 Обновления

### Развернуть обновления:
```bash
git add .
git commit -m "Update features"
git push origin main
# Render автоматически redeploy
```

### Откатить изменения:
```bash
git revert <commit-hash>
git push origin main
```

---

## 💾 Резервные копии БД

### Создать дамп:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Восстановить:
```bash
psql $DATABASE_URL < backup.sql
```

---

## 🎯 Дальнейшее

### Добавьте:
- [ ] Email отправка (SMTP)
- [ ] Платежи (Stripe/YooKassa)
- [ ] Google OAuth
- [ ] Уведомления (WebSocket)
- [ ] Поиск (Elasticsearch)
- [ ] Кеширование (Redis)

### Оптимизация:
- Добавьте индексы в БД
- Кешируйте часто используемые данные
- Используйте CDN для статики
- Мониторьте производительность

---

**Вопросы?** Проверьте логи или свяжитесь с поддержкой Render.
