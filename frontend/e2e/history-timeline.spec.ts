import { test, expect } from '@playwright/test';

test.describe('Historial en detalle de solicitud (repro reporte usuario)', () => {
  test('Al cambiar estado y abrir detalle, el timeline muestra el cambio', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mesa de Ayuda Tecnológica' })).toBeVisible();

    const title = `Historial E2E-${Date.now()}`;
    await page.getByTestId('new-ticket-btn').click();
    await page.getByTestId('ticket-title').fill(title);
    await page
      .getByTestId('ticket-description')
      .fill('Descripcion larga para verificar que el historial aparece en el detalle.');
    await page.getByTestId('ticket-applicant').fill('QA Historial');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

    const row = page.locator('tr', { hasText: title }).first();
    await row.getByTitle('Cambiar estado').click();
    await page.getByTestId('status-new').selectOption('En_progreso');
    await page.getByTestId('status-responsible').fill('QA Historial');
    await page.getByTestId('status-observation').fill('Aviso de prueba de historial');
    await page.getByTestId('status-submit').click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

    const row2 = page.locator('tr', { hasText: title }).first();
    await row2.getByTitle('Ver detalle').click();
    await expect(page.getByText('Detalle de la solicitud')).toBeVisible();
    await expect(page.getByText(/Historial de cambios \(2\)/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Pendiente → En progreso')).toBeVisible();
  });
});
