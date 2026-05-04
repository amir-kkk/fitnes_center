# Структура базы данных (PostgreSQL)

Документ сформирован по сущностям EF Core (`backend/FitnessCenter.API/Models`, `Data/AppDbContext.cs`). Имена таблиц и столбцов в кавычках соответствуют соглашению EF для PostgreSQL (PascalCase).

---

### Таблица: `"Users"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `uuid` | **PK**, Not Null | Уникальный идентификатор пользователя. |
| `Email` | `text` | Not Null, **Unique** (индекс `IX_Users_Email`) | Логин и контакт для аутентификации. |
| `PasswordHash` | `text` | Not Null | Хеш пароля (не хранится открытый пароль). |
| `Role` | `character varying(20)` | Not Null, **MaxLength 20** | Роль в системе (`Admin`, `Manager`, `Trainer`, `User` и т.д.). |
| `FullName` | `text` | Not Null | Отображаемое имя. |
| `PhotoUrl` | `character varying(500)` | Nullable, **MaxLength 500** | URL или относительный путь к фото. |
| `TrainerRank` | `integer` | Nullable | Ранг тренера (для цен персональных слотов). |
| `CreatedAt` | `timestamp with time zone` | Not Null | Дата создания учётной записи. |

**Внешние ключи:** нет (на таблицу ссылаются остальные сущности).

---

### Таблица: `"Categories"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор категории групповых тренировок. |
| `Name` | `text` | Not Null | Название категории. |

**Внешние ключи:** нет.

**Связи:** одна категория — много `"Trainings"` (`"Trainings"."CategoryId"` → `"Categories"."Id"`).

---

### Таблица: `"Memberships"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор абонемента. |
| `Name` | `text` | Not Null | Название тарифа. |
| `Description` | `text` | Not Null | Описание для каталога. |
| `Price` | `numeric(10,2)` | Not Null, индекс по `Price` | Цена абонемента. |
| `DurationDays` | `integer` | Not Null | Срок действия в днях. |
| `CreatedAt` | `timestamp with time zone` | Not Null | Дата добавления в каталог. |

**Внешние ключи:** нет.

**Связи:**  
- 1:N → `"MembershipOptions"` (`"MembershipOptions"."MembershipId"` → `"Memberships"."Id"`, **ON DELETE CASCADE**).  
- 1:N → `"Purchases"` (`"Purchases"."MembershipId"` → `"Memberships"."Id"`).

---

### Таблица: `"MembershipOptions"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор строки опции. |
| `MembershipId` | `integer` | **FK** → `"Memberships"."Id"`, Not Null, **ON DELETE CASCADE** | Принадлежность к абонементу. |
| `OptionText` | `text` | Not Null | Текст включённой услуги. |

**Внешние ключи:**  
- `"MembershipId"` → **`"Memberships"."Id"`** (каскад при удалении абонемента).

---

### Таблица: `"Trainings"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор групповой тренировки. |
| `CategoryId` | `integer` | **FK** → `"Categories"."Id"`, Not Null, индекс | Категория занятия. |
| `TrainerId` | `uuid` | **FK** → `"Users"."Id"`, Not Null, индекс, **ON DELETE RESTRICT** | Пользователь-тренер, ведущий занятие. |
| `Description` | `text` | Not Null | Описание в расписании. |
| `StartTime` | `timestamp with time zone` | Not Null, индекс | Дата и время начала. |
| `MaxParticipants` | `integer` | Not Null | Лимит участников. |
| `CoachId` (legacy) | зависит от старой схемы | Может существовать только в устаревших БД | Устаревший столбец; в `SeedData` при наличии снимается `NOT NULL`. В текущей C#-модели не используется. |

**Внешние ключи:**  
- `"CategoryId"` → **`"Categories"."Id"`** (поведение удаления по умолчанию EF — обычно **RESTRICT**).  
- `"TrainerId"` → **`"Users"."Id"`** (**RESTRICT**).

**Связи:** 1:N → `"Bookings"`.

---

### Таблица: `"Purchases"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор покупки. |
| `UserId` | `uuid` | **FK** → `"Users"."Id"`, Not Null | Покупатель. |
| `MembershipId` | `integer` | **FK** → `"Memberships"."Id"`, Not Null | Купленный абонемент. |
| `PriceAtPurchase` | `numeric(10,2)` | Not Null | Цена на момент покупки. |
| `Status` | `integer` | Not Null | Enum `PurchaseStatus`: `0` = Pending, `1` = Paid. |
| `CreatedAt` | `timestamp with time zone` | Not Null | Время создания записи. |

**Внешние ключи:**  
- `"UserId"` → **`"Users"."Id"`**  
- `"MembershipId"` → **`"Memberships"."Id"`**  
(явный `OnDelete` в Fluent API не задан — для обязательных связей EF обычно использует **RESTRICT** при удалении родителя).

---

### Таблица: `"Bookings"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор записи на групповую тренировку. |
| `TrainingId` | `integer` | **FK** → `"Trainings"."Id"`, Not Null | Тренировка. |
| `UserId` | `uuid` | **FK** → `"Users"."Id"`, Not Null | Записанный пользователь. |
| `Status` | `integer` | Not Null | Enum `BookingStatus`: `0` = Active, `1` = Cancelled. |
| *(индекс)* | — | **Unique** на (`TrainingId`, `UserId`) **WHERE** `"Status" = 0` | Одна активная запись пользователя на одну тренировку; отмена не блокирует повторную запись. |

**Внешние ключи:**  
- `"TrainingId"` → **`"Trainings"."Id"`**  
- `"UserId"` → **`"Users"."Id"`**

---

### Таблица: `"PersonalWorkouts"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор слота или брони. |
| `TrainerId` | `uuid` | **FK** → `"Users"."Id"`, Not Null, **ON DELETE CASCADE** | Тренер, владелец слота. |
| `ClientId` | `uuid` | **FK** → `"Users"."Id"`, Nullable, **ON DELETE SET NULL** | Клиент после брони; `NULL` — свободный слот. |
| `DateTime` | `timestamp with time zone` | Not Null | Время начала слота. |
| `Price` | `numeric(10,2)` | Not Null | Цена слота. |
| `IsBooked` | `boolean` | Not Null | Признак бронирования. |
| *(индекс)* | — | **Unique** (`TrainerId`, `DateTime`) | Один слот на момент времени у тренера. |

**Внешние ключи:**  
- `"TrainerId"` → **`"Users"."Id"`** (CASCADE)  
- `"ClientId"` → **`"Users"."Id"`** (SET NULL)

---

### Таблица: `"AiTrainerUsages"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор записи учёта. |
| `UserId` | `uuid` | **FK** → `"Users"."Id"`, Not Null, **ON DELETE CASCADE** | Пользователь. |
| `UsageDate` | `date` | Not Null, **тип колонки date** | Календарный день. |
| `MessageCount` | `integer` | Not Null | Счётчик сообщений (вспомогательная сущность). |
| *(индекс)* | — | **Unique** (`UserId`, `UsageDate`) | Не более одной строки учёта на пользователя в день. |

**Внешние ключи:** `"UserId"` → **`"Users"."Id"`**.

---

### Таблица: `"AiTrainerMessages"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор лога успешного ответа AI. |
| `UserId` | `uuid` | **FK** → `"Users"."Id"`, Not Null, **ON DELETE CASCADE** | Пользователь. |
| `CreatedAt` | `timestamp with time zone` | Not Null, индекс (`UserId`, `CreatedAt`) | Время события для лимитов и аналитики. |

**Внешние ключи:** `"UserId"` → **`"Users"."Id"`**.

---

### Таблица: `"ProgressTrackers"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор трекера показателя. |
| `UserId` | `uuid` | **FK** → `"Users"."Id"`, Not Null | Владелец трекера. |
| `Title` | `text` | Not Null | Название показателя. |
| `GoalValue` | `double precision` | Not Null | Целевое значение. |
| `Unit` | `text` | Not Null | Единица измерения. |
| `CreatedAt` | `timestamp with time zone` | Not Null | Дата создания трекера. |

**Внешние ключи:** `"UserId"` → **`"Users"."Id"`** (явный `OnDelete` не задан — обычно **RESTRICT**).

**Связи:** 1:N → `"ProgressEntries"`.

---

### Таблица: `"ProgressEntries"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `integer` | **PK**, identity, Not Null | Идентификатор замера. |
| `TrackerId` | `integer` | **FK** → `"ProgressTrackers"."Id"`, Not Null, **ON DELETE CASCADE** | Родительский трекер. |
| `Value` | `double precision` | Not Null | Значение замера. |
| `DateRecorded` | `timestamp with time zone` | Not Null | Дата/время замера. |

**Внешние ключи:** `"TrackerId"` → **`"ProgressTrackers"."Id"`** (CASCADE).

---

### Таблица: `"AuditLogs"`

| Атрибут | Тип данных | Ограничение | Описание |
|--------|------------|-------------|----------|
| `Id` | `bigint` | **PK**, identity, Not Null | Идентификатор записи аудита. |
| `UserId` | `uuid` | **FK** → `"Users"."Id"`, Nullable, **ON DELETE SET NULL** | Пользователь, выполнивший изменение (если известен). |
| `EntityName` | `character varying(128)` | Not Null, **MaxLength 128**, индекс | Имя сущности (типа записи в журнале). |
| `Action` | `character varying(16)` | Not Null, **MaxLength 16**, индекс | Действие: `Insert`, `Update`, `Delete`. |
| `Timestamp` | `timestamp with time zone` | Not Null, индекс | Время события. |
| `OldValues` | `text` | Nullable | JSON старых значений. |
| `NewValues` | `text` | Nullable | JSON новых значений. |

**Внешние ключи:** `"UserId"` → **`"Users"."Id"`** (SET NULL при удалении пользователя).

---

## Сводка связей (FK)

| Таблица | Столбец | Ссылается на |
|---------|---------|--------------|
| `"MembershipOptions"` | `MembershipId` | `"Memberships"."Id"` |
| `"Trainings"` | `CategoryId` | `"Categories"."Id"` |
| `"Trainings"` | `TrainerId` | `"Users"."Id"` |
| `"Purchases"` | `UserId` | `"Users"."Id"` |
| `"Purchases"` | `MembershipId` | `"Memberships"."Id"` |
| `"Bookings"` | `TrainingId` | `"Trainings"."Id"` |
| `"Bookings"` | `UserId` | `"Users"."Id"` |
| `"PersonalWorkouts"` | `TrainerId` | `"Users"."Id"` |
| `"PersonalWorkouts"` | `ClientId` | `"Users"."Id"` |
| `"AiTrainerUsages"` | `UserId` | `"Users"."Id"` |
| `"AiTrainerMessages"` | `UserId` | `"Users"."Id"` |
| `"ProgressTrackers"` | `UserId` | `"Users"."Id"` |
| `"ProgressEntries"` | `TrackerId` | `"ProgressTrackers"."Id"` |
| `"AuditLogs"` | `UserId` | `"Users"."Id"` |

---

*При изменении модели обновляйте этот файл вместе с `AppDbContext.cs` и классами в `Models/`.*
