# language: uk
@epic9 @search
Функціонал: Мультимовний пошук та кешування медіа-контенту
  Як Користувач (або Гість),
  Я хочу мати можливість шукати медіа-контент на будь-якій мові
  Щоб завжди знаходити потрібне медіа, незалежно від мови введення.

  Передумова:
    Дано Система підключена до зовнішнього API (наприклад, TMDB)
    # --- Медіа, яке ВЖЕ є в нашій базі (кеші) ---
    І В таблиці `Media` існує запис (Id: 1, ExternalApiId: "tmdb-550")
    # Переклади для "tmdb-550"
    І В `MediaTranslations` існує: (MediaId: 1, Lang: "en", Title: "Fight Club", Status: "Official")
    І В `MediaTranslations` існує: (MediaId: 1, Lang: "uk", Title: "Бійцівський клуб", Status: "Approved")
    # Запропонований, але не схвалений переклад
    І В `MediaTranslations` існує: (MediaId: 1, Lang: "uk", Title: "Клуб забіяк", Status: "Pending")
    
    # --- Медіа, якого НЕМАЄ в нашій базі (тільки в API) ---
    І В зовнішньому API (TMDB) існує медіа "Dune" (ExternalApiId: "tmdb-438631")
    І "Dune" (ExternalApiId: "tmdb-438631") ще не існує в локальній таблиці `Media`
    
    # --- Медіа, яке було (м'яко) видалено ---
    І В таблиці `Media` існує "Deleted Movie" (Id: 3, DeletedAt: "2025-10-10T10:00:00Z")

# --- US-901: Пошук медіа (Локальна БД + API) ---

  @us-901 @happy-path
  Сценарій: Користувач шукає медіа та бачить зведені результати
    Дано Гість знаходиться у рядку пошуку
    Коли Він вводить запит "Dune"
    Тоді Бекенд опитує і локальну БД (по `MediaTranslations`), і зовнішнє API (TMDB)
    І Система показує список результатів, що містить:
      | Назва     | Джерело            |
      | Dune      | (з зовнішнього API)|
    # Наш "Fight Club" не з'являється, бо запит "Dune"

  @us-901 @happy-path
  Сценарій: Користувач шукає медіа за українським перекладом (з локальної БД)
    Дано Гість знаходиться у рядку пошуку
    Коли Він вводить запит "Бійцівський"
    # Бекенд шукає в `MediaTranslations` по `Title` (Status 'Official' або 'Approved')
    Тоді Він бачить "Бійцівський клуб" (Id: 1) у результатах пошуку

  @us-901 @negative-path
  Сценарій: Пошук не знаходить не-схвалені або видалені медіа
    Дано Гість знаходиться у рядку пошуку
    Коли Він вводить запит "Клуб забіяк" (який має статус 'Pending')
    Тоді Він НЕ бачить "Бійцівський клуб" у результатах пошуку
    
    Коли Він вводить запит "Deleted Movie" (який має `DeletedAt != null`)
    Тоді Він НЕ бачить "Deleted Movie" у результатах пошуку

# --- US-902: Кешування на вимогу (Fetch & Store) ---

  @us-902 @happy-path
  Сценарій: Користувач відкриває сторінку медіа, якого ще немає в локальній БД
    Дано Користувач бачить "Dune" (ExternalApiId: "tmdb-438631") у результатах пошуку
    І Запис "tmdb-438631" ще не існує в локальній таблиці `Media`
    Коли Він натискає на "Dune" (переходить на "/media/tmdb-438631")
    # Це змушує бекенд виконати кешування
    Тоді Бекенд звертається до зовнішнього API за повною інформацією про "tmdb-438631"
    І Бекенд створює новий запис (з новим Guid v7) в таблиці `Media` (з `ExternalApiId` = "tmdb-438631")
    # Бекенд створює записи для ВСІХ офіційних перекладів
    І Бекенд створює запис в `MediaTranslations` (Lang: "en", Title: "Dune", Status: "Official")
    І Бекенд створює запис в `MediaTranslations` (Lang: "uk", Title: "Дюна", Status: "Official")
    І Користувач бачить повну сторінку "Дюна" (або "Dune", залежно від мови)

  @us-902 @happy-path
  Сценарій: Користувач відкриває сторінку медіа, яке вже є в кеші
    Дано Користувач бачить "Бійцівський клуб" (Id: 1) у результатах пошуку
    І "Бійцівський клуб" (Id: 1) вже існує в локальній таблиці `Media`
    Коли Він натискає на "Бійцівський клуб" (переходить на "/media/1")
    Тоді Бекенд НЕ звертається до зовнішнього API
    І Бекенд миттєво повертає дані про "Id: 1" з локальної таблиці `Media`
    І Користувач бачить повну сторінку "Бійцівський клуб"

# ---
# 
# 🛠️ Завдання для Backend (.Net / EF / Postgres)
#
# 1.  **BaseEntity (Нагадування):**
#     * `Media` та `MediaTranslations` успадковують `BaseEntity` (Id (Guid v7), CreatedAt, UpdatedAt, DeletedAt (nullable)).
#     * **Global Query Filter** (`.Where(e => e.DeletedAt == null)`) має бути налаштований для `Media` та `MediaTranslations`.
#
# 2.  **Модель даних `MediaTranslations` (Нагадування):**
#     * Має `Status` (enum `TranslationStatus`: 'Official', 'Pending', 'Approved', 'Rejected').
#
# 3.  **Сервіс: `IExternalMediaProvider` (напр., `TmdbService`)**
#     * Створити сервіс, який інкапсулює логіку спілкування з TMDB (або іншим API).
#     * `SearchAsync(string query)`: Шукає в TMDB.
#     * `GetByIdAsync(string externalId)`: Отримує повні дані (включаючи *всі* переклади) з TMDB.
#
# 4.  **Сервіс: `MediaSearchService` (US-901)**
#     * `SearchAsync(string query)`:
#         * 1. Викликає `_context.MediaTranslations.Where(t => t.Title.Contains(query) && (t.Status == 'Official' || t.Status == 'Approved'))`.
#         * 2. (Асинхронно) Викликає `_externalMediaProvider.SearchAsync(query)`.
#         * 3. Об'єднує (мержить) два списки, видаляючи дублікати (напр., якщо медіа є і локально, і в API).
#         * 4. Повертає зведений список DTO.
#
# 5.  **Сервіс: `MediaCacheService` (US-902)**
#     * `GetOrCreateMedia(string externalId)`:
#         * 1. Шукає `Media` в локальній БД: `_context.Media.FirstOrDefaultAsync(m => m.ExternalApiId == externalId)`.
#         * 2. Якщо `media != null` (і `DeletedAt == null`) -> повернути його.
#         * 3. Якщо `media == null`:
#             * а. Викликати `_externalMediaProvider.GetByIdAsync(externalId)`.
#             * б. Створити новий об'єкт `Media` (з новим `Guid v7`).
#             * в. Створити `List<MediaTranslation>` з *усіх* перекладів з API (з `Status = 'Official'`).
#             * г. Зберегти `Media` та його `MediaTranslations` в БД.
#             * д. Повернути нове `Media`.
#
# 6.  **API Ендпоінти (Controller):**
#     * `GET /api/search?q={query}`: Викликає `MediaSearchService.SearchAsync(query)`.
#     * `GET /api/media/external/{externalId}`: (Для результатів з API) Викликає `MediaCacheService.GetOrCreateMedia(externalId)`, а потім повертає дані (можливо, робить редирект на `/api/media/{internalId}`).
#     * `GET /api/media/{internalId}`: (Для результатів з БД) Просто повертає медіа з БД.
#
# ---
#
# 🎨 Завдання для Frontend (Svelte-kit)
#
# 1.  **Компонент: `Searchbar.svelte`**
#     * Компонент (можливо, в `Header.svelte`), який має `<input type="search">`.
#     * Реалізує "Debouncing" (відправляє запит не на кожну літеру, а через 300ms після зупинки вводу).
#     * Викликає `fetch('/api/search?q=...')`.
#
# 2.  **Відображення результатів пошуку:**
#     * Результати (з `/api/search`) мають бути списком DTO, напр.: `{ title: "Дюна", poster: "...", url: "/media/external/tmdb-438631" }` або `{ title: "Бійцівський клуб", poster: "...", url: "/media/1" }`.
#     * Фронтенд *не знає* різниці, він просто рендерить список посилань (`<a>`).
#
# 3.  **Маршрутизація (Сторінка Медіа):**
#     * Потрібні два динамічні маршрути для обробки обох типів URL:
#         * `src/routes/media/[internalId]/+page.svelte` (для GUID)
#         * `src/routes/media/external/[externalId]/+page.svelte` (для 'tmdb-xxxxx')
#     * Обидва ці маршрути (`+page.ts` `load` function) викликають свої відповідні API ендпоінти (`/api/media/[internalId]` або `/api/media/external/[externalId]`) і рендерять *ту саму* сторінку медіа.
#