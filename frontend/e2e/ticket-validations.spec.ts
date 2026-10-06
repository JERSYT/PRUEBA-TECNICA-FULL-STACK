import { test, expect } from '@playwright/test';

test.describe('Validaciones de formulario de tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mesa de Ayuda Tecnológica' })).toBeVisible();
  });

  test('Debe mostrar errores si se intenta crear con campos vacíos', async ({ page }) => {
    await page.getByTestId('new-ticket-btn').click();
    await page.getByTestId('ticket-submit').click();

    await expect(page.getByText('El título es obligatorio')).toBeVisible();
    await expect(page.getByText('La descripción es obligatoria')).toBeVisible();
    await expect(page.getByText('El solicitante es obligatorio')).toBeVisible();
  });

  test('Debe validar longitudes mínimas en título, descripción y solicitante', async ({ page }) => {
    await page.getByTestId('new-ticket-btn').click();

    await page.getByTestId('ticket-title').fill('Abc');
    await page.getByTestId('ticket-description').fill('Corto');
    await page.getByTestId('ticket-applicant').fill('A');
    await page.getByTestId('ticket-submit').click();

    await expect(page.getByText('Mínimo 5 caracteres')).toBeVisible();
    await expect(page.getByText('Mínimo 10 caracteres')).toBeVisible();
    await expect(page.getByText('Mínimo 3 caracteres')).toBeVisible();
  });

  test('Debe crear un ticket válido y mostrarlo en la tabla', async ({ page }) => {
    const uniqueTitle = `Ticket E2E-${Date.now()} pantalla no enciende`;
    await page.getByTestId('new-ticket-btn').click();

    await page.getByTestId('ticket-title').fill(uniqueTitle);
    await page
      .getByTestId('ticket-description')
      .fill('El equipo del área contable no enciende tras actualización de firmware, se requiere revisión.');
    await page.getByTestId('ticket-applicant').fill('QA Playwright');
    await page.getByTestId('ticket-category').selectOption('Hardware');
    await page.getByTestId('ticket-priority').selectOption('Alta');
    await page.getByTestId('ticket-submit').click();

    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 10000 });
  });

  test('Debe filtrar por búsqueda textual y por categoría', async ({ page }) => {
    await page.getByTestId('search-input').fill('impresora');
    await page.waitForTimeout(600);
    const rows = page.locator('[data-testid^="ticket-row-"]');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    await page.getByTestId('search-input').fill('');
    await page.getByTestId('category-filter').selectOption('Red');
    await page.waitForTimeout(600);
    await expect(page.locator('[data-testid^="ticket-row-"]').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
