import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display contact form correctly', async ({ page }) => {
    // Check if main elements are visible
    await expect(page.locator('h1')).toContainText('Contato & Termos');
    await expect(page.locator('[data-state="active"]')).toContainText('Contato');

    // Check form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="subject"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator('input[name="acceptTerms"]')).toBeVisible();

    // Check submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Enviar Mensagem');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=Nome deve ter pelo menos 3 caracteres')).toBeVisible();
    await expect(page.locator('text=Por favor, insira um e-mail válido')).toBeVisible();
    await expect(page.locator('text=Assunto deve ter pelo menos 3 caracteres')).toBeVisible();
    await expect(page.locator('text=Mensagem deve ter pelo menos 10 caracteres')).toBeVisible();
    await expect(page.locator('text=Você deve aceitar os termos de serviço')).toBeVisible();
    await expect(page.locator('text=Por favor, complete a verificação captcha')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Por favor, insira um e-mail válido')).toBeVisible();
  });

  test('should format phone number correctly', async ({ page }) => {
    await page.fill('input[name="phone"]', '94984211357');

    // Check if phone is formatted
    await expect(page.locator('input[name="phone"]')).toHaveValue('(94) 98421-1357');
  });

  test('should submit contact form successfully with valid data', async ({ page }) => {
    // Fill all required fields
    await page.fill('input[name="name"]', 'João Silva');
    await page.fill('input[name="email"]', 'joao@example.com');
    await page.fill('input[name="phone"]', '94984211357');
    await page.fill('input[name="subject"]', 'Dúvida sobre trabalhos');
    await page.fill('textarea[name="message"]', 'Gostaria de mais informações sobre os serviços oferecidos');

    // Check terms checkbox
    await page.check('input[name="acceptTerms"]');

    // Note: In real tests, we would need to handle reCAPTCHA
    // For E2E tests, we might need to mock or use test keys
    // For now, we'll simulate the captcha token being set
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        // Simulate captcha completion for testing
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'captchaToken';
        hiddenInput.value = 'test-captcha-token';
        form.appendChild(hiddenInput);
      }
    });

    // Mock the API call to avoid actually sending emails during tests
    await page.route('**/contact', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          messageId: 'test-message-id-123'
        })
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Check for success message (toast)
    await expect(page.locator('text=Mensagem enviada com sucesso!')).toBeVisible();

    // Check if form was reset
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('input[name="subject"]')).toHaveValue('');
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    await expect(page.locator('input[name="acceptTerms"]')).not.toBeChecked();
  });

  test('should show error toast on API failure', async ({ page }) => {
    // Fill form with valid data
    await page.fill('input[name="name"]', 'João Silva');
    await page.fill('input[name="email"]', 'joao@example.com');
    await page.fill('input[name="subject"]', 'Test Subject');
    await page.fill('textarea[name="message"]', 'Test message content');
    await page.check('input[name="acceptTerms"]');

    // Simulate captcha completion
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'captchaToken';
        hiddenInput.value = 'test-captcha-token';
        form.appendChild(hiddenInput);
      }
    });

    // Mock API failure
    await page.route('**/contact', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('text=Erro ao enviar mensagem')).toBeVisible();
  });

  test('should switch to terms tab when terms link is clicked', async ({ page }) => {
    // Click on terms link in the checkbox label
    await page.click('text=Termos de Serviço');

    // Check if terms tab is active
    await expect(page.locator('[value="terms"][data-state="active"]')).toBeVisible();
    await expect(page.locator('text=Contrato de Prestação de Serviços Acadêmicos')).toBeVisible();
  });

  test('should display contact information correctly', async ({ page }) => {
    // Check email
    await expect(page.locator('text=trabalhos.academicos.assessoria2@gmail.com')).toBeVisible();

    // Check WhatsApp number
    await expect(page.locator('text=(94) 98421-1357')).toBeVisible();

    // Check business hours
    await expect(page.locator('text=Segunda–Sexta: 09h–18h')).toBeVisible();
    await expect(page.locator('text=Sábados: 09h–13h')).toBeVisible();

    // Check address
    await expect(page.locator('text=Quadra 57 Lote nº 25')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    // Check FAQ title
    await expect(page.locator('text=Perguntas Frequentes')).toBeVisible();

    // Check if FAQ items are present
    await expect(page.locator('text=Qual o prazo de entrega dos trabalhos personalizados?')).toBeVisible();
    await expect(page.locator('text=Como recebo os trabalhos comprados?')).toBeVisible();
    await expect(page.locator('text=Quais formas de pagamento são aceitas?')).toBeVisible();

    // Test accordion functionality
    await page.click('text=Qual o prazo de entrega dos trabalhos personalizados?');
    await expect(page.locator('text=Para artigos e trabalhos menores: 3 a 5 dias úteis')).toBeVisible();
  });

  test('should open WhatsApp when contact button is clicked', async ({ page }) => {
    // Mock window.open to prevent actual navigation
    await page.evaluate(() => {
      window.open = (url) => {
        console.log('WhatsApp URL:', url);
        return null;
      };
    });

    // Click WhatsApp button
    await page.click('text=(94) 98421-1357');

    // In a real test, we would check if the correct WhatsApp URL was called
    // For now, we just verify the button is clickable
    await expect(page.locator('text=(94) 98421-1357')).toBeVisible();
  });

  test('should display loading state during form submission', async ({ page }) => {
    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="subject"]', 'Test Subject');
    await page.fill('textarea[name="message"]', 'Test message content');
    await page.check('input[name="acceptTerms"]');

    // Simulate captcha completion
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'captchaToken';
        hiddenInput.value = 'test-captcha-token';
        form.appendChild(hiddenInput);
      }
    });

    // Mock slow API response
    await page.route('**/contact', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Check loading state
    await expect(page.locator('text=Enviando...')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Wait for completion
    await expect(page.locator('text=Mensagem enviada com sucesso!')).toBeVisible();
  });
});

test.describe('Terms of Service', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
    // Switch to terms tab
    await page.click('text=Termos de Serviço');
  });

  test('should display all terms sections', async ({ page }) => {
    // Check main sections
    await expect(page.locator('text=1. Informações Importantes')).toBeVisible();
    await expect(page.locator('text=2. Partes Contratantes')).toBeVisible();
    await expect(page.locator('text=3. Objeto do Contrato')).toBeVisible();
    await expect(page.locator('text=4. Direitos e Deveres')).toBeVisible();
    await expect(page.locator('text=5. Prazos e Entregas')).toBeVisible();
    await expect(page.locator('text=6. Condições de Pagamento')).toBeVisible();
    await expect(page.locator('text=7. Suporte e Atendimento')).toBeVisible();
    await expect(page.locator('text=8. Política de Cancelamento')).toBeVisible();
    await expect(page.locator('text=9. Propriedade Intelectual')).toBeVisible();
    await expect(page.locator('text=10. Termo de Aceite Digital')).toBeVisible();
    await expect(page.locator('text=11. Disposições Finais')).toBeVisible();
  });

  test('should display service types', async ({ page }) => {
    await expect(page.locator('text=Elaboração de trabalhos acadêmicos personalizados')).toBeVisible();
    await expect(page.locator('text=Revisão e formatação de textos acadêmicos')).toBeVisible();
    await expect(page.locator('text=Consultoria em metodologia científica')).toBeVisible();
    await expect(page.locator('text=E-books e materiais didáticos')).toBeVisible();
    await expect(page.locator('text=Cursos online e treinamentos')).toBeVisible();
  });

  test('should display payment options', async ({ page }) => {
    await expect(page.locator('text=PIX: Desconto de 5% sobre o valor total')).toBeVisible();
    await expect(page.locator('text=Cartão de crédito: Parcelamento em até 12x')).toBeVisible();
    await expect(page.locator('text=Boleto bancário: À vista')).toBeVisible();
  });

  test('should display delivery timeframes', async ({ page }) => {
    await expect(page.locator('text=Artigos e trabalhos menores: 3 a 5 dias úteis')).toBeVisible();
    await expect(page.locator('text=TCCs e projetos maiores: 15 a 30 dias úteis')).toBeVisible();
    await expect(page.locator('text=Revisões: 24 a 48 horas')).toBeVisible();
  });

  test('should display company information', async ({ page }) => {
    await expect(page.locator('text=LN Educacional')).toBeVisible();
    await expect(page.locator('text=Quadra 57 Lote nº 25, Avenida Wagner Pereira da Silva')).toBeVisible();
    await expect(page.locator('text=trabalhos.academicos.assessoria2@gmail.com')).toBeVisible();
    await expect(page.locator('text=(94) 98421-1357')).toBeVisible();
  });
});