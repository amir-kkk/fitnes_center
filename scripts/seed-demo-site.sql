-- Демонстрационное наполнение БД для защиты проекта.
-- Пароль для ВСЕХ учетных записей: qwerty123
SET client_encoding = 'UTF8';

TRUNCATE TABLE
    "AuditLogs",
    "AiTrainerMessages",
    "AiTrainerUsages",
    "ProgressEntries",
    "ProgressTrackers",
    "Bookings",
    "Purchases",
    "PersonalWorkouts",
    "Trainings",
    "MembershipOptions",
    "Memberships",
    "Categories",
    "Coaches"
RESTART IDENTITY CASCADE;

DELETE FROM "Users";

INSERT INTO "Users" ("Id", "Email", "PasswordHash", "Role", "FullName", "PhoneNumber", "PhotoUrl", "TrainerRank", "CreatedAt")
VALUES
('11111111-1111-1111-1111-111111111111', 'admin@fitdemo.ru',   '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'Admin',   'Администратор Системы', '+79990000001', NULL, NULL, NOW() - INTERVAL '180 days'),
('22222222-2222-2222-2222-222222222222', 'manager@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'Manager', 'Кузнецова Анастасия Игоревна', '+79990000002', NULL, NULL, NOW() - INTERVAL '170 days'),
('33333333-3333-3333-3333-333333333331', 'trainer1@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'Trainer', 'Воронов Алексей Сергеевич', '+79990000011', NULL, 2, NOW() - INTERVAL '160 days'),
('33333333-3333-3333-3333-333333333332', 'trainer2@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'Trainer', 'Гимаева Диана Фаридовна', '+79990000012', NULL, 3, NOW() - INTERVAL '155 days'),
('33333333-3333-3333-3333-333333333333', 'trainer3@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'Trainer', 'Лебедева Марина Андреевна', '+79990000013', NULL, 4, NOW() - INTERVAL '150 days'),
('33333333-3333-3333-3333-333333333334', 'trainer4@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'Trainer', 'Поляков Илья Романович', '+79990000014', NULL, 1, NOW() - INTERVAL '148 days'),
('44444444-4444-4444-4444-444444444441', 'client1@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Семянка Андрей Павлович', '+79051110001', NULL, NULL, NOW() - INTERVAL '120 days'),
('44444444-4444-4444-4444-444444444442', 'client2@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Сергеев Семен Павлов', '+79051110002', NULL, NULL, NOW() - INTERVAL '118 days'),
('44444444-4444-4444-4444-444444444443', 'client3@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Максимов Андрей Анатольевич', '+79051110003', NULL, NULL, NOW() - INTERVAL '110 days'),
('44444444-4444-4444-4444-444444444444', 'client4@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Ковалева Екатерина Денисовна', '+79051110004', NULL, NULL, NOW() - INTERVAL '105 days'),
('44444444-4444-4444-4444-444444444445', 'client5@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Назаров Кирилл Андреевич', '+79051110005', NULL, NULL, NOW() - INTERVAL '100 days'),
('44444444-4444-4444-4444-444444444446', 'client6@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Панова Дарья Игоревна', '+79051110006', NULL, NULL, NOW() - INTERVAL '95 days'),
('44444444-4444-4444-4444-444444444447', 'client7@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Ершов Владимир Николаевич', '+79051110007', NULL, NULL, NOW() - INTERVAL '90 days'),
('44444444-4444-4444-4444-444444444448', 'client8@fitdemo.ru', '$2b$12$fXKPUI6xRfv9kMmE69fih.SesCAMGsm8FAcakDFGiw59..93JZsfG', 'User',    'Соколова Полина Артемовна', '+79051110008', NULL, NULL, NOW() - INTERVAL '85 days');

INSERT INTO "Categories" ("Id", "Name")
VALUES
(1, 'Йога'),
(2, 'Кроссфит'),
(3, 'Пилатес'),
(4, 'Бокс'),
(5, 'Танцы'),
(6, 'Функциональный тренинг');

INSERT INTO "Memberships" ("Id", "Name", "Description", "Price", "DurationDays", "CreatedAt")
VALUES
(1, 'Старт', 'Доступ к тренажерному залу в дневное время', 2900.00, 30, NOW() - INTERVAL '120 days'),
(2, 'Стандарт', 'Зал + групповые тренировки', 4500.00, 30, NOW() - INTERVAL '120 days'),
(3, 'Премиум', 'Полный доступ + персональные приоритеты', 7900.00, 30, NOW() - INTERVAL '120 days'),
(4, 'Семейный', 'Два посещения в одном тарифе', 11900.00, 30, NOW() - INTERVAL '120 days');

INSERT INTO "MembershipOptions" ("Id", "MembershipId", "OptionText")
VALUES
(1, 1, 'Тренажерный зал (08:00-16:00)'),
(2, 1, 'Раздевалка и душ'),
(3, 2, 'Тренажерный зал без ограничений'),
(4, 2, 'Групповые занятия'),
(5, 2, 'Базовая консультация тренера'),
(6, 3, 'Все групповые занятия'),
(7, 3, 'Приоритет записи на персональные'),
(8, 3, 'SPA-зона'),
(9, 4, '2 гостевых профиля'),
(10, 4, 'Доступ в выходные и праздники');

WITH base AS (
    SELECT date_trunc('day', NOW()) + INTERVAL '1 day' AS d
)
INSERT INTO "Trainings" ("Id", "CategoryId", "TrainerId", "Description", "StartTime", "MaxParticipants")
SELECT * FROM (
    SELECT 1, 1, '33333333-3333-3333-3333-333333333331'::uuid, 'Утренняя йога для начинающих', (SELECT d FROM base) + INTERVAL '09 hour', 20
    UNION ALL SELECT 2, 2, '33333333-3333-3333-3333-333333333332'::uuid, 'Кроссфит: выносливость', (SELECT d FROM base) + INTERVAL '11 hour', 16
    UNION ALL SELECT 3, 3, '33333333-3333-3333-3333-333333333333'::uuid, 'Пилатес: мобильность', (SELECT d FROM base) + INTERVAL '13 hour', 18
    UNION ALL SELECT 4, 4, '33333333-3333-3333-3333-333333333334'::uuid, 'Бокс: техника удара', (SELECT d FROM base) + INTERVAL '15 hour', 14
    UNION ALL SELECT 5, 5, '33333333-3333-3333-3333-333333333332'::uuid, 'Dance Mix', (SELECT d FROM base) + INTERVAL '18 hour', 22
    UNION ALL SELECT 6, 6, '33333333-3333-3333-3333-333333333331'::uuid, 'Функциональный круг', (SELECT d FROM base) + INTERVAL '19 hour', 15
    UNION ALL SELECT 7, 2, '33333333-3333-3333-3333-333333333333'::uuid, 'Кроссфит PRO', (SELECT d FROM base) + INTERVAL '2 day 10 hour', 12
    UNION ALL SELECT 8, 1, '33333333-3333-3333-3333-333333333334'::uuid, 'Йога: вечернее восстановление', (SELECT d FROM base) + INTERVAL '2 day 20 hour', 20
) t("Id","CategoryId","TrainerId","Description","StartTime","MaxParticipants");

INSERT INTO "Purchases" ("Id", "UserId", "MembershipId", "PriceAtPurchase", "Status", "CreatedAt")
VALUES
(1, '44444444-4444-4444-4444-444444444441', 2, 4500.00, 1, NOW() - INTERVAL '20 days'),
(2, '44444444-4444-4444-4444-444444444442', 2, 4500.00, 1, NOW() - INTERVAL '18 days'),
(3, '44444444-4444-4444-4444-444444444443', 3, 7900.00, 1, NOW() - INTERVAL '14 days'),
(4, '44444444-4444-4444-4444-444444444444', 1, 2900.00, 0, NOW() - INTERVAL '7 days'),
(5, '44444444-4444-4444-4444-444444444445', 1, 2900.00, 1, NOW() - INTERVAL '9 days'),
(6, '44444444-4444-4444-4444-444444444446', 4, 11900.00, 0, NOW() - INTERVAL '3 days'),
(7, '44444444-4444-4444-4444-444444444447', 2, 4500.00, 1, NOW() - INTERVAL '5 days'),
(8, '44444444-4444-4444-4444-444444444448', 3, 7900.00, 1, NOW() - INTERVAL '2 days');

INSERT INTO "Bookings" ("Id", "TrainingId", "UserId", "Status")
VALUES
(1, 1, '44444444-4444-4444-4444-444444444441', 0),
(2, 2, '44444444-4444-4444-4444-444444444442', 0),
(3, 3, '44444444-4444-4444-4444-444444444443', 0),
(4, 5, '44444444-4444-4444-4444-444444444445', 0),
(5, 6, '44444444-4444-4444-4444-444444444447', 1),
(6, 7, '44444444-4444-4444-4444-444444444448', 0);

WITH b AS (
    SELECT date_trunc('day', NOW()) + INTERVAL '1 day' AS d
)
INSERT INTO "PersonalWorkouts" ("Id", "TrainerId", "ClientId", "DateTime", "Price", "Status", "NotCompletedReason")
SELECT * FROM (
    SELECT 1, '33333333-3333-3333-3333-333333333332'::uuid, '44444444-4444-4444-4444-444444444441'::uuid, (SELECT d FROM b) + INTERVAL '10 hour', 2000.00, 2, NULL
    UNION ALL SELECT 2, '33333333-3333-3333-3333-333333333332'::uuid, NULL, (SELECT d FROM b) + INTERVAL '11 hour', 2000.00, 0, NULL
    UNION ALL SELECT 3, '33333333-3333-3333-3333-333333333332'::uuid, NULL, (SELECT d FROM b) + INTERVAL '12 hour', 2000.00, 0, NULL
    UNION ALL SELECT 4, '33333333-3333-3333-3333-333333333333'::uuid, '44444444-4444-4444-4444-444444444442'::uuid, (SELECT d FROM b) + INTERVAL '13 hour', 2500.00, 1, NULL
    UNION ALL SELECT 5, '33333333-3333-3333-3333-333333333333'::uuid, '44444444-4444-4444-4444-444444444443'::uuid, (SELECT d FROM b) + INTERVAL '14 hour', 2500.00, 2, NULL
    UNION ALL SELECT 6, '33333333-3333-3333-3333-333333333331'::uuid, NULL, (SELECT d FROM b) + INTERVAL '17 hour', 1500.00, 0, NULL
    UNION ALL SELECT 7, '33333333-3333-3333-3333-333333333331'::uuid, '44444444-4444-4444-4444-444444444445'::uuid, (SELECT d FROM b) - INTERVAL '2 day' + INTERVAL '09 hour', 1500.00, 3, NULL
    UNION ALL SELECT 8, '33333333-3333-3333-3333-333333333334'::uuid, '44444444-4444-4444-4444-444444444447'::uuid, (SELECT d FROM b) - INTERVAL '3 day' + INTERVAL '10 hour', 1000.00, 4, 'Клиент не пришел'
) t("Id","TrainerId","ClientId","DateTime","Price","Status","NotCompletedReason");

INSERT INTO "ProgressTrackers" ("Id", "UserId", "Title", "GoalValue", "Unit", "CreatedAt")
VALUES
(1, '44444444-4444-4444-4444-444444444441', 'Вес', 75, 'кг', NOW() - INTERVAL '60 days'),
(2, '44444444-4444-4444-4444-444444444441', 'Талия', 84, 'см', NOW() - INTERVAL '55 days'),
(3, '44444444-4444-4444-4444-444444444442', 'Жим лежа', 100, 'кг', NOW() - INTERVAL '40 days'),
(4, '44444444-4444-4444-4444-444444444443', 'Подтягивания', 15, 'раз', NOW() - INTERVAL '35 days'),
(5, '44444444-4444-4444-4444-444444444445', 'Вес', 68, 'кг', NOW() - INTERVAL '30 days');

INSERT INTO "ProgressEntries" ("Id", "TrackerId", "Value", "DateRecorded")
VALUES
(1, 1, 82.0, NOW() - INTERVAL '50 days'),
(2, 1, 80.4, NOW() - INTERVAL '25 days'),
(3, 1, 79.3, NOW() - INTERVAL '5 days'),
(4, 2, 92.0, NOW() - INTERVAL '50 days'),
(5, 2, 89.0, NOW() - INTERVAL '20 days'),
(6, 2, 87.5, NOW() - INTERVAL '5 days'),
(7, 3, 72.5, NOW() - INTERVAL '35 days'),
(8, 3, 80.0, NOW() - INTERVAL '10 days'),
(9, 4, 6.0, NOW() - INTERVAL '30 days'),
(10, 4, 9.0, NOW() - INTERVAL '12 days'),
(11, 5, 74.0, NOW() - INTERVAL '25 days'),
(12, 5, 71.3, NOW() - INTERVAL '7 days');

INSERT INTO "AiTrainerUsages" ("Id", "UserId", "UsageDate", "MessageCount")
VALUES
(1, '44444444-4444-4444-4444-444444444441', CURRENT_DATE - INTERVAL '1 day', 6),
(2, '44444444-4444-4444-4444-444444444442', CURRENT_DATE, 3),
(3, '44444444-4444-4444-4444-444444444443', CURRENT_DATE, 1);

INSERT INTO "AiTrainerMessages" ("Id", "UserId", "CreatedAt")
VALUES
(1, '44444444-4444-4444-4444-444444444441', NOW() - INTERVAL '22 hours'),
(2, '44444444-4444-4444-4444-444444444441', NOW() - INTERVAL '20 hours'),
(3, '44444444-4444-4444-4444-444444444442', NOW() - INTERVAL '4 hours'),
(4, '44444444-4444-4444-4444-444444444442', NOW() - INTERVAL '3 hours'),
(5, '44444444-4444-4444-4444-444444444443', NOW() - INTERVAL '1 hour');

INSERT INTO "AuditLogs" ("Id", "UserId", "EntityName", "Action", "Timestamp", "OldValues", "NewValues")
VALUES
(1, '22222222-2222-2222-2222-222222222222', 'Membership', 'Update', NOW() - INTERVAL '3 day', '{"Price": 4300}', '{"Price": 4500}'),
(2, '22222222-2222-2222-2222-222222222222', 'Training', 'Insert', NOW() - INTERVAL '2 day', NULL, '{"Description":"Функциональный круг"}'),
(3, '11111111-1111-1111-1111-111111111111', 'User', 'Update', NOW() - INTERVAL '1 day', '{"Role":"User"}', '{"Role":"Trainer"}');

SELECT setval(pg_get_serial_sequence('"Categories"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Categories"), 1), true);
SELECT setval(pg_get_serial_sequence('"Memberships"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Memberships"), 1), true);
SELECT setval(pg_get_serial_sequence('"MembershipOptions"', 'Id'), COALESCE((SELECT MAX("Id") FROM "MembershipOptions"), 1), true);
SELECT setval(pg_get_serial_sequence('"Trainings"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Trainings"), 1), true);
SELECT setval(pg_get_serial_sequence('"Purchases"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Purchases"), 1), true);
SELECT setval(pg_get_serial_sequence('"Bookings"', 'Id'), COALESCE((SELECT MAX("Id") FROM "Bookings"), 1), true);
SELECT setval(pg_get_serial_sequence('"PersonalWorkouts"', 'Id'), COALESCE((SELECT MAX("Id") FROM "PersonalWorkouts"), 1), true);
SELECT setval(pg_get_serial_sequence('"ProgressTrackers"', 'Id'), COALESCE((SELECT MAX("Id") FROM "ProgressTrackers"), 1), true);
SELECT setval(pg_get_serial_sequence('"ProgressEntries"', 'Id'), COALESCE((SELECT MAX("Id") FROM "ProgressEntries"), 1), true);
SELECT setval(pg_get_serial_sequence('"AiTrainerUsages"', 'Id'), COALESCE((SELECT MAX("Id") FROM "AiTrainerUsages"), 1), true);
SELECT setval(pg_get_serial_sequence('"AiTrainerMessages"', 'Id'), COALESCE((SELECT MAX("Id") FROM "AiTrainerMessages"), 1), true);
SELECT setval(pg_get_serial_sequence('"AuditLogs"', 'Id'), COALESCE((SELECT MAX("Id") FROM "AuditLogs"), 1), true);
