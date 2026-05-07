# language: uk
@epic8 @collections
Функціонал: Керування Списками (Добірками/Плейлістами)
  Як Авторизований користувач,
  Я хочу створювати власні "Списки" (як плейлісти на YouTube)
  Та гнучко налаштовувати, хто може їх бачити (приватні, публічні, або окремі користувачі).

  Передумова:
    Дано В базі даних існує користувач "user_A" (Власник) з ID "owner-uuid"
    Дано В базі даних існує користувач "user_B" (Запрошений) з ID "invited-uuid"
    Дано В базі даних існує користувач "user_C" (Сторонній)
    Дано В базі даних існує медіа "Dune" (Id: 2)
    Дано В базі даних існує медіа "Inception" (Id: 3)
    Дано "user_A" (Власник) авторизований в системі

# --- US-801: Створення Списку (Добірки) (FR2) ---

  @us-801 @happy-path
  Сценарій: Користувач створює новий список
    Дано "user_A" знаходиться на сторінці "Мої Списки"
    Коли Він натискає "Створити список"
    І Він вводить назву "Мої улюблені науково-фантастичні фільми"
    І Він вводить опис "Найкраще за 2020-2025"
    І Він натискає "Створити"
    Тоді Система створює новий запис "collection_1" у таблиці `Collections`
    І Поле "OwnerId" для "collection_1" встановлено на "owner-uuid"
    # [BRL-6] Перевірка, що список публічний за замовчуванням
    І Поле "PrivacyLevel" для "collection_1" має значення "Public"
    І Користувача перенаправляє на сторінку "collection_1"

# --- US-802: Наповнення Списку (FR2) ---

  @us-802 @happy-path
  Сценарій: Користувач додає медіа до списку
    Дано "user_A" створив список "collection_1"
    І Користувач "user_A" знаходиться на сторінці "/media/2" (Dune)
    Коли Він натискає кнопку "Додати до списку" (окрема від "відмітити статус")
    І Він обирає "Мої улюблені науково-фантастичні фільми" зі списку
    Тоді Система створює запис у таблиці `CollectionItems` (CollectionId: "collection_1", MediaId: 2)
    І Він бачить повідомлення "Додано до списку 'Мої улюблені науково-фантастичні фільми'"

  @us-802 @happy-path @soft-delete
  Сценарій: Користувач видаляє медіа зі списку
    Дано "user_A" додав "Dune" (Id: 2) до списку "collection_1"
    Коли Він переходить на сторінку списку "collection_1"
    І Він натискає "Видалити" біля "Dune"
    # Використовуємо Soft Delete
    Тоді Поле "DeletedAt" для запису в `CollectionItems` встановлюється на поточний час
    І "Dune" зникає зі списку на сторінці

# --- US-803: Зміна базової приватності (Публічний/Приватний) ---

  @us-803 @happy-path
  Сценарій: Власник робить список повністю приватним
    Дано "user_A" є власником публічного списку "collection_1" (`PrivacyLevel: Public`)
    Коли Він переходить на сторінку налаштувань "collection_1"
    І Він відкриває модальне вікно "Налаштувати доступ"
    І Він змінює базовий рівень з "Публічний" на "Приватний (лише запрошені)"
    І Він натискає "Зберегти"
    Тоді Поле "PrivacyLevel" для "collection_1" оновлюється на "Private"
    І Поле "UpdatedAt" для "collection_1" оновлюється

  @us-803 @negative-path
  Сценарій: Сторонній користувач "user_C" не бачить приватний список
    Дано "user_A" є власником приватного списку "collection_1" (`PrivacyLevel: Private`)
    Коли "user_C" (Сторонній) переходить на профіль "/profile/user_A" (вкладка "Списки")
    Тоді "user_C" НЕ бачить "collection_1" у списку "user_A"

# --- US-804: Надання доступу окремим користувачам (Granular Access) ---

  @us-804 @happy-path
  Сценарій: Власник надає доступ "user_B" до приватного списку
    Дано "user_A" є власником приватного списку "collection_1" (`PrivacyLevel: Private`)
    І "user_B" ще не має доступу до "collection_1"
    Коли "user_A" відкриває модальне вікно "Налаштувати доступ" для "collection_1"
    І У полі "Запросити" він вводить нікнейм "user_B"
    І Він натискає "Надати доступ"
    Тоді Система створює запис у `CollectionAccess` (CollectionId: "collection_1", UserId: "invited-uuid")
    І "user_B" з'являється у списку людей з доступом

  @us-804 @happy-path
  Сценарій: Запрошений користувач "user_B" бачить приватний список
    Дано "user_A" надав "user_B" доступ до приватного списку "collection_1" (`PrivacyLevel: Private`)
    Коли "user_B" (Запрошений) переходить на профіль "/profile/user_A" (вкладка "Списки")
    Тоді "user_B" бачить "collection_1" у списку "user_A" (можливо, з позначкою "Надано доступ")

  @us-804 @happy-path
  Сценарій: Власник забирає доступ у "user_B"
    Дано "user_A" надав "user_B" доступ до "collection_1"
    Коли "user_A" відкриває модальне вікно "Налаштувати доступ"
    І Він натискає "Видалити доступ" біля "user_B"
    Тоді Запис (CollectionId: "collection_1", UserId: "invited-uuid") видаляється з `CollectionAccess`

# --- US-805: Видалення Списку (Soft Delete) ---

  @us-805 @happy-path @soft-delete
  Сценарій: Власник (м'яко) видаляє свій список
    Дано "user_A" є власником списку "collection_1"
    Коли "user" переходить на сторінку налаштувань "collection_1"
    І Він натискає "Видалити список"
    І Він підтверджує дію
    Тоді Поле "DeletedAt" для "collection_1" встановлюється на поточний час
    # Завдяки Global Query Filter, список зникне звідусіль

# ---
# 
# 🛠️ Завдання для Backend (.Net / EF / Postgres)
#
# 1.  **BaseEntity (Нагадування):**
#     * Створити `BaseEntity` з: `Id` (Guid v7), `CreatedAt`, `UpdatedAt`, `DeletedAt` (nullable).
#     * Успадкувати `Collections` та `CollectionItems` від `BaseEntity`.
#     * Налаштувати **Global Query Filter** в EF Core: `.Where(e => e.DeletedAt == null)` для всіх сутностей, що успадковують `BaseEntity`.
#
# 2.  **Модель даних: `Collections`**
#     * Успадковує `BaseEntity`.
#     * `OwnerId` (Guid, FK до `Users.Id`).
#     * `Name` (string, Not null).
#     * `Description` (string, nullable).
#     * `PrivacyLevel` (enum: `Private = 0`, `Public = 1`) - Default: `Public` (Реалізація BRL-6).
#
# 3.  **[НОВА] Модель даних: `CollectionAccess`**
#     * **НЕ** успадковує `BaseEntity`, оскільки видалення має бути жорстким.
#     * `Id` (Guid v7, PK).
#     * `CollectionId` (Guid, FK до `Collections.Id`).
#     * `UserId` (Guid, FK до `Users.Id`).
#     * `CreatedAt` (DateTime, `DateTime.UtcNow`).
#     * **Важливо:** Створити унікальний композитний індекс `(CollectionId, UserId)`, щоб уникнути дублікатів.
#
# 4.  **[КРИТИЧНО] Сервіс: `ICollectionAccessService`**
#     * Потрібен сервіс для інкапсуляції складної логіки перевірки доступу.
#     * `bool CanView(Guid collectionId, Guid? currentUserId)`:
#         * 1. Отримати `collection` (разом з `OwnerId` та `PrivacyLevel`).
#         * 2. Якщо `collection.PrivacyLevel == Public` -> `return true`.
#         * 3. Якщо `currentUserId == null` (гість) -> `return false`.
#         * 4. Якщо `collection.OwnerId == currentUserId` -> `return true`.
#         * 5. Перевірити, чи існує запис у `CollectionAccess` (`WHERE CollectionId = collectionId AND UserId = currentUserId`).
#         * 6. Якщо так -> `return true`.
#         * 7. В іншому випадку -> `return false`.
#     * `bool CanEdit(Guid collectionId, Guid? currentUserId)`:
#         * (Зараз) Перевіряє `collection.OwnerId == currentUserId`.
#
# 5.  **API Ендпоінти (Controller): `CollectionsController`**
#     * `POST /api/collections`: Створює `Collection`. `OwnerId` береться з `HttpContext.User`.
#     * `PUT /api/collections/{id}`: Оновлює `Name`, `Description`, `PrivacyLevel`. *Перед* виконанням перевірити `ICollectionAccessService.CanEdit(...)`.
#     * `DELETE /api/collections/{id}`: **Soft Delete** `Collection`. Перевірити `ICollectionAccessService.CanEdit(...)`.
#     * `GET /api/collections/{id}`: Отримує 1 збірку. *Перед* виконанням перевірити `ICollectionAccessService.CanView(...)`.
#     * `GET /api/profiles/{username}/collections`: Отримує списки для профілю.
#         * **Логіка:** Має виконати складний `JOIN`:
#           `SELECT c FROM Collections c LEFT JOIN CollectionAccess ca ON c.Id = ca.CollectionId`
#           `WHERE (c.OwnerId = {profile_user_id} AND (c.PrivacyLevel = 'Public' OR c.OwnerId = {current_user_id} OR ca.UserId = {current_user_id}))`
#           `AND c.DeletedAt IS NULL` (Global Query Filter має це зробити автоматично).
#
# 6.  **API Ендпоінти (Controller): `CollectionAccessController`** (Або в `CollectionsController`)
#     * `GET /api/collections/{id}/access`: Повертає список `User` (або `UserDto`), які мають доступ (з `CollectionAccess`). Перевірити `CanEdit`.
#     * `POST /api/collections/{id}/access`: **[НОВИЙ]** Ендпоінт для US-804. Приймає DTO `{"username": "user_B"}`. Перевірити `CanEdit`.
#     * `DELETE /api/collections/{id}/access/{userId}`: **[НОВИЙ]** Ендпоінт для видалення доступу (жорстке видалення з `CollectionAccess`). Перевірити `CanEdit`.
#
# 7.  **API Ендпоінти (Controller): `CollectionItemsController`**
#     * `POST /api/collections/{collectionId}/items`: Додає медіа до `CollectionItems`. Перевірити `CanEdit(collectionId)`.
#     * `DELETE /api/collection-items/{itemId}`: **Soft Delete** `CollectionItem`. Перевірити `CanEdit` для батьківського `collectionId`.
#
# ---
#
# 🎨 Завдання для Frontend (Svelte-kit)
#
# 1.  **Компонент (на сторінці медіа): `AddToListButton.svelte`**
#     * Кнопка (напр., іконка "+") поруч із `StatusButton.svelte`.
#     * При кліку завантажує `GET /api/collections/my` (спеціальний ендпоінт, що повертає *лише* списки авторизованого юзера).
#     * Показує випадаюче меню/модальне вікно з цими списками.
#     * При виборі списку: викликає `POST /api/collections/{collectionId}/items`.
#
# 2.  **Сторінка Профілю (Вкладка "Списки"):**
#     * Додати вкладку "Списки" на `src/routes/profile/[username]/+page.svelte`.
#     * Завантажує `GET /api/profiles/[username]/collections`.
#     * **Логіка рендерингу (US-803/804):**
#         * Фронтенду не потрібно знати *чому* він бачить список (чи то він публічний, чи то йому надали доступ) - бекенд вже виконав всю складну фільтрацію.
#         * Якщо `data.profile.username === $page.data.user.username`, показувати позначку "(Приватний)" для списків з `privacyLevel: 'Private'`.
#
# 3.  **[НОВИЙ] Компонент: `ShareModal.svelte`**
#     * Модальне вікно (US-804), яке завантажує `GET /api/collections/[id]/access`.
#     * Показує:
#         * 1. Випадаючий список (`<select>`) з базовим рівнем: "Публічний" / "Приватний (лише запрошені)". (Викликає `PUT /api/collections/{id}`).
#         * 2. Поле "Запросити користувачів": `<input>` для пошуку користувачів (має викликати `GET /api/users/search?q=...`).
#         * 3. При виборі юзера -> `POST /api/collections/{id}/access`.
#         * 4. Список користувачів, які вже мають доступ.
#         * 5. Кнопка "Видалити доступ" біля кожного (викликає `DELETE /api/collections/{id}/access/{userId}`).
#
# 4.  **Маршрути для CRUD Списків:**
#     * `src/routes/collections/new`: Форма для створення списку.
#     * `src/routes/collections/[id]/+page.svelte`: Показ вмісту списку. Має кнопку "Налаштувати доступ", якщо `data.collection.ownerId === $page.data.user.id`.
#     * `src/routes/collections/[id]/settings`: (Можливо, об'єднано з `ShareModal`). Сторінка для редагування `Name`, `Description` та кнопка "Видалити список" (з модальним вікном підтвердження).
#