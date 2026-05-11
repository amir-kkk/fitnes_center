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

DELETE FROM "Users" WHERE "Role" <> 'Admin';

UPDATE "Users"
SET
    "Email" = 'admin@test.com',
    "FullName" = 'Администратор',
    "PasswordHash" = '$2b$12$AeyEyqb5LAP2Nc5Zme842uj0usZAZCd0/ilq3chjSN3vnxgrBxnVa'
WHERE "Role" = 'Admin';
