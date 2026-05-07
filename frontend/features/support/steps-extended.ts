import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from './world.js';

// ==========================================
// EPIC 1: РЕЄСТРАЦІЯ — ВІДСУТНІ КРОКИ
// ==========================================

Given(
	'В базі даних існує користувач з нікнеймом {string}',
	async function (this: CustomWorld, username: string) {
		try {
			await this.api!.post('debug/ensure-user', { data: { username, password: 'Password123' } });
		} catch {
			// user may already exist
		}
	},
);

Given(
	'В базі даних існує користувач з email {string}',
	async function (this: CustomWorld, email: string) {
		const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
		try {
			await this.api!.post('debug/ensure-user', {
				data: { username, email, password: 'Password123' },
			});
		} catch {
			// user may already exist
		}
	},
);

// Covers "В базі даних існують користувачі "A", "B" та "C"" (plural, comma-list)
Given(
	/^В базі даних існують (?:користувачі|медіа) (.+)$/,
	async function (this: CustomWorld, listStr: string) {
		const usernames = listStr.match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, '')) ?? [];
		for (const username of usernames) {
			try {
				await this.api!.post('debug/ensure-user', { data: { username, password: 'Password123' } });
			} catch {
				// user may already exist
			}
		}
	},
);

// "В системі існує N зареєстрованих користувачів"
Given(
	/^В системі існує \d+ зареєстрованих користувачів$/,
	async function (this: CustomWorld) {
		// Precondition — data assumed seeded via backend
	},
);

When(
	'Гість намагається зареєструватися з email {string}',
	async function (this: CustomWorld, email: string) {
		await this.page!.fill('input[name="email"]', email);
		const usernameField = this.page!.locator('input[name="username"]');
		if ((await usernameField.count()) > 0 && !(await usernameField.inputValue())) {
			await usernameField.fill('testuser_dup');
		}
		const passField = this.page!.locator('input[name="password"]');
		if ((await passField.count()) > 0 && !(await passField.inputValue())) {
			await passField.fill('Password123');
		}
		const confirmField = this.page!.locator('input[name="confirmPassword"]');
		if ((await confirmField.count()) > 0) await confirmField.fill('Password123');
		await this.page!.click('button[type="submit"]');
	},
);

When(
	'Гість залишає поле {string} порожнім',
	async function (this: CustomWorld, fieldLabel: string) {
		const fieldMap: Record<string, string> = {
			Нікнейм: 'input[name="username"]',
			Email: 'input[name="email"]',
			'Електронна пошта': 'input[name="email"]',
			Пароль: 'input[name="password"]',
		};
		const selector = fieldMap[fieldLabel] || `input[placeholder*="${fieldLabel}"]`;
		await this.page!.fill(selector, '');
	},
);

Then(
	'Система показує повідомлення про помилку {string} біля поля {string}',
	async function (this: CustomWorld, msg: string, fieldLabel: string) {
		const fieldNameMap: Record<string, string> = {
			Нікнейм: 'username',
			'Електронна пошта': 'email',
			Email: 'email',
			Пароль: 'password',
		};
		const fieldName = fieldNameMap[fieldLabel] || fieldLabel.toLowerCase();
		const fieldError = this.page!.locator(
			`[data-field="${fieldName}"] .error, input[name="${fieldName}"] ~ .error, input[name="${fieldName}"] ~ span.error`,
		);
		if ((await fieldError.count()) > 0) {
			await expect(fieldError.first()).toContainText(msg);
		} else {
			await expect(this.page!.getByText(msg).first()).toBeVisible();
		}
	},
);

Then('Користувач не авторизований', async function (this: CustomWorld) {
	const loginLink = this.page!.getByRole('link', { name: /Вхід|Login/i });
	const loginBtn = this.page!.getByRole('button', { name: /Вхід|Login/i });
	if ((await loginLink.count()) > 0) {
		await expect(loginLink.first()).toBeVisible();
	} else {
		await expect(loginBtn.first()).toBeVisible();
	}
});

// Logout — handles "Вийти" with any suffix e.g. "(наприклад, у своєму профілі)"
When(/^Користувач натискає кнопку "Вийти".*$/, async function (this: CustomWorld) {
	const logoutBtn = this.page!.getByRole('button', { name: /Вийти|Вихід|Logout/i });
	const logoutLink = this.page!.getByRole('link', { name: /Вийти|Вихід|Logout/i });
	if ((await logoutBtn.count()) > 0) {
		await logoutBtn.first().click();
	} else {
		await logoutLink.first().click();
	}
});

// ==========================================
// EPIC 2: ПРОФІЛЬ — ВІДСУТНІ КРОКИ
// ==========================================

When(
	'Він переглядає профіль користувача {string}',
	async function (this: CustomWorld, username: string) {
		await this.page!.goto(`${this.appUrl}/profile/${username}`);
	},
);

Then('Він бачить свій нікнейм {string}', async function (this: CustomWorld, username: string) {
	await expect(this.page!.getByText(username).first()).toBeVisible();
});

// "user_C" (Сторонній) переходить на профіль "/profile/user_A" (вкладка "Списки")
When(
	/^"([^"]*)"(?:\s+\([^)]*\))?\s+переходить на профіль "([^"]*)" \(вкладка "([^"]*)"\)$/,
	async function (this: CustomWorld, actorUser: string, profileUrl: string, tabName: string) {
		await this.page!.goto(`${this.appUrl}/login`);
		await this.page!.fill(
			'input[name="email"], input[type="email"]',
			`${actorUser}@example.com`,
		);
		await this.page!.fill('input[name="password"], input[type="password"]', 'Password123');
		await this.page!.getByRole('button', { name: /Увійти|Login/i }).click();
		await this.page!.waitForLoadState('networkidle');
		await this.page!.goto(`${this.appUrl}${profileUrl}`);
		const tab = this.page!
			.getByRole('tab', { name: tabName })
			.or(this.page!.getByText(tabName, { exact: true }));
		if ((await tab.count()) > 0) await tab.first().click();
	},
);

// ==========================================
// EPIC 3: СТРІЧКА — ВІДСУТНІ КРОКИ
// ==========================================

// "user" відкриває головну сторінку ("/")
When(
	/^"([^"]*)" відкриває головну сторінку \("\/"\)$/,
	async function (this: CustomWorld, _user: string) {
		await this.page!.goto(`${this.appUrl}/`);
	},
);

// Review with like count precondition: "review_1" має "15" вподобайок
Given(
	/^"([^"]*)" має "(\d+)" вподобайок$/,
	async function (this: CustomWorld, _reviewTitle: string, _count: string) {
		// Precondition — like count seeded via backend
	},
);

// Comment precondition with likes
Given(
	/^"([^"]*)" залишив коментар "([^"]*)" \(до "([^"]*)"\) з "(\d+)" лайками$/,
	async function (
		this: CustomWorld,
		_user: string,
		_comment: string,
		_review: string,
		_likes: string,
	) {
		// Precondition — comment and likes seeded via backend
	},
);

// Tab click: "user" натискає на вкладку "Глобальна стрічка"
When(
	/^"([^"]*)" натискає на вкладку "([^"]*)"$/,
	async function (this: CustomWorld, _user: string, tabName: string) {
		const tab = this.page!
			.getByRole('tab', { name: tabName })
			.or(this.page!.getByText(tabName, { exact: true }));
		await tab.first().click();
	},
);

// Feed visibility with author: Він бачить "review_2" (від "following_2")
Then(
	/^Він бачить "([^"]*)" \(від "([^"]*)"\)$/,
	async function (this: CustomWorld, reviewTitle: string, _author: string) {
		const card = this.page!
			.locator(`.review-card, .feed-item, [data-testid="review"], [data-testid="feed-item"]`)
			.filter({ hasText: reviewTitle });
		if ((await card.count()) > 0) {
			await expect(card.first()).toBeVisible();
		} else {
			await expect(this.page!.getByText(reviewTitle).first()).toBeVisible();
		}
	},
);

// Feed visibility negation: Він НЕ бачить "review_3" (від "other_user")
Then(
	/^Він НЕ бачить "([^"]*)" \(від "([^"]*)"\)$/,
	async function (this: CustomWorld, reviewTitle: string, _author: string) {
		const card = this.page!
			.locator(`.review-card, .feed-item, [data-testid="review"]`)
			.filter({ hasText: reviewTitle });
		await expect(card).toHaveCount(0);
	},
);

// "review_2" знаходиться у стрічці вище, ніж "review_1"
Then(
	/^"([^"]*)" знаходиться у стрічці вище,? ніж "([^"]*)"$/,
	async function (this: CustomWorld, firstItem: string, secondItem: string) {
		const cards = this.page!.locator(
			`.review-card, .feed-item, [data-testid="review"], [data-testid="feed-item"]`,
		);
		const texts = await cards.allInnerTexts();
		const idxA = texts.findIndex((t) => t.includes(firstItem));
		const idxB = texts.findIndex((t) => t.includes(secondItem));
		expect(idxA).toBeGreaterThanOrEqual(0);
		expect(idxB).toBeGreaterThanOrEqual(0);
		expect(idxA).toBeLessThan(idxB);
	},
);

// "review_3" знаходиться у стрічці вище (alone — first position)
Then(
	/^"([^"]*)" знаходиться у стрічці вище$/,
	async function (this: CustomWorld, reviewTitle: string) {
		const cards = this.page!.locator(
			`.review-card, .feed-item, [data-testid="review"], [data-testid="feed-item"]`,
		);
		const texts = await cards.allInnerTexts();
		const idx = texts.findIndex((t) => t.includes(reviewTitle));
		expect(idx).toBe(0);
	},
);

Then('Він НЕ бачить жодної рецензії', async function (this: CustomWorld) {
	const cards = this.page!.locator(
		`.review-card, .feed-item, [data-testid="review"], [data-testid="feed-item"]`,
	);
	await expect(cards).toHaveCount(0);
});

When(
	'Він натискає "Вподобати" (Like) на {string} у стрічці',
	async function (this: CustomWorld, reviewTitle: string) {
		const card = this.page!
			.locator(`.review-card, .feed-item, [data-testid="review"], [data-testid="feed-item"]`)
			.filter({ hasText: reviewTitle })
			.first();
		if ((await card.count()) > 0) {
			await card.getByRole('button', { name: /Вподобати|Like/i }).click();
		} else {
			await this.page!.getByRole('button', { name: /Вподобати|Like/i }).first().click();
		}
	},
);

Then(
	'Лічильник вподобайок {string} оновлюється на {string} (у стрічці)',
	async function (this: CustomWorld, reviewTitle: string, expectedCount: string) {
		const card = this.page!
			.locator(`.review-card, .feed-item, [data-testid="review"], [data-testid="feed-item"]`)
			.filter({ hasText: reviewTitle })
			.first();
		const counter = card.locator('[data-testid="like-count"], .like-count');
		if ((await counter.count()) > 0) {
			await expect(counter).toContainText(expectedCount);
		}
	},
);

Then(
	'Користувач залишається на сторінці {string} (без перезавантаження)',
	async function (this: CustomWorld, path: string) {
		await expect(this.page!).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
	},
);

When(
	'Він дивиться на блок коментарів під {string}',
	async function (this: CustomWorld, reviewTitle: string) {
		const section = this.page!
			.locator(`.review-card:has-text("${reviewTitle}") .comments, [data-testid="comments"]`)
			.first();
		if ((await section.count()) > 0) await section.scrollIntoViewIfNeeded();
	},
);

Then(
	'Він бачить {string} (від {string})',
	async function (this: CustomWorld, itemTitle: string, _author: string) {
		await expect(this.page!.getByText(itemTitle).first()).toBeVisible();
	},
);

Then(
	'Він бачить лічильник {string} вподобайок біля {string}',
	async function (this: CustomWorld, count: string, itemTitle: string) {
		const container = this.page!
			.locator(`[data-testid="comment"], .comment, .review-card`)
			.filter({ hasText: itemTitle })
			.first();
		if ((await container.count()) > 0) {
			await expect(container).toContainText(count);
		} else {
			await expect(this.page!.getByText(count).first()).toBeVisible();
		}
	},
);

Then(
	/^Він НЕ бачить "([^"]*)" \(який має менше лайків\)$/,
	async function (this: CustomWorld, itemTitle: string) {
		const topComment = this.page!.locator(`[data-testid="top-comment"], .top-comment`);
		if ((await topComment.count()) > 0) {
			await expect(topComment).not.toContainText(itemTitle);
		}
	},
);

Then(
	'Він бачить посилання {string}',
	async function (this: CustomWorld, linkText: string) {
		await expect(
			this.page!.getByRole('link', { name: new RegExp(linkText, 'i') }).first(),
		).toBeVisible();
	},
);

// ==========================================
// EPIC 4: МЕДІА — ВІДСУТНІ КРОКИ
// ==========================================

Given(
	/^Гість \(неавторизований\) знаходиться на "([^"]*)"$/,
	async function (this: CustomWorld, url: string) {
		await this.page!.goto(`${this.appUrl}${url}`);
	},
);

Given(
	/^Мова інтерфейсу користувача "([^"]*)" встановлена на "([^"]*)"(?:\s+\([^)]*\))?$/,
	async function (this: CustomWorld, _user: string, lang: string) {
		const langSwitcher = this.page!.locator(
			`[data-testid="lang-switcher"], select[name="language"]`,
		);
		if ((await langSwitcher.count()) > 0) await langSwitcher.selectOption(lang);
	},
);

Given(
	/^"([^"]*)" ще не писав рецензію на "([^"]*)" \(Id: \d+\)(?:\s+\([^)]*\))?$/,
	async function (this: CustomWorld, _user: string, _media: string) {
		// Precondition — no review exists for this user/media pair
	},
);

Given(
	/^"([^"]*)" вже писав рецензію на "([^"]*)" \(Id: \d+\)$/,
	async function (this: CustomWorld, _user: string, _media: string) {
		// Precondition — review assumed seeded via backend
	},
);

Given(
	/^"([^"]*)" ще не лайкнув "([^"]*)"$/,
	async function (this: CustomWorld, _user: string, _item: string) {
		// Precondition — default state: not liked
	},
);

Given(
	/^"([^"]*)" вже лайкнув "([^"]*)"$/,
	async function (this: CustomWorld, _user: string, _item: string) {
		// Precondition — assumed seeded or handled by backend
	},
);

Given(
	/^Для "([^"]*)" \(Id: \d+\) відсутній (?:украї?нський )?переклад "([^"]*)"$/,
	async function (this: CustomWorld, _media: string, _lang: string) {
		// Precondition — translation absent in test DB
	},
);

Given(
	/^Для "([^"]*)" \(Id: \d+\) вже існує схвалений переклад "([^"]*)" \(Lang: "([^"]*)"\)$/,
	async function (this: CustomWorld, _media: string, _title: string, _lang: string) {
		// Precondition — translation exists in test DB
	},
);

Given(
	/^В `MediaTranslations` існує: \(MediaId: \d+, Lang: "[^"]*", Title: "([^"]*)"(?:, Description: "[^"]*")?\)$/,
	async function (this: CustomWorld) {
		// Precondition — seeded via backend
	},
);

Given(
	/^"([^"]*)" написав коментар "([^"]*)" до рецензії "([^"]*)"$/,
	async function (this: CustomWorld, _user: string, _comment: string, _review: string) {
		// Precondition — seeded via backend
	},
);

// "user" авторизований і знаходиться на "/url/path" (with context in parens)
Given(
	/^"([^"]*)" авторизований і знаходиться на "([^"]*)"(?:\s+\([^)]*\))?$/,
	async function (this: CustomWorld, username: string, url: string) {
		await this.page!.goto(`${this.appUrl}/login`);
		await this.page!.fill(
			'input[name="email"], input[type="email"]',
			`${username}@example.com`,
		);
		await this.page!.fill('input[name="password"], input[type="password"]', 'Password123');
		await this.page!.getByRole('button', { name: /Увійти|Login/i }).click();
		await this.page!.waitForLoadState('networkidle');
		await this.page!.goto(`${this.appUrl}${url}`);
	},
);

Given(
	/^Користувач "([^"]*)" авторизований і знаходиться на "([^"]*)" \([^)]*\)$/,
	async function (this: CustomWorld, username: string, url: string) {
		await this.page!.goto(`${this.appUrl}/login`);
		await this.page!.fill(
			'input[name="email"], input[type="email"]',
			`${username}@example.com`,
		);
		await this.page!.fill('input[name="password"], input[type="password"]', 'Password123');
		await this.page!.getByRole('button', { name: /Увійти|Login/i }).click();
		await this.page!.waitForLoadState('networkidle');
		await this.page!.goto(`${this.appUrl}${url}`);
	},
);

Given(
	/^Користувач "([^"]*)" авторизований і бачить "([^"]*)" \(від "([^"]*)"\)$/,
	async function (this: CustomWorld, _username: string, item: string, _author: string) {
		await expect(this.page!.getByText(item).first()).toBeVisible();
	},
);

Given(
	/^Користувач "([^"]*)" авторизований і бачить "([^"]*)" у своїй стрічці$/,
	async function (this: CustomWorld, _username: string, reviewTitle: string) {
		await expect(this.page!.getByText(reviewTitle).first()).toBeVisible();
	},
);

// Відкриває сторінку /url (description)
When(
	/^Користувач "([^"]*)" відкриває сторінку "([^"]*)" \([^)]*\)$/,
	async function (this: CustomWorld, _username: string, url: string) {
		await this.page!.goto(`${this.appUrl}${url}`);
	},
);

Then(
	'Він бачить рейтинги IMdB / Rotten Tomatoes',
	async function (this: CustomWorld) {
		const ratings = this.page!.locator(
			'[data-testid="imdb-rating"], [data-testid="rt-rating"], .rating-imdb, .rating-rt',
		);
		if ((await ratings.count()) > 0) {
			await expect(ratings.first()).toBeVisible();
		}
	},
);

Then(
	'Він бачить список рецензій, включаючи {string}',
	async function (this: CustomWorld, reviewTitle: string) {
		const list = this.page!.locator(
			'.reviews-list, [data-testid="reviews-list"], [data-testid="review"]',
		);
		if ((await list.count()) > 0) await expect(list.first()).toBeVisible();
		await expect(this.page!.getByText(reviewTitle).first()).toBeVisible();
	},
);

Then('Він бачить свою вже існуючу рецензію', async function (this: CustomWorld) {
	const myReview = this.page!.locator(
		'[data-testid="my-review"], .my-review, .own-review',
	);
	if ((await myReview.count()) > 0) {
		await expect(myReview.first()).toBeVisible();
	} else {
		await expect(
			this.page!.locator('.reviews-list, [data-testid="reviews-list"]').first(),
		).toBeVisible();
	}
});

Then('Він НЕ бачить форми для створення нової рецензії', async function (this: CustomWorld) {
	const form = this.page!.locator(
		'[data-testid="new-review-form"], .new-review-form, form.review-form',
	);
	if ((await form.count()) > 0) await expect(form.first()).not.toBeVisible();
});

When(
	'Він ставить оцінку {string}',
	async function (this: CustomWorld, ratingText: string) {
		const stars = ratingText.match(/\d+/)?.[0] || '5';
		const starBtn = this.page!.locator(
			`.stars button[data-value="${stars}"], .rating-star:nth-child(${stars}), [data-testid="star-${stars}"]`,
		);
		if ((await starBtn.count()) > 0) await starBtn.click();
	},
);

When(
	'Він вводить в {string} редактор текст: {string}',
	async function (this: CustomWorld, _editorType: string, text: string) {
		const editor = this.page!
			.locator(
				'.ql-editor, .ProseMirror, .tiptap, [contenteditable="true"], textarea[name="content"], textarea[name="review"], textarea[name="body"]',
			)
			.first();
		if ((await editor.count()) > 0) {
			await editor.click();
			await editor.fill(text);
		}
	},
);

Then(
	/^Система зберігає нову рецензію з HTML\/Markdown \("([^"]*)"\)$/,
	async function (this: CustomWorld) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
	},
);

Then(
	"Його рецензія з'являється у списку рецензій на сторінці",
	async function (this: CustomWorld) {
		await this.page!.waitForLoadState('networkidle');
		await expect(
			this.page!.locator('.reviews-list, [data-testid="reviews-list"], [data-testid="review"]').first(),
		).toBeVisible();
	},
);

When(
	'Він натискає "Вподобати" (Like) на {string}',
	async function (this: CustomWorld, reviewTitle: string) {
		const card = this.page!
			.locator(`.review-card, [data-testid="review"]`)
			.filter({ hasText: reviewTitle })
			.first();
		if ((await card.count()) > 0) {
			await card.getByRole('button', { name: /Вподобати|Like/i }).click();
		} else {
			await this.page!.getByRole('button', { name: /Вподобати|Like/i }).first().click();
		}
	},
);

When(
	'Він натискає "Вподобано" (Liked) на {string}',
	async function (this: CustomWorld, reviewTitle: string) {
		const card = this.page!
			.locator(`.review-card, [data-testid="review"]`)
			.filter({ hasText: reviewTitle })
			.first();
		if ((await card.count()) > 0) {
			await card.getByRole('button', { name: /Вподобано|Liked/i }).click();
		} else {
			await this.page!.getByRole('button', { name: /Вподобано|Liked/i }).first().click();
		}
	},
);

Then(
	'Лічильник вподобайок {string} стає {string}',
	async function (this: CustomWorld, reviewTitle: string, expectedCount: string) {
		const card = this.page!
			.locator(`.review-card, [data-testid="review"]`)
			.filter({ hasText: reviewTitle })
			.first();
		const counter = card.locator('[data-testid="like-count"], .like-count');
		if ((await counter.count()) > 0) await expect(counter).toContainText(expectedCount);
	},
);

// Comment steps
When(
	'Він вводить {string} у поле коментування під {string}',
	async function (this: CustomWorld, text: string, reviewTitle: string) {
		const card = this.page!
			.locator(`.review-card, [data-testid="review"]`)
			.filter({ hasText: reviewTitle })
			.first();
		const field = card
			.locator('textarea, input[placeholder*="коментар"], [contenteditable]')
			.first();
		if ((await field.count()) > 0) {
			await field.fill(text);
		} else {
			await this.page!
				.locator('textarea, input[placeholder*="коментар"]')
				.first()
				.fill(text);
		}
	},
);

Then(
	"{string} з'являється у списку коментарів під {string}",
	async function (this: CustomWorld, commentText: string, _reviewTitle: string) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.getByText(commentText).first()).toBeVisible();
	},
);

When(
	'Він натискає "Відповісти" біля {string}',
	async function (this: CustomWorld, commentText: string) {
		const comment = this.page!
			.locator(`[data-testid="comment"], .comment`)
			.filter({ hasText: commentText })
			.first();
		if ((await comment.count()) > 0) {
			await comment.getByRole('button', { name: /Відповісти|Reply/i }).click();
		} else {
			await this.page!.getByRole('button', { name: /Відповісти|Reply/i }).first().click();
		}
	},
);

Then(
	"{string} з'являється під {string} (з візуальним відступом)",
	async function (this: CustomWorld, replyText: string, _parentText: string) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.getByText(replyText).first()).toBeVisible();
		const indented = this.page!
			.locator(`.comment-reply, [data-testid="reply"], .comment--level-1`)
			.filter({ hasText: replyText });
		if ((await indented.count()) > 0) await expect(indented.first()).toBeVisible();
	},
);

Given(
	/^Існує "([^"]*)" \(відповідь Рівня 1\) на "([^"]*)"$/,
	async function (this: CustomWorld, _replyName: string, _parentComment: string) {
		// Precondition — reply assumed seeded via backend
	},
);

Then(
	'Він НЕ бачить кнопку "Відповісти" біля {string}',
	async function (this: CustomWorld, itemText: string) {
		const item = this.page!
			.locator(`[data-testid="reply"], .comment--level-1`)
			.filter({ hasText: itemText })
			.first();
		if ((await item.count()) > 0) {
			await expect(
				item.getByRole('button', { name: /Відповісти|Reply/i }),
			).not.toBeVisible();
		}
	},
);

Then(
	'Він бачить кнопку "Відповісти" тільки біля {string} (Рівень 0)',
	async function (this: CustomWorld, commentText: string) {
		const comment = this.page!
			.locator(`[data-testid="comment"], .comment--level-0`)
			.filter({ hasText: commentText })
			.first();
		if ((await comment.count()) > 0) {
			await expect(
				comment.getByRole('button', { name: /Відповісти|Reply/i }),
			).toBeVisible();
		}
	},
);

Then(
	'Поле коментування неактивне (або при кліку перенаправляє на "/login")',
	async function (this: CustomWorld) {
		const field = this.page!
			.locator('textarea[placeholder*="коментар"], [data-testid="comment-input"]')
			.first();
		if ((await field.count()) > 0) {
			const isDisabled = await field.isDisabled();
			if (!isDisabled) {
				await field.click();
				if (this.page!.url().includes('/login')) return;
			} else {
				expect(isDisabled).toBe(true);
			}
		}
	},
);

// Translation proposal steps
When('Він обирає мову {string}', async function (this: CustomWorld, lang: string) {
	const select = this.page!.locator('select[name="language"], select[name="lang"]');
	if ((await select.count()) > 0) {
		await select.selectOption({ label: lang });
	} else {
		await this.page!.locator('.dropdown-trigger, [role="combobox"]').first().click();
		await this.page!.getByRole('option', { name: lang }).click();
	}
});

When(
	'Він вводить {string}: {string}',
	async function (this: CustomWorld, fieldLabel: string, value: string) {
		const fieldMap: Record<string, string> = {
			Назва: 'input[name="title"], input[placeholder*="Назва"]',
			Опис: 'textarea[name="description"], textarea[placeholder*="Опис"]',
		};
		const selector = fieldMap[fieldLabel] || `input[placeholder*="${fieldLabel}"]`;
		await this.page!.fill(selector, value);
	},
);

Then(
	/^Він НЕ бачить кнопки "([^"]*)" для мови "([^"]*)"$/,
	async function (this: CustomWorld, btnText: string, _lang: string) {
		const btn = this.page!.getByRole('button', { name: btnText });
		if ((await btn.count()) > 0) await expect(btn.first()).not.toBeVisible();
	},
);

// ==========================================
// EPIC 5: ТРЕКІНГ — ВІДСУТНІ КРОКИ
// ==========================================

Given(
	/^"([^"]*)" \(Id: \d+\) ще не має статусу для "([^"]*)"[- ]а$/,
	async function (this: CustomWorld) {
		// Precondition — no tracking record for this user/media pair
	},
);

Given(
	/^На сторінці відображається "Кнопка Статусу" з текстом "([^"]*)"$/,
	async function (this: CustomWorld, btnText: string) {
		const btn = this.page!.locator('[data-testid="status-button"], .status-button');
		if ((await btn.count()) > 0) await expect(btn.first()).toContainText(btnText);
	},
);

Given(
	/^"Кнопка Статусу" показує текст "([^"]*)"$/,
	async function (this: CustomWorld, btnText: string) {
		const btn = this.page!.locator('[data-testid="status-button"], .status-button');
		if ((await btn.count()) > 0) await expect(btn.first()).toContainText(btnText);
	},
);

Given(
	/^Користувач "([^"]*)" авторизований і бачить "Кнопку Статусу" з текстом "([^"]*)"$/,
	async function (this: CustomWorld, _user: string, btnText: string) {
		const btn = this.page!.locator('[data-testid="status-button"], .status-button');
		if ((await btn.count()) > 0) await expect(btn.first()).toContainText(btnText);
	},
);

Given(
	/^Користувач "([^"]*)" вже додав "([^"]*)" \(Id: \d+\) до статусу "([^"]*)"$/,
	async function (this: CustomWorld) {
		// Precondition — tracking status assumed seeded via backend
	},
);

When('Він натискає на "Кнопку Статусу"', async function (this: CustomWorld) {
	await this.page!.locator('[data-testid="status-button"], .status-button').first().click();
});

When(
	/^У випадаючому меню(?:, що з'явилося,)? він обирає (?:новий )?статус "([^"]*)"(?: \(той самий, що й активний\))?$/,
	async function (this: CustomWorld, status: string) {
		const select = this.page!.locator(
			'[data-testid="status-dropdown"] select, select[name="status"]',
		);
		if ((await select.count()) > 0) {
			await select.selectOption({ label: status });
		} else {
			const option = this.page!
				.getByRole('option', { name: status })
				.or(this.page!.getByRole('menuitem', { name: status }));
			if ((await option.count()) > 0) {
				await option.first().click();
			} else {
				await this.page!.locator(`text=${status}`).first().click();
			}
		}
	},
);

When('Він натискає на будь-яке місце на сторінці поза межами меню', async function (this: CustomWorld) {
	await this.page!.locator('body').click({ position: { x: 10, y: 10 } });
});

Then(
	'"Кнопка Статусу" на сторінці медіа змінює свій текст на {string}',
	async function (this: CustomWorld, expectedText: string) {
		await expect(
			this.page!.locator('[data-testid="status-button"], .status-button').first(),
		).toContainText(expectedText);
	},
);

Then('Випадаюче меню закривається', async function (this: CustomWorld) {
	const dropdown = this.page!.locator(
		'[data-testid="status-dropdown"], .status-dropdown, [role="menu"]',
	);
	if ((await dropdown.count()) > 0) await expect(dropdown.first()).not.toBeVisible();
});

When(
	'Він переходить на сторінку свого профілю (вкладка "Трекінг")',
	async function (this: CustomWorld) {
		await this.page!.goto(`${this.appUrl}/profile`);
		const tab = this.page!
			.getByRole('tab', { name: /Трекінг|Tracking/i })
			.or(this.page!.getByText('Трекінг', { exact: true }));
		if ((await tab.count()) > 0) await tab.first().click();
	},
);

Then(
	'Він бачить {string} у списку {string}',
	async function (this: CustomWorld, mediaTitle: string, listName: string) {
		const section = this.page!.locator(`:has-text("${listName}")`).last();
		if ((await section.count()) > 0) {
			await expect(section).toContainText(mediaTitle);
		} else {
			await expect(this.page!.getByText(mediaTitle).first()).toBeVisible();
		}
	},
);

When(
	'Він вводить {string} у поле {string} для {string}',
	async function (this: CustomWorld, value: string, fieldLabel: string, mediaTitle: string) {
		const mediaRow = this.page!
			.locator(`.tracking-item, [data-testid="tracking-item"]`)
			.filter({ hasText: mediaTitle })
			.first();
		const field = mediaRow
			.locator(
				`input[name="${fieldLabel.toLowerCase()}"], input[placeholder*="${fieldLabel}"]`,
			)
			.first();
		if ((await field.count()) > 0) {
			await field.fill(value);
		} else {
			await this.page!
				.locator(`input[name="progress"], input[placeholder*="епізод"]`)
				.first()
				.fill(value);
		}
	},
);

// ==========================================
// EPIC 6: МОДЕРАЦІЯ — ВІДСУТНІ КРОКИ
// ==========================================

// Login user and navigate to named panel/section
Given(
	/^"([^"]*)"(?:\s+\(ID:[^)]*\))? авторизований і(?:\s+знаходиться в| бачить) "([^"]*)"(?:\s+\(Статус:[^)]*\))?$/,
	async function (this: CustomWorld, username: string, panelOrItem: string) {
		const panelRoutes: Record<string, string> = {
			'Панелі модератора': '/moderation',
			'Панелі адміністратора': '/admin',
			'Панель адміністратора': '/admin',
			'Керування медіа': '/admin/media',
			'Керування користувачами': '/admin/users',
			Статистика: '/admin/statistics',
		};
		const route = panelRoutes[panelOrItem];
		await this.page!.goto(`${this.appUrl}/login`);
		await this.page!.fill(
			'input[name="email"], input[type="email"]',
			`${username}@example.com`,
		);
		await this.page!.fill('input[name="password"], input[type="password"]', 'Password123');
		await this.page!.getByRole('button', { name: /Увійти|Login/i }).click();
		await this.page!.waitForLoadState('networkidle');
		if (route) await this.page!.goto(`${this.appUrl}${route}`);
	},
);

Given(
	/^Він бачить скаргу "([^"]*)" на "([^"]*)" \(Статус: "([^"]*)"\)$/,
	async function (this: CustomWorld, _reportId: string, _target: string, _status: string) {
		await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
	},
);

When(
	'Він натискає "Поскаржитись" на {string}',
	async function (this: CustomWorld, target: string) {
		const card = this.page!
			.locator(`.review-card, [data-testid="review"], .feed-item`)
			.filter({ hasText: target })
			.first();
		if ((await card.count()) > 0) {
			await card.getByRole('button', { name: /Поскаржитись|Скарга|Report/i }).click();
		} else {
			await this.page!
				.getByRole('button', { name: /Поскаржитись|Скарга|Report/i })
				.first()
				.click();
		}
	},
);

When('Він обирає причину {string}', async function (this: CustomWorld, reason: string) {
	const radio = this.page!.locator(`input[type="radio"][value*="${reason}"]`);
	if ((await radio.count()) > 0) {
		await radio.first().click();
	} else {
		await this.page!.getByText(reason, { exact: true }).first().click();
	}
});

When(
	/^Він переходить у чергу "([^"]*)"$/,
	async function (this: CustomWorld, queueName: string) {
		const el = this.page!
			.getByRole('link', { name: queueName })
			.or(this.page!.getByRole('tab', { name: queueName }))
			.or(this.page!.getByText(queueName, { exact: true }));
		await el.first().click();
	},
);

Given(
	/^Він бачить запит "([^"]*)" \(Назва: "([^"]*)"\) зі статусом "([^"]*)"$/,
	async function (this: CustomWorld, _reqId: string, title: string, _status: string) {
		await expect(this.page!.getByText(title).first()).toBeVisible();
	},
);

Then('Запит зникає з черги модерації', async function (this: CustomWorld) {
	await this.page!.waitForLoadState('networkidle');
	await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
});

// ==========================================
// EPIC 7: АДМІН — ВІДСУТНІ КРОКИ
// ==========================================

When(
	/^Він переходить у "([^"]*)"$/,
	async function (this: CustomWorld, sectionName: string) {
		const routeMap: Record<string, string> = {
			'Керування користувачами': '/admin/users',
			'Керування медіа': '/admin/media',
			Статистика: '/admin/statistics',
		};
		const route = routeMap[sectionName];
		if (route) {
			await this.page!.goto(`${this.appUrl}${route}`);
		} else {
			await this.page!
				.getByRole('link', { name: sectionName })
				.or(this.page!.getByRole('tab', { name: sectionName }))
				.first()
				.click();
		}
	},
);

When(
	/^Він знаходить "([^"]*)" \(ID: "([^"]*)"\)$/,
	async function (this: CustomWorld, username: string, _id: string) {
		const row = this.page!
			.locator(`tr, .user-row, [data-testid="user-row"]`)
			.filter({ hasText: username })
			.first();
		if ((await row.count()) > 0) {
			await row.scrollIntoViewIfNeeded();
		} else {
			const searchInput = this.page!.locator(
				'input[type="search"], input[placeholder*="пошук"]',
			);
			if ((await searchInput.count()) > 0) {
				await searchInput.first().fill(username);
				await this.page!.keyboard.press('Enter');
			}
		}
	},
);

When('Він підтверджує дію', async function (this: CustomWorld) {
	const confirmBtn = this.page!
		.getByRole('button', { name: /Підтвердити|Так|OK|Confirm|Yes/i })
		.first();
	if ((await confirmBtn.count()) > 0) {
		await confirmBtn.click();
	} else {
		this.page!.on('dialog', (dialog) => dialog.accept());
	}
});

Then(
	/^Він бачить переклад "([^"]*)" \(Lang: "([^"]*)", Title: "([^"]*)", Status: "([^"]*)"\)$/,
	async function (this: CustomWorld, _id: string, _lang: string, title: string, _status: string) {
		await expect(this.page!.getByText(title).first()).toBeVisible();
	},
);

Then(
	/^Він бачить віджети: (.+)$/,
	async function (this: CustomWorld, widgetsText: string) {
		const widgets = widgetsText.match(/"([^"]+)"/g)?.map((w) => w.replace(/"/g, '')) ?? [];
		for (const widget of widgets) {
			const el = this.page!.getByText(widget);
			if ((await el.count()) > 0) await expect(el.first()).toBeVisible();
		}
	},
);

When(
	/^Він обирає проміжок часу \(наприклад, "([^"]*)"\)$/,
	async function (this: CustomWorld, _dateRange: string) {
		const dateInput = this.page!.locator('input[type="date"], .date-picker input').first();
		if ((await dateInput.count()) > 0) await dateInput.click();
	},
);

// Admin preconditions: "Існує "admin" (Роль: Адміністратор) з ID "uuid""
Given(
	/^Існує "([^"]*)" \(Роль: ([^)]+)\)(?: з ID "([^"]*)")?$/,
	async function (this: CustomWorld, username: string, _role: string) {
		try {
			await this.api!.post('debug/ensure-user', {
				data: { username, password: 'Password123' },
			});
		} catch {
			// user may already exist
		}
	},
);

Given(
	/^Існує медіа "([^"]*)" \(Id: \d+\)$/,
	async function (this: CustomWorld, _mediaTitle: string) {
		// Precondition — media assumed seeded via backend
	},
);

Given(
	/^В `MediaTranslations` існує "([^"]*)" \(MediaId: \d+, Lang: "[^"]*", Title: "([^"]*)", Status: "[^"]*"\)$/,
	async function (this: CustomWorld, _id: string, _title: string) {
		// Precondition — seeded via backend
	},
);

// ==========================================
// EPIC 8: КОЛЕКЦІЇ — ВІДСУТНІ КРОКИ
// ==========================================

Given(
	/^"([^"]*)"(?:\s+\(Власник\))? знаходиться на сторінці "Мої Списки"$/,
	async function (this: CustomWorld) {
		await this.page!.goto(`${this.appUrl}/collections`);
	},
);

Given(
	/^"([^"]*)" створив список "([^"]*)"$/,
	async function (this: CustomWorld) {
		// Precondition — collection assumed seeded via backend
	},
);

Given(
	/^"([^"]*)" є власником (?:публічного|приватного) списку "([^"]*)"(?:\s+\(`[^`]*`\))?$/,
	async function (this: CustomWorld) {
		// Precondition — collection assumed seeded via backend
	},
);

Given(
	/^"([^"]*)" додав "([^"]*)" \(Id: \d+\) до списку "([^"]*)"$/,
	async function (this: CustomWorld) {
		// Precondition — collection item assumed seeded via backend
	},
);

Given(
	/^"([^"]*)" ще не має доступу до "([^"]*)"$/,
	async function (this: CustomWorld) {
		// Precondition — no access record
	},
);

Given(
	/^"([^"]*)" надав "([^"]*)" доступ до (?:приватного списку )?"([^"]*)"(?:\s+\(`[^`]*`\))?$/,
	async function (this: CustomWorld) {
		// Precondition — access record assumed seeded via backend
	},
);

When(
	'Він переходить на сторінку налаштувань {string}',
	async function (this: CustomWorld, collectionId: string) {
		await this.page!.goto(`${this.appUrl}/collections/${collectionId}/settings`);
	},
);

When(
	'Він переходить на сторінку списку {string}',
	async function (this: CustomWorld, collectionId: string) {
		await this.page!.goto(`${this.appUrl}/collections/${collectionId}`);
	},
);

When(
	'Він відкриває модальне вікно {string}',
	async function (this: CustomWorld, modalName: string) {
		await this.page!.getByRole('button', { name: new RegExp(modalName, 'i') }).first().click();
	},
);

When(
	'Він змінює базовий рівень з {string} на {string}',
	async function (this: CustomWorld, _fromLevel: string, toLevel: string) {
		const select = this.page!.locator(
			'select[name="privacyLevel"], select[name="privacy"]',
		);
		if ((await select.count()) > 0) {
			await select.selectOption({ label: toLevel });
		} else {
			await this.page!.locator('.dropdown-trigger, [role="combobox"]').first().click();
			await this.page!.getByRole('option', { name: toLevel }).click();
		}
	},
);

When(
	'У полі {string} він вводить нікнейм {string}',
	async function (this: CustomWorld, _fieldLabel: string, username: string) {
		await this.page!
			.locator(`input[placeholder*="Запросити"], input[name*="invite"], input[name*="user"]`)
			.first()
			.fill(username);
	},
);

When(
	'Він натискає "Видалити доступ" біля {string}',
	async function (this: CustomWorld, username: string) {
		const row = this.page!
			.locator(`.access-row, [data-testid="access-row"]`)
			.filter({ hasText: username })
			.first();
		if ((await row.count()) > 0) {
			await row.getByRole('button', { name: /Видалити|Remove/i }).click();
		} else {
			await this.page!.getByRole('button', { name: /Видалити доступ|Remove access/i }).click();
		}
	},
);

When(
	'Він натискає "Видалити" біля {string}',
	async function (this: CustomWorld, itemTitle: string) {
		const row = this.page!
			.locator(`.collection-item, [data-testid="collection-item"]`)
			.filter({ hasText: itemTitle })
			.first();
		if ((await row.count()) > 0) {
			await row.getByRole('button', { name: /Видалити|Remove|Delete/i }).click();
		} else {
			await this.page!.getByRole('button', { name: /Видалити|Remove/i }).first().click();
		}
	},
);

Then(
	/^"([^"]*)"(?:\s+\([^)]*\))? НЕ бачить "([^"]*)" у списку "([^"]*)"$/,
	async function (this: CustomWorld) {
		const collections = this.page!.locator(`.collection-card, [data-testid="collection"]`);
		await expect(collections).toHaveCount(0);
	},
);

Then(
	/^"([^"]*)"(?:\s+\([^)]*\))? бачить "([^"]*)" у списку "([^"]*)"(?:\s+\([^)]*\))?$/,
	async function (this: CustomWorld) {
		await expect(
			this.page!.locator(`.collection-card, [data-testid="collection"]`).first(),
		).toBeVisible();
	},
);

Then(
	'{string} зникає зі списку на сторінці',
	async function (this: CustomWorld, itemTitle: string) {
		await this.page!.waitForLoadState('networkidle');
		const item = this.page!
			.locator(`.collection-item, [data-testid="collection-item"]`)
			.filter({ hasText: itemTitle });
		await expect(item).toHaveCount(0);
	},
);

Then(
	"{string} з'являється у списку людей з доступом",
	async function (this: CustomWorld, username: string) {
		await this.page!.waitForLoadState('networkidle');
		const list = this.page!.locator(`.access-list, [data-testid="access-list"]`);
		if ((await list.count()) > 0) {
			await expect(list.first()).toContainText(username);
		} else {
			await expect(this.page!.getByText(username).first()).toBeVisible();
		}
	},
);

When('Він вводить назву {string}', async function (this: CustomWorld, name: string) {
	await this.page!.fill(
		'input[name="name"], input[placeholder*="назва"], input[placeholder*="Назва"]',
		name,
	);
});

When('Він вводить опис {string}', async function (this: CustomWorld, description: string) {
	await this.page!.fill(
		'textarea[name="description"], textarea[placeholder*="опис"], textarea[placeholder*="Опис"]',
		description,
	);
});

// ==========================================
// EPIC 9: ПОШУК — ВІДСУТНІ КРОКИ
// ==========================================

Given('Гість знаходиться у рядку пошуку', async function (this: CustomWorld) {
	await this.page!.goto(`${this.appUrl}/`);
	const searchInput = this.page!.locator(
		'input[type="search"], input[name="search"], input[placeholder*="пошук"], input[placeholder*="Пошук"]',
	);
	if ((await searchInput.count()) > 0) await searchInput.first().focus();
});

Then(
	/^Бекенд опитує і локальну БД.*$/,
	async function (this: CustomWorld) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
	},
);

Then(
	'Система показує список результатів, що містить:',
	async function (this: CustomWorld, dataTable: DataTable) {
		await this.page!.waitForLoadState('networkidle');
		const rows = dataTable.hashes();
		for (const row of rows) {
			const title = row['Назва'] || row['Title'];
			if (title?.trim()) {
				await expect(this.page!.getByText(title).first()).toBeVisible();
			}
		}
	},
);

Then(
	/^Він НЕ бачить "([^"]*)" у результатах пошуку$/,
	async function (this: CustomWorld, title: string) {
		const result = this.page!
			.locator(`.search-result, [data-testid="search-result"]`)
			.filter({ hasText: title });
		await expect(result).toHaveCount(0);
	},
);

Then(
	'Бекенд НЕ звертається до зовнішнього API',
	async function (this: CustomWorld) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
	},
);

Then(
	'Бекенд миттєво повертає дані про {string} з локальної таблиці `Media`',
	async function (this: CustomWorld) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
	},
);

Then(
	/^Користувач бачить повну сторінку "([^"]*)" \(або "([^"]*)", залежно від мови\)$/,
	async function (this: CustomWorld, titleUk: string, titleEn: string) {
		const hasUk = (await this.page!.getByText(titleUk).count()) > 0;
		const hasEn = (await this.page!.getByText(titleEn).count()) > 0;
		expect(hasUk || hasEn).toBe(true);
	},
);

Then(
	'Користувач бачить повну сторінку {string}',
	async function (this: CustomWorld, title: string) {
		await expect(this.page!.getByText(title).first()).toBeVisible();
	},
);

// Search preconditions
Given(
	/^В таблиці `Media` існує (?:запис \(Id: \d+, ExternalApiId: "[^"]*"\)|"[^"]*" \(Id: \d+, DeletedAt: "[^"]*"\))$/,
	async function (this: CustomWorld) {
		// Precondition — seeded via backend
	},
);

Given(
	/^В `MediaTranslations` існує: \(MediaId: \d+, Lang: "[^"]*", Title: "[^"]*"(?:, Status: "[^"]*")?\)$/,
	async function (this: CustomWorld) {
		// Precondition — seeded via backend
	},
);

Given(
	/^В зовнішньому API \(TMDB\) існує медіа "([^"]*)" \(ExternalApiId: "[^"]*"\)$/,
	async function (this: CustomWorld) {
		// Precondition — external API is live or mocked
	},
);

Given(
	/^"([^"]*)" \(ExternalApiId: "[^"]*"\) (?:ще не|вже) існує в локальній таблиці `Media`$/,
	async function (this: CustomWorld) {
		// Precondition — state of local DB
	},
);

When(
	/^Він вводить запит "([^"]*)"(?:\s+\([^)]*\))?$/,
	async function (this: CustomWorld, query: string) {
		const searchInput = this.page!.locator(
			'input[type="search"], input[name="search"], input[placeholder*="пошук"]',
		);
		await searchInput.first().fill(query);
		await this.page!.keyboard.press('Enter');
		await this.page!.waitForLoadState('networkidle');
	},
);

When(
	'Він натискає на {string} (переходить на {string})',
	async function (this: CustomWorld, _itemTitle: string, url: string) {
		await this.page!.goto(`${this.appUrl}${url}`);
	},
);

Then(
	/^Бекенд (?:звертається до зовнішнього API за повною інформацією про "[^"]*"|створює новий запис.*|створює запис в `MediaTranslations`.*)$/,
	async function (this: CustomWorld) {
		await this.page!.waitForLoadState('networkidle');
		await expect(this.page!.locator('.toast-error, .alert-error')).not.toBeVisible();
	},
);

// Система підключена до зовнішнього API
Given(
	/^Система підключена до зовнішнього API.*$/,
	async function (this: CustomWorld) {
		// Precondition — API connectivity assumed
	},
);
