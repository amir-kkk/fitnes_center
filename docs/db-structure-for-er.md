# Структура базы данных (актуальная версия)

Ниже структура БД проекта в формате для диплома.

## Таблица 2.1 Таблица Пользователи (Users)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | UUID | PK, NOT NULL | Уникальный идентификатор пользователя |
| Email | TEXT | NOT NULL, UNIQUE | Электронная почта (логин) |
| PasswordHash | TEXT | NOT NULL | Хеш пароля (BCrypt) |
| Role | VARCHAR(20) | NOT NULL | Роль пользователя: Admin, Manager, Trainer, User |
| FullName | TEXT | NOT NULL | Полное имя пользователя |
| PhoneNumber | VARCHAR(20) | NULL | Номер телефона |
| PhotoUrl | VARCHAR(500) | NULL | Путь/URL фотографии профиля |
| TrainerRank | INT | NULL | Ранг тренера (1-5), если роль Trainer |
| CreatedAt | TIMESTAMPTZ | NOT NULL | Дата и время регистрации |

## Таблица 2.2 Таблица Категории тренировок (Categories)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор категории |
| Name | TEXT | NOT NULL | Название категории (йога, бокс и т.д.) |

## Таблица 2.3 Таблица Абонементы (Memberships)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор абонемента |
| Name | TEXT | NOT NULL | Название абонемента |
| Description | TEXT | NOT NULL | Описание абонемента |
| Price | DECIMAL(10,2) | NOT NULL | Стоимость абонемента |
| DurationDays | INT | NOT NULL | Срок действия в днях |
| CreatedAt | TIMESTAMPTZ | NOT NULL | Дата и время создания |

## Таблица 2.4 Таблица Опции абонемента (MembershipOptions)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор опции |
| MembershipId | INT | FK, NOT NULL | Ссылка на абонемент (`Memberships.Id`) |
| OptionText | TEXT | NOT NULL | Текст опции/включенной услуги |

## Таблица 2.5 Таблица Групповые тренировки (Trainings)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор тренировки |
| CategoryId | INT | FK, NOT NULL | Ссылка на категорию (`Categories.Id`) |
| TrainerId | UUID | FK, NOT NULL | Ссылка на тренера (`Users.Id`) |
| Description | TEXT | NOT NULL | Описание занятия |
| StartTime | TIMESTAMPTZ | NOT NULL | Дата и время начала |
| MaxParticipants | INT | NOT NULL | Максимум участников |

## Таблица 2.6 Таблица Покупки абонементов (Purchases)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор покупки |
| UserId | UUID | FK, NOT NULL | Ссылка на пользователя (`Users.Id`) |
| MembershipId | INT | FK, NOT NULL | Ссылка на абонемент (`Memberships.Id`) |
| PriceAtPurchase | DECIMAL(10,2) | NOT NULL | Цена абонемента на момент оформления |
| Status | INT | NOT NULL | Статус покупки (Enum: Reserved, Paid) |
| CreatedAt | TIMESTAMPTZ | NOT NULL | Дата и время создания записи |

## Таблица 2.7 Таблица Записи на групповые тренировки (Bookings)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор записи |
| TrainingId | INT | FK, NOT NULL | Ссылка на тренировку (`Trainings.Id`) |
| UserId | UUID | FK, NOT NULL | Ссылка на пользователя (`Users.Id`) |
| Status | INT | NOT NULL | Статус записи (Enum: Active, Cancelled) |

Дополнительно: уникальный частичный индекс на (`TrainingId`, `UserId`) для активных записей.

## Таблица 2.8 Таблица Персональные тренировки (PersonalWorkouts)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор слота/записи |
| TrainerId | UUID | FK, NOT NULL | Ссылка на тренера (`Users.Id`) |
| ClientId | UUID | FK, NULL | Ссылка на клиента (`Users.Id`) |
| DateTime | TIMESTAMPTZ | NOT NULL | Дата и время слота |
| Price | DECIMAL(10,2) | NOT NULL | Стоимость тренировки |
| Status | INT | NOT NULL | Статус (Enum: Available, BookedUnpaid, Paid, Completed, NotCompleted) |
| NotCompletedReason | VARCHAR(500) | NULL | Причина непроведения (если есть) |

## Таблица 2.9 Таблица Лимиты AI-тренера (AiTrainerUsages)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор записи |
| UserId | UUID | FK, NOT NULL | Ссылка на пользователя (`Users.Id`) |
| UsageDate | DATE | NOT NULL | Дата учета лимита |
| MessageCount | INT | NOT NULL | Количество сообщений за день |

## Таблица 2.10 Таблица Сообщения AI-тренера (AiTrainerMessages)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор сообщения |
| UserId | UUID | FK, NOT NULL | Ссылка на пользователя (`Users.Id`) |
| CreatedAt | TIMESTAMPTZ | NOT NULL | Дата и время сообщения |

## Таблица 2.11 Таблица Трекеры прогресса (ProgressTrackers)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор трекера |
| UserId | UUID | FK, NOT NULL | Ссылка на пользователя (`Users.Id`) |
| Title | TEXT | NOT NULL | Название показателя (вес, талия и т.д.) |
| GoalValue | DOUBLE PRECISION | NOT NULL | Целевое значение |
| Unit | TEXT | NOT NULL | Единица измерения |
| CreatedAt | TIMESTAMPTZ | NOT NULL | Дата и время создания |

## Таблица 2.12 Таблица Замеры прогресса (ProgressEntries)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | SERIAL | PK, NOT NULL | Уникальный идентификатор замера |
| TrackerId | INT | FK, NOT NULL | Ссылка на трекер (`ProgressTrackers.Id`) |
| Value | DOUBLE PRECISION | NOT NULL | Значение замера |
| DateRecorded | TIMESTAMPTZ | NOT NULL | Дата и время фиксации замера |

## Таблица 2.13 Таблица Журнал аудита (AuditLogs)

| Атрибут | Тип данных | Ограничение | Описание |
|---|---|---|---|
| Id | BIGINT | PK, NOT NULL | Уникальный идентификатор записи аудита |
| UserId | UUID | FK, NULL | Пользователь, выполнивший изменение (`Users.Id`) |
| EntityName | VARCHAR(128) | NOT NULL | Имя сущности (таблицы/модели) |
| Action | VARCHAR(16) | NOT NULL | Действие: Insert/Update/Delete |
| Timestamp | TIMESTAMPTZ | NOT NULL | Дата и время изменения |
| OldValues | TEXT | NULL | JSON со старыми значениями |
| NewValues | TEXT | NULL | JSON с новыми значениями |

---

## Внешние ключи (сводно)

- `MembershipOptions.MembershipId` -> `Memberships.Id`
- `Trainings.CategoryId` -> `Categories.Id`
- `Trainings.TrainerId` -> `Users.Id`
- `Purchases.UserId` -> `Users.Id`
- `Purchases.MembershipId` -> `Memberships.Id`
- `Bookings.TrainingId` -> `Trainings.Id`
- `Bookings.UserId` -> `Users.Id`
- `PersonalWorkouts.TrainerId` -> `Users.Id`
- `PersonalWorkouts.ClientId` -> `Users.Id`
- `AiTrainerUsages.UserId` -> `Users.Id`
- `AiTrainerMessages.UserId` -> `Users.Id`
- `ProgressTrackers.UserId` -> `Users.Id`
- `ProgressEntries.TrackerId` -> `ProgressTrackers.Id`
- `AuditLogs.UserId` -> `Users.Id`
