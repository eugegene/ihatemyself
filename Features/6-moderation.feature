# language: uk
@epic6 @moderation
Функціонал: Модерація контенту
  Як Користувач,
  Я хочу мати можливість скаржитися (репортити) на образливий контент.
  Як Модератор,
  Я хочу бачити чергу скарг та чергу запропонованих перекладів,
  Щоб підтримувати порядок та якість контенту на платформі.

  Передумова:
    Дано Існує "user" (Роль: Користувач)
    Дано Існує "moderator" (Роль: Модератор) з ID "moderator-uuid-123"
    Дано Існує медіа "Dune" (Id: 2)
    Дано "user" написав рецензію "review_1"
    # [ЗМІНЕНО] Використовуємо ENUM.
    Дано "user" запропонував переклад "Дюнааа" (Lang: "uk") для "Dune" (Id: 2) зі статусом "Pending"

# --- US-601: Скарги (Репорти) від Користувача ---

  @us-601 @happy-path
  Сценарій: Користувач скаржиться на рецензію
    Дано Користувач "user" авторизований і бачить "review_1"
    Коли Він натискає "Поскаржитись" на "review_1"
    І Він обирає причину "Спам"
    І Він натискає "Надіслати скаргу"
    # [ЗМІНЕНО] Використовуємо ENUM.
    Тоді Система створює запис у `Reports` (TargetId: "review_1_id", Status: "Pending")
    І Користувач бачить повідомлення "Скаргу надіслано"

# --- US-602: Обробка скарг Модератором (з М'яким Видаленням та Аудитом) ---

  @us-602 @happy-path
  Сценарій: Модератор обробляє скаргу (видаляє контент)
    Дано "moderator" (ID: "moderator-uuid-123") авторизований і знаходиться в "Панелі модератора"
    І Він бачить скаргу "report_1" на "review_1" (Статус: "Pending")
    Коли Він натискає "Видалити рецензію"
    Тоді Поле "DeletedAt" для "review_1" встановлюється на поточний час
    # [ЗМІНЕНО] Використовуємо ENUM.
    І Статус скарги "report_1" оновлюється на "Resolved_Deleted"
    І Поле "ProcessedByUserId" для скарги "report_1" встановлюється на "moderator-uuid-123"

  @us-602 @happy-path
  Сценарій: Модератор відхиляє скаргу (контент в нормі)
    Дано "moderator" (ID: "moderator-uuid-123") авторизований і бачить скаргу "report_1" (Статус: "Pending")
    Коли Він натискає "Відхилити скаргу"
    Тоді Поле "DeletedAt" для "review_1" залишається "null"
    # [ЗМІНЕНО] Використовуємо ENUM.
    І Статус скарги "report_1" оновлюється на "Resolved_Dismissed"
    І Поле "ProcessedByUserId" для скарги "report_1" встановлюється на "moderator-uuid-123"

# --- US-603: Модерація перекладів (з ENUM та Аудитом) ---

  @us-603 @happy-path
  Сценарій: Модератор схвалює запропонований переклад
    Дано "moderator" (ID: "moderator-uuid-123") авторизований і знаходиться в "Панелі модератора"
    Коли Він переходить у чергу "Запропоновані переклади"
    # [ЗМІНЕНО] Шукаємо за ENUM.
    І Він бачить запит "translation_1" (Назва: "Дюнааа") зі статусом "Pending"
    І Він натискає кнопку "Схвалити"
    # [ЗМІНЕНО] Використовуємо ENUM.
    Тоді Статус "translation_1" оновлюється на "Approved"
    І Поле "ProcessedByUserId" для "translation_1" встановлюється на "moderator-uuid-123"
    І Запит зникає з черги модерації

  @us-603 @happy-path
  Сценарій: Модератор відхиляє запропонований переклад
    Дано "moderator" (ID: "moderator-uuid-123") авторизований і бачить запит "translation_1" (Статус: "Pending")
    Коли Він натискає кнопку "Відхилити"
    # [ЗМІНЕНО] Використовуємо ENUM.
    Тоді Статус "translation_1" оновлюється на "Rejected"
    І Поле "ProcessedByUserId" для "translation_1" встановлюється на "moderator-uuid-123"
    І Запит зникає з черги модерації

# ---
# 
# 🛠️ Завдання для Backend (.Net / EF / Postgres)
#
# 1.  **Глобальна зміна (Soft Delete):**
#     * Створити BaseEntity, який додає: `Id` (Guid v7), `CreatedAt`, `UpdatedAt`, `DeletedAt` (nullable).
#     * Цей патерн успадковують: `Reviews`, `Comments`, `Users` тощо.
#     * **Налаштувати EF Core Global Query Filter:** `.Where(e => e.DeletedAt == null)`.
#
# 2.  **Оновлення Моделі: `Reports`**
#     * Успадкувати `BaseEntity`.
#     * **[ЗМІНЕНО]** Поле `Status` (enum `ReportStatus`): 'Pending', 'Resolved_Deleted', 'Resolved_Dismissed'.
#     * Поле `ProcessedByUserId` (Guid, nullable, FK до `Users.Id`) - (Аудит).
#
# 3.  **Оновлення Моделі: `MediaTranslations`**
#     * Успадкувати `BaseEntity`.
#     * **[ЗМІНЕНО]** Поле `Status` (enum `TranslationStatus`): 'Official', 'Pending', 'Approved', 'Rejected'.
#     * Поле `ProcessedByUserId` (Guid, nullable, FK до `Users.Id`) - (Аудит).
#     * **[ВИДАЛЕНО]** Булеві поля `IsApproved` та `IsUserSuggested` видалені.
#
# 4.  **Оновлення Логіки (Інші Епіки):**
#     * **Epic 4 (media_page):** Коли користувач пропонує переклад -> створюємо запис зі `Status = 'Pending'`.
#     * **Epic 9 (search):** Коли кешуємо з API -> створюємо запис зі `Status = 'Official'`.
#     * **Epic 9 (search):** Пошук має працювати по `WHERE Status = 'Official' OR Status = 'Approved'`.
#
# 5.  **Оновлення `ModerationController`:**
#     * `GET /api/moderation/reports`: Повертає `WHERE Status = 'Pending'`.
#     * `POST .../approve`: Встановлює `Status = 'Approved'` та `ProcessedByUserId`.
#     * `POST .../reject`: Встановлює `Status = 'Rejected'` та `ProcessedByUserId`.
#
# ---
#
# 🎨 Завдання для Frontend (Svelte-kit)
#
# * **Змін для Frontend немає.**
# * Логіка UI залишається такою ж. Бекенд абстрагує логіку станів.
#