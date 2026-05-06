import { setDefaultTimeout, setWorldConstructor, World } from '@cucumber/cucumber';
import type { IWorldOptions } from '@cucumber/cucumber'; // Додаємо 'type'
import { chromium, request } from '@playwright/test';
import type { Browser, BrowserContext, Page, APIRequestContext } from '@playwright/test'; // Додаємо 'type'

export class CustomWorld extends World {
	browser: Browser | null = null;
	context: BrowserContext | null = null;
	page: Page | null = null;
	api: APIRequestContext | null = null; // Додаємо API контекст

	appUrl: string;
	apiUrl: string; // URL твого бекенду

	constructor(options: IWorldOptions) {
		setDefaultTimeout(30 * 1000); // 30s — aligned with cucumber.cjs
		super(options);
		this.appUrl = options.parameters.appUrl || 'http://localhost:5173';
		this.apiUrl = options.parameters.apiUrl || 'http://localhost:80/api';
	}

	async openBrowser() {
		this.browser = await chromium.launch({ headless: false });
		this.context = await this.browser.newContext();
		this.page = await this.context.newPage();

		// Ініціалізуємо API клієнт
		this.api = await request.newContext({
			baseURL: this.apiUrl,
			extraHTTPHeaders: {
				Accept: 'application/json',
			},
		});
	}

	async closeBrowser() {
		await this.api?.dispose(); // Закриваємо з'єднання з API
		await this.page?.close();
		await this.context?.close();
		await this.browser?.close();
	}
}

setWorldConstructor(CustomWorld);
