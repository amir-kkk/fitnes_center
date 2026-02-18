# FitnessCenter — Веб-приложение для фитнес-центра

Полноценное Full-Stack веб-приложение для управления фитнес-центром.
Учебный проект уровня production-ready.

## Технологический стек

| Компонент | Технология |
|-----------|-----------|
| **Backend** | ASP.NET Core 8, Entity Framework Core, PostgreSQL |
| **Frontend** | React 18 (TypeScript), Vite, Material-UI, Zustand |
| **Auth** | JWT + Role-Based Access Control (Admin / User) |
| **DevOps** | Docker, Docker Compose |

## Архитектура

Backend (ASP.NET Core) выполняет две роли:
1. **REST API** — обрабатывает запросы на `/api/*`
2. **Раздача фронтенда** — собранные файлы React-приложения лежат в `wwwroot/`, всё остальное отдаётся как `index.html` (SPA fallback через `MapFallbackToFile`)

Это стандартный паттерн хостинга SPA в ASP.NET Core — один процесс, один порт, никаких проксей.

## Быстрый запуск

```bash
docker compose up --build
```

После запуска:
- **Приложение**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger

### Тестовый администратор
- Email: `admin@test.com`
- Пароль: `Admin123!`

### Локальная разработка (без Docker)

```bash
# Терминал 1: Backend
cd backend/FitnessCenter.API
dotnet run

# Терминал 2: Frontend (Vite dev-сервер с прокси на :5000)
cd frontend
npm install
npm run dev
```

Frontend dev-сервер на порту 3000 автоматически проксирует `/api` на бэкенд (порт 5000) через настройку в `vite.config.ts`.

## Структура проекта

```
Fitness_web/
├── Dockerfile              # Multi-stage: сборка фронта + бэка в один образ
├── docker-compose.yml      # PostgreSQL + приложение
├── backend/
│   ├── FitnessCenter.sln
│   └── FitnessCenter.API/
│       ├── Controllers/     # REST-контроллеры
│       ├── Data/            # DbContext, SeedData
│       ├── DTOs/            # Data Transfer Objects
│       ├── Middleware/       # Глобальный обработчик ошибок
│       ├── Models/          # Сущности EF Core
│       ├── Services/        # Бизнес-логика
│       ├── Validators/      # FluentValidation
│       └── Program.cs       # Точка входа + SPA fallback
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios HTTP-клиент
│   │   ├── components/     # Layout, AdminLayout, ProtectedRoute
│   │   ├── pages/          # Страницы (Home, Login, Memberships...)
│   │   │   └── admin/      # Админ-панель
│   │   ├── stores/         # Zustand (auth, notification, cart)
│   │   ├── types/          # TypeScript-типы
│   │   ├── App.tsx         # Маршрутизация (React Router)
│   │   └── main.tsx        # Точка входа
│   ├── vite.config.ts      # Vite + прокси для dev-режима
│   └── package.json
└── README.md
```

## Docker-сборка

`Dockerfile` использует multi-stage build:

1. **Этап 1 (node:20)** — `npm install` + `npm run build` → собирает React в `dist/`
2. **Этап 2 (dotnet/sdk:8.0)** — `dotnet restore` + `dotnet publish` → собирает API
3. **Этап 3 (dotnet/aspnet:8.0)** — копирует publish-артефакты бэкенда + `dist/` фронтенда в `wwwroot/`

Результат: один контейнер, один порт (5000), ASP.NET Core раздаёт всё.

## ER-диаграмма (связи сущностей)

```
User (1) ──→ (*) Purchase ──→ (1) Membership (1) ──→ (*) MembershipOption
User (1) ──→ (*) Booking   ──→ (1) Training   ──→ (1) Category
User (1) ──→ (*) ProgressTracker (1) ──→ (*) ProgressEntry
Training (*) ──→ (1) Coach
```

### Сущности и поля

| Сущность | Ключевые поля |
|----------|--------------|
| **User** | Id (Guid), Email, PasswordHash, Role, FullName |
| **Membership** | Id, Name, Description, Price, DurationDays |
| **MembershipOption** | Id, MembershipId (FK), OptionText |
| **Category** | Id, Name |
| **Coach** | Id, FullName, PhotoUrl, Specialization |
| **Training** | Id, CategoryId (FK), CoachId (FK), Description, StartTime, MaxParticipants |
| **Purchase** | Id, UserId (FK), MembershipId (FK), PriceAtPurchase, Status (Pending/Paid) |
| **Booking** | Id, TrainingId (FK), UserId (FK), Status (Active/Cancelled) |
| **ProgressTracker** | Id, UserId (FK), Title, GoalValue, Unit |
| **ProgressEntry** | Id, TrackerId (FK), Value, DateRecorded |

### Индексы

- `User.Email` — уникальный
- `Training.StartTime`, `Training.CategoryId` — для фильтрации
- `Membership.Price` — для фильтрации по цене
- `Booking(TrainingId, UserId)` — уникальный для активных записей

## API эндпоинты

Полная документация: **Swagger UI** → http://localhost:5000/swagger

### Аутентификация
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь (JWT) |

### Абонементы
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/memberships?page=1&pageSize=10&minPrice=&maxPrice=&search=` | Список |
| GET | `/api/memberships/{id}` | Детали |
| POST | `/api/memberships` | Создать (Admin) |
| PUT | `/api/memberships/{id}` | Обновить (Admin) |
| DELETE | `/api/memberships/{id}` | Удалить (Admin) |

### Тренировки
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/trainings?categoryId=&coachId=&date=` | Расписание |
| POST | `/api/trainings` | Создать (Admin) |
| PUT | `/api/trainings/{id}` | Обновить (Admin) |
| DELETE | `/api/trainings/{id}` | Удалить (Admin) |

### Тренеры
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/coaches` | Список тренеров |
| POST | `/api/coaches` | Создать (Admin) |
| PUT | `/api/coaches/{id}` | Обновить (Admin) |
| DELETE | `/api/coaches/{id}` | Удалить (Admin) |
| POST | `/api/coaches/{id}/photo` | Загрузить фото (multipart/form-data, Admin) |

### Покупки
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/purchases/my` | Мои покупки |
| GET | `/api/purchases` | Все покупки (Admin) |
| POST | `/api/purchases` | Купить абонемент |
| POST | `/api/purchases/{id}/pay` | Имитация оплаты |

### Бронирования
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/bookings/my` | Мои записи |
| POST | `/api/bookings` | Записаться |
| DELETE | `/api/bookings/{id}` | Отменить |

### Прогресс
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/progress/trackers` | Мои трекеры |
| POST | `/api/progress/trackers` | Создать трекер |
| DELETE | `/api/progress/trackers/{id}` | Удалить |
| GET | `/api/progress/trackers/{id}/entries` | Записи трекера |
| POST | `/api/progress/trackers/{id}/entries` | Добавить замер |

### Администрирование
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/users` | Список пользователей |
| PUT | `/api/admin/users/{id}/role` | Смена роли |
| GET/POST | `/api/categories` | Категории |

## Функциональность

### Для пользователя
- Регистрация и авторизация
- Каталог абонементов с фильтрацией по цене
- Покупка абонемента (имитация оплаты)
- Расписание тренировок (фильтр по категории, тренеру, дате)
- Запись на тренировку (проверка лимита мест)
- Личный кабинет (покупки, записи)
- Трекер прогресса с динамикой изменений (%)

### Для администратора
- Управление пользователями (смена ролей)
- CRUD тренеров (с загрузкой фото из файла)
- CRUD абонементов
- CRUD тренировок (тренер выбирается из списка)
- Просмотр всех покупок

## Безопасность
- JWT-токены в заголовке `Authorization: Bearer ...`
- RBAC: Admin и User
- Валидация входных данных (FluentValidation)
- Глобальная обработка ошибок (ProblemDetails RFC 7807)
- Хеширование паролей (BCrypt)
