import { type Page, expect, test } from '@playwright/test';

// Test data
const testAdmin = {
  email: 'admin@test.com',
  password: 'admin123456',
  name: 'Admin Test User',
};

const testStudent = {
  email: 'student@test.com',
  password: 'student123456',
  name: 'Student Test User',
};

const testEbook = {
  title: 'E2E Test Ebook',
  description: 'This is a comprehensive test ebook for end-to-end testing',
  academicArea: 'CIENCIAS_EXATAS',
  authorName: 'Test Author',
  price: 2990, // R$ 29.90
  pageCount: 150,
  fileUrl: 'https://example.com/test-ebook.pdf',
  coverUrl: 'https://example.com/test-cover.jpg',
};

const freeTestEbook = {
  title: 'Free E2E Test Ebook',
  description: 'This is a free test ebook for end-to-end testing',
  academicArea: 'CIENCIAS_HUMANAS',
  authorName: 'Free Test Author',
  price: 0,
  pageCount: 50,
  fileUrl: 'https://example.com/free-test-ebook.pdf',
  coverUrl: 'https://example.com/free-test-cover.jpg',
};

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', testAdmin.email);
  await page.fill('[data-testid="password-input"]', testAdmin.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/admin/dashboard');
}

async function loginAsStudent(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', testStudent.email);
  await page.fill('[data-testid="password-input"]', testStudent.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/student/dashboard');
}

async function createEbook(page: Page, ebookData: typeof testEbook) {
  await page.goto('/admin/ebooks');
  await page.click('text=Adicionar E-book');

  await page.fill('[name="title"]', ebookData.title);
  await page.fill('[name="description"]', ebookData.description);
  await page.selectOption('[name="academicArea"]', ebookData.academicArea);
  await page.fill('[name="authorName"]', ebookData.authorName);
  await page.fill('[name="price"]', (ebookData.price / 100).toString());
  await page.fill('[name="pageCount"]', ebookData.pageCount.toString());
  await page.fill('[name="fileUrl"]', ebookData.fileUrl);
  await page.fill('[name="coverUrl"]', ebookData.coverUrl);

  await page.click('[type="submit"]');
  await page.waitForURL('/admin/ebooks');
}

test.describe('Ebook End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test users if they don't exist
    try {
      await page.goto('/auth/register');

      // Register admin user
      await page.fill('[data-testid="name-input"]', testAdmin.name);
      await page.fill('[data-testid="email-input"]', testAdmin.email);
      await page.fill('[data-testid="password-input"]', testAdmin.password);
      await page.click('[data-testid="register-button"]');

      // Note: In a real scenario, you'd need to promote this user to admin
      // through database operations or admin interface
    } catch (error) {
      // User might already exist, continue
    }
  });

  test.describe('Admin Ebook Management', () => {
    test('should complete full admin workflow: create, edit, and delete ebook', async ({
      page,
    }) => {
      // Login as admin
      await loginAsAdmin(page);

      // Navigate to ebooks management
      await page.goto('/admin/ebooks');
      await expect(page.locator('h1')).toContainText('Gerenciar E-books');

      // Create new ebook
      await page.click('text=Adicionar E-book');
      await expect(page).toHaveURL(/.*\/admin\/ebooks\/add/);

      // Fill ebook form
      await page.fill('[name="title"]', testEbook.title);
      await page.fill('[name="description"]', testEbook.description);
      await page.selectOption('[name="academicArea"]', testEbook.academicArea);
      await page.fill('[name="authorName"]', testEbook.authorName);
      await page.fill('[name="price"]', (testEbook.price / 100).toString());
      await page.fill('[name="pageCount"]', testEbook.pageCount.toString());
      await page.fill('[name="fileUrl"]', testEbook.fileUrl);
      await page.fill('[name="coverUrl"]', testEbook.coverUrl);

      // Submit form
      await page.click('[type="submit"]');
      await page.waitForURL('/admin/ebooks');

      // Verify ebook was created
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();
      await expect(page.locator('text=' + testEbook.authorName)).toBeVisible();
      await expect(page.locator('text=R$ 29,90')).toBeVisible();

      // Edit the ebook
      await page.click('[data-testid="edit-ebook-' + testEbook.title + '"]');
      await expect(page).toHaveURL(/.*\/admin\/ebooks\/edit\/.*$/);

      const updatedTitle = testEbook.title + ' - Updated';
      await page.fill('[name="title"]', updatedTitle);
      await page.click('[type="submit"]');
      await page.waitForURL('/admin/ebooks');

      // Verify ebook was updated
      await expect(page.locator('text=' + updatedTitle)).toBeVisible();

      // Delete the ebook
      await page.click('[data-testid="delete-ebook-' + updatedTitle + '"]');
      await page.click('text=Confirmar');

      // Verify ebook was deleted
      await expect(page.locator('text=' + updatedTitle)).not.toBeVisible();
    });

    test('should validate ebook form inputs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/ebooks/add');

      // Try to submit empty form
      await page.click('[type="submit"]');

      // Check for validation errors
      await expect(page.locator('text=Título é obrigatório')).toBeVisible();
      await expect(page.locator('text=Descrição é obrigatória')).toBeVisible();
      await expect(page.locator('text=Autor é obrigatório')).toBeVisible();

      // Fill with invalid data
      await page.fill('[name="title"]', 'Te'); // Too short
      await page.fill('[name="price"]', '-10'); // Negative price
      await page.fill('[name="pageCount"]', '0'); // Zero pages
      await page.fill('[name="fileUrl"]', 'not-a-url'); // Invalid URL

      await page.click('[type="submit"]');

      // Check for specific validation errors
      await expect(page.locator('text=Título deve ter pelo menos 3 caracteres')).toBeVisible();
      await expect(page.locator('text=Preço deve ser positivo')).toBeVisible();
      await expect(page.locator('text=Número de páginas deve ser maior que 0')).toBeVisible();
      await expect(page.locator('text=URL do arquivo deve ser válida')).toBeVisible();
    });
  });

  test.describe('Public Ebook Browsing', () => {
    test('should display ebooks in public catalog', async ({ page }) => {
      // Create test ebook as admin first
      await loginAsAdmin(page);
      await createEbook(page, testEbook);
      await createEbook(page, freeTestEbook);

      // Logout and browse as public user
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Sair');

      // Navigate to public ebook catalog
      await page.goto('/ebooks');
      await expect(page.locator('h1')).toContainText('E-books e Guias');

      // Verify ebooks are displayed
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();
      await expect(page.locator('text=' + freeTestEbook.title)).toBeVisible();
      await expect(page.locator('text=R$ 29,90')).toBeVisible();
      await expect(page.locator('text=Gratuito')).toBeVisible();
    });

    test('should filter ebooks by academic area', async ({ page }) => {
      await page.goto('/ebooks');

      // Apply filter
      await page.selectOption('[name="academicArea"]', 'CIENCIAS_EXATAS');

      // Verify only filtered ebooks are shown
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();
      await expect(page.locator('text=' + freeTestEbook.title)).not.toBeVisible();

      // Change filter
      await page.selectOption('[name="academicArea"]', 'CIENCIAS_HUMANAS');

      // Verify filter changed
      await expect(page.locator('text=' + testEbook.title)).not.toBeVisible();
      await expect(page.locator('text=' + freeTestEbook.title)).toBeVisible();
    });

    test('should search ebooks by title', async ({ page }) => {
      await page.goto('/ebooks');

      // Search for specific ebook
      await page.fill('[data-testid="search-input"]', 'Free E2E');

      // Verify search results
      await expect(page.locator('text=' + freeTestEbook.title)).toBeVisible();
      await expect(page.locator('text=' + testEbook.title)).not.toBeVisible();

      // Clear search
      await page.fill('[data-testid="search-input"]', '');

      // Verify all ebooks are shown again
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();
      await expect(page.locator('text=' + freeTestEbook.title)).toBeVisible();
    });
  });

  test.describe('Ebook Purchase and Download Flow', () => {
    test('should complete purchase flow for paid ebook', async ({ page }) => {
      // Login as student
      await loginAsStudent(page);

      // Navigate to ebooks
      await page.goto('/ebooks');

      // Find paid ebook and view details
      await page.click(`[data-testid="ebook-card-${testEbook.title}"] >> text=Detalhes`);
      await expect(page).toHaveURL(/.*\/ebooks\/.*$/);

      // Verify ebook details
      await expect(page.locator('h1')).toContainText(testEbook.title);
      await expect(page.locator('text=' + testEbook.description)).toBeVisible();
      await expect(page.locator('text=R$ 29,90')).toBeVisible();

      // Add to cart
      await page.click('text=Comprar e Baixar');

      // Verify cart notification
      await expect(page.locator('text=E-book adicionado ao carrinho')).toBeVisible();

      // Go to cart
      await page.click('[data-testid="cart-button"]');
      await expect(page).toHaveURL(/.*\/cart/);

      // Verify item in cart
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();
      await expect(page.locator('text=R$ 29,90')).toBeVisible();

      // Proceed to checkout
      await page.click('text=Finalizar Compra');
      await expect(page).toHaveURL(/.*\/checkout/);

      // Fill checkout form (simplified for test)
      await page.fill('[name="customerName"]', testStudent.name);
      await page.fill('[name="customerEmail"]', testStudent.email);
      await page.fill('[name="customerCpfCnpj"]', '12345678901');
      await page.selectOption('[name="paymentMethod"]', 'PIX');

      // Complete checkout
      await page.click('text=Confirmar Pedido');

      // Verify order confirmation
      await expect(page.locator('text=Pedido realizado com sucesso')).toBeVisible();
    });

    test('should allow immediate download of free ebook', async ({ page }) => {
      // Login as student
      await loginAsStudent(page);

      // Navigate to ebooks
      await page.goto('/ebooks');

      // Find free ebook
      const freeEbookCard = page.locator(`[data-testid="ebook-card-${freeTestEbook.title}"]`);
      await expect(freeEbookCard.locator('text=Gratuito')).toBeVisible();

      // Download free ebook
      await freeEbookCard.locator('text=Download Gratuito').click();

      // Verify download notification
      await expect(page.locator('text=Download iniciado')).toBeVisible();

      // Verify ebook was added to library
      await page.goto('/student/library');
      await expect(page.locator('text=' + freeTestEbook.title)).toBeVisible();
    });

    test('should prevent download of paid ebook without purchase', async ({ page }) => {
      // Login as student
      await loginAsStudent(page);

      // Try to access paid ebook download directly
      await page.goto(`/ebooks/${testEbook.title}/download`);

      // Should be redirected or see error
      await expect(page.locator('text=Você precisa comprar este e-book primeiro')).toBeVisible();
    });
  });

  test.describe('Student Library', () => {
    test('should display purchased ebooks in student library', async ({ page }) => {
      // Login as student
      await loginAsStudent(page);

      // Navigate to library
      await page.goto('/student/library');
      await expect(page.locator('h1')).toContainText('Minha Biblioteca');

      // Verify free ebook is in library (from previous test)
      await expect(page.locator('text=' + freeTestEbook.title)).toBeVisible();

      // Verify download button is available
      await expect(page.locator(`[data-testid="download-${freeTestEbook.title}"]`)).toBeVisible();
    });

    test('should allow re-download from library', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/student/library');

      // Click download button
      await page.click(`[data-testid="download-${freeTestEbook.title}"]`);

      // Verify download notification
      await expect(page.locator('text=Download iniciado')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to ebooks page
      await page.goto('/ebooks');

      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();

      // Test mobile interactions
      await page.click('[data-testid="mobile-menu"]');
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    });

    test('should work properly on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/ebooks');

      // Verify tablet layout
      await expect(page.locator('text=' + testEbook.title)).toBeVisible();

      // Verify grid layout adapts to tablet
      const ebookGrid = page.locator('[data-testid="ebooks-grid"]');
      await expect(ebookGrid).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await page.goto('/ebooks');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Verify navigation worked
      await expect(page).toHaveURL(/.*\/ebooks\/.*$/);
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/ebooks');

      // Check for ARIA labels
      await expect(page.locator('[aria-label="Buscar e-books"]')).toBeVisible();
      await expect(page.locator('[role="grid"]')).toBeVisible();
      await expect(page.locator('[aria-label="Filtrar por área acadêmica"]')).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Remove test ebooks
    try {
      await loginAsAdmin(page);
      await page.goto('/admin/ebooks');

      // Delete test ebooks if they exist
      const deleteButtons = await page.locator('[data-testid*="delete-ebook"]').all();
      for (const button of deleteButtons) {
        await button.click();
        await page.click('text=Confirmar');
      }
    } catch (error) {
      // Cleanup failed, but test should still pass
      console.log('Cleanup failed:', error);
    }
  });
});
