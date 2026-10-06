import { test, expect } from '@playwright/test';

test.describe('Reglas de negocio críticas en frontend', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mesa de Ayuda Tecnológica' })).toBeVisible();
  });

  test('Modal de cambio de estado debe exigir observación para Crítica -> Resuelta', async ({
    page,
  }) => {
    // Crear ticket crítico para probar la regla
    const title = `Critico E2E-${Date.now()}`;
    await page.getByTestId('new-ticket-btn').click();
    await page.getByTestId('ticket-title').fill(title);
    await page
      .getByTestId('ticket-description')
      .fill('Servidor de producción caído, impacto total en operación del negocio.');
    await page.getByTestId('ticket-applicant').fill('QA Critico');
    await page.getByTestId('ticket-category').selectOption('Software');
    await page.getByTestId('ticket-priority').selectOption('Critica');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

    // Abrir modal de cambio de estado (botón con title="Cambiar estado")
    const row = page.locator('tr', { hasText: title }).first();
    await row.getByTitle('Cambiar estado').click();

    // Cambiar a En_progreso primero (flujo válido Pendiente -> En_progreso)
    await page.getByTestId('status-new').selectOption('En_progreso');
    await page.getByTestId('status-responsible').fill('Ing. Guardia');
    await page.getByTestId('status-observation').fill('Se toma el caso de emergencia.');
    await page.getByTestId('status-submit').click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

    // Intentar pasar a Resuelta SIN observación -> debe mostrar error de negocio
    const row2 = page.locator('tr', { hasText: title }).first();
    await row2.getByTitle('Cambiar estado').click();
    await page.getByTestId('status-new').selectOption('Resuelta');
    await page.getByTestId('status-responsible').fill('Ing. Guardia');
    await page.getByTestId('status-observation').fill('');
    await page.getByTestId('status-submit').click();

    await expect(
      page.getByText('Una solicitud con prioridad Crítica requiere observación obligatoria')
    ).toBeVisible();

    // Ahora con observación válida debe permitir
    await page.getByTestId('status-observation').fill('Se reinició el cluster y se verificó disponibilidad al 100%.');
    await page.getByTestId('status-submit').click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
  });
});
