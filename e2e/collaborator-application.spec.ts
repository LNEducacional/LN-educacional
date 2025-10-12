import { test, expect } from '@playwright/test';

test.describe('Collaborator Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como estudante antes de cada teste
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display collaborator form correctly', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Check if main elements are visible
    await expect(page.locator('h1')).toContainText('Seja Colaborador');
    await expect(page.locator('text=Formulário de Aplicação')).toBeVisible();

    // Check step indicator
    await expect(page.locator('text=Etapa 1 de 3')).toBeVisible();
    await expect(page.locator('text=Informações Pessoais')).toBeVisible();

    // Check form fields for step 1
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="linkedin"]')).toBeVisible();

    // Check sidebar elements
    await expect(page.locator('text=Importante: Seleção por Demanda')).toBeVisible();
    await expect(page.locator('text=Benefícios de Colaborar')).toBeVisible();
    await expect(page.locator('text=Requisitos')).toBeVisible();
  });

  test('should validate required fields in step 1', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Try to go to next step without filling required fields
    await page.click('button:has-text("Próximo")');

    // Should show validation errors
    await expect(page.locator('text=Nome deve ter pelo menos 3 caracteres')).toBeVisible();
    await expect(page.locator('text=Por favor, insira um e-mail válido')).toBeVisible();
    await expect(page.locator('text=Telefone deve conter DDD e número válido')).toBeVisible();
  });

  test('should navigate between steps correctly', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill step 1 with valid data
    await page.fill('input[name="fullName"]', 'João Silva dos Santos');
    await page.fill('input[name="email"]', 'joao.silva@example.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.fill('input[name="linkedin"]', 'https://linkedin.com/in/joaosilva');

    // Go to step 2
    await page.click('button:has-text("Próximo")');
    await expect(page.locator('text=Etapa 2 de 3')).toBeVisible();
    await expect(page.locator('text=Experiência Profissional')).toBeVisible();

    // Check step 2 fields
    await expect(page.locator('text=Área de Interesse')).toBeVisible();
    await expect(page.locator('text=Disponibilidade')).toBeVisible();
    await expect(page.locator('textarea[name="education"]')).toBeVisible();
    await expect(page.locator('textarea[name="experience"]')).toBeVisible();

    // Go back to step 1
    await page.click('button:has-text("Voltar")');
    await expect(page.locator('text=Etapa 1 de 3')).toBeVisible();

    // Check if data is preserved
    await expect(page.locator('input[name="fullName"]')).toHaveValue('João Silva dos Santos');
    await expect(page.locator('input[name="email"]')).toHaveValue('joao.silva@example.com');
  });

  test('should validate professional information in step 2', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill step 1 and go to step 2
    await page.fill('input[name="fullName"]', 'Maria Santos');
    await page.fill('input[name="email"]', 'maria@example.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.click('button:has-text("Próximo")');

    // Try to go to step 3 without filling required fields
    await page.click('button:has-text("Próximo")');

    // Should show toast error for incomplete fields
    await expect(page.locator('text=Complete os campos obrigatórios para continuar')).toBeVisible();

    // Fill professional information
    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Escritor/Redator Acadêmico');

    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Tempo Integral');

    await page.fill('textarea[name="education"]', 'Mestrado em Letras pela USP, especialização em redação acadêmica');
    await page.fill('textarea[name="experience"]', 'Experiência de 5 anos como redator acadêmico, com mais de 200 trabalhos produzidos em diversas áreas do conhecimento');

    // Now should be able to proceed
    await page.click('button:has-text("Próximo")');
    await expect(page.locator('text=Etapa 3 de 3')).toBeVisible();
  });

  test('should handle file uploads in step 3', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Navigate to step 3
    await page.fill('input[name="fullName"]', 'Carlos Oliveira');
    await page.fill('input[name="email"]', 'carlos@example.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.click('button:has-text("Próximo")');

    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Revisor de Textos');
    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Meio Período');
    await page.fill('textarea[name="education"]', 'Graduação em Letras');
    await page.fill('textarea[name="experience"]', 'Experiência como revisor freelancer');
    await page.click('button:has-text("Próximo")');

    // Check file upload areas
    await expect(page.locator('text=Currículo (Recomendado)')).toBeVisible();
    await expect(page.locator('text=Arquivos de Portfolio (Opcional)')).toBeVisible();
    await expect(page.locator('text=Aceito os termos e condições')).toBeVisible();

    // Check accept terms checkbox
    await page.check('input[id="acceptTerms"]');
    await expect(page.locator('input[id="acceptTerms"]')).toBeChecked();

    // Check submit buttons are available
    await expect(page.locator('button:has-text("Revisar")')).toBeVisible();
    await expect(page.locator('button:has-text("Enviar Aplicação")')).toBeVisible();
  });

  test('should show preview modal with all information', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill complete form
    await page.fill('input[name="fullName"]', 'Ana Paula Ferreira');
    await page.fill('input[name="email"]', 'ana.paula@example.com');
    await page.fill('input[name="phone"]', '11988776655');
    await page.fill('input[name="linkedin"]', 'https://linkedin.com/in/anapaula');
    await page.click('button:has-text("Próximo")');

    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Professor/Orientador');
    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Horário Flexível');
    await page.fill('textarea[name="education"]', 'Doutorado em Educação pela UNICAMP');
    await page.fill('textarea[name="experience"]', 'Professora universitária há 10 anos, orientadora de TCCs e dissertações');
    await page.fill('input[name="portfolioUrl"]', 'https://meuportfolio.com');
    await page.click('button:has-text("Próximo")');

    await page.check('input[id="acceptTerms"]');

    // Open preview modal
    await page.click('button:has-text("Revisar")');

    // Check preview modal content
    await expect(page.locator('text=Revisar Aplicação')).toBeVisible();
    await expect(page.locator('text=Informações Pessoais')).toBeVisible();
    await expect(page.locator('text=Informações Profissionais')).toBeVisible();
    await expect(page.locator('text=Documentos')).toBeVisible();

    // Check personal information
    await expect(page.locator('text=Ana Paula Ferreira')).toBeVisible();
    await expect(page.locator('text=ana.paula@example.com')).toBeVisible();
    await expect(page.locator('text=11988776655')).toBeVisible();

    // Check professional information
    await expect(page.locator('text=Professor/Orientador')).toBeVisible();
    await expect(page.locator('text=Horário Flexível')).toBeVisible();
    await expect(page.locator('text=Doutorado em Educação')).toBeVisible();

    // Check action buttons
    await expect(page.locator('button:has-text("Voltar para editar")')).toBeVisible();
    await expect(page.locator('button:has-text("Confirmar e Enviar")')).toBeVisible();

    // Close preview
    await page.click('button:has-text("Voltar para editar")');
    await expect(page.locator('text=Revisar Aplicação')).not.toBeVisible();
  });

  test('should submit application successfully', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill complete form
    await page.fill('input[name="fullName"]', 'Roberto Silva');
    await page.fill('input[name="email"]', 'roberto@example.com');
    await page.fill('input[name="phone"]', '11987654321');
    await page.click('button:has-text("Próximo")');

    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Criador de Conteúdo');
    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Fins de Semana');
    await page.fill('textarea[name="education"]', 'Graduação em Comunicação Social');
    await page.fill('textarea[name="experience"]', 'Criador de conteúdo educacional há 3 anos');
    await page.click('button:has-text("Próximo")');

    await page.check('input[id="acceptTerms"]');

    // Mock the API call
    await page.route('**/collaborator/apply', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          id: 'test-application-id-123'
        })
      });
    });

    // Submit application
    await page.click('button:has-text("Enviar Aplicação")');

    // Check success page
    await expect(page.locator('text=Aplicação Recebida!')).toBeVisible();
    await expect(page.locator('text=Agradecemos seu interesse')).toBeVisible();
    await expect(page.locator('text=Código de acompanhamento')).toBeVisible();
    await expect(page.locator('text=test-application-id-123')).toBeVisible();
    await expect(page.locator('button:has-text("Enviar nova aplicação")')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill minimal required information
    await page.fill('input[name="fullName"]', 'Teste Erro');
    await page.fill('input[name="email"]', 'teste@example.com');
    await page.fill('input[name="phone"]', '11999999999');
    await page.click('button:has-text("Próximo")');

    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Editor de Conteúdo');
    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Período Noturno');
    await page.fill('textarea[name="education"]', 'Graduação em Jornalismo');
    await page.fill('textarea[name="experience"]', 'Editor freelancer há 2 anos');
    await page.click('button:has-text("Próximo")');

    await page.check('input[id="acceptTerms"]');

    // Mock API failure
    await page.route('**/collaborator/apply', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      });
    });

    // Submit application
    await page.click('button:has-text("Enviar Aplicação")');

    // Check error message
    await expect(page.locator('text=Erro ao enviar aplicação')).toBeVisible();
    await expect(page.locator('text=Internal server error')).toBeVisible();
  });

  test('should save draft automatically', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill some data
    await page.fill('input[name="fullName"]', 'Usuário Teste Draft');
    await page.fill('input[name="email"]', 'draft@example.com');
    await page.fill('input[name="phone"]', '11888888888');

    // Check auto-save indicator
    await expect(page.locator('text=Rascunho salvo automaticamente')).toBeVisible();

    // Reload page
    await page.reload();

    // Check if data was preserved
    await expect(page.locator('input[name="fullName"]')).toHaveValue('Usuário Teste Draft');
    await expect(page.locator('input[name="email"]')).toHaveValue('draft@example.com');
    await expect(page.locator('input[name="phone"]')).toHaveValue('11888888888');
  });

  test('should validate terms acceptance before submission', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill all required fields but don't accept terms
    await page.fill('input[name="fullName"]', 'Sem Termos');
    await page.fill('input[name="email"]', 'semtermos@example.com');
    await page.fill('input[name="phone"]', '11777777777');
    await page.click('button:has-text("Próximo")');

    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Escritor/Redator Acadêmico');
    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Tempo Integral');
    await page.fill('textarea[name="education"]', 'Graduação completa');
    await page.fill('textarea[name="experience"]', 'Experiência relevante na área');
    await page.click('button:has-text("Próximo")');

    // Don't check terms checkbox
    // Submit button should be disabled
    await expect(page.locator('button:has-text("Enviar Aplicação")')).toBeDisabled();

    // Try to submit anyway (if possible)
    await page.click('button:has-text("Enviar Aplicação")', { force: true });

    // Should show error message
    await expect(page.locator('text=Aceite os termos')).toBeVisible();
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto('/seja-colaborador');

    // Fill form quickly
    await page.fill('input[name="fullName"]', 'Loading Test');
    await page.fill('input[name="email"]', 'loading@example.com');
    await page.fill('input[name="phone"]', '11666666666');
    await page.click('button:has-text("Próximo")');

    await page.click('[placeholder="Selecione uma área"]');
    await page.click('text=Revisor de Textos');
    await page.click('[placeholder="Selecione sua disponibilidade"]');
    await page.click('text=Meio Período');
    await page.fill('textarea[name="education"]', 'Formação adequada');
    await page.fill('textarea[name="experience"]', 'Experiência comprovada');
    await page.click('button:has-text("Próximo")');

    await page.check('input[id="acceptTerms"]');

    // Mock slow API response
    await page.route('**/collaborator/apply', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: 'loading-test-id' })
      });
    });

    // Submit form
    await page.click('button:has-text("Enviar Aplicação")');

    // Check loading state
    await expect(page.locator('text=Enviando...')).toBeVisible();
    await expect(page.locator('button:has-text("Enviando...")')).toBeDisabled();

    // Wait for completion
    await expect(page.locator('text=Aplicação Recebida!')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Collaborator CEP Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/seja-colaborador');
  });

  test('should fetch address data when valid CEP is entered', async ({ page }) => {
    // Mock ViaCEP API
    await page.route('**/viacep.com.br/ws/*/json/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP'
        })
      });
    });

    // Enter CEP
    await page.fill('input[id="zipCode"]', '01310100');
    await page.click('input[name="fullName"]'); // Trigger blur event

    // Wait for API call and check if fields are filled
    await expect(page.locator('input[id="address"]')).toHaveValue('Avenida Paulista');
    await expect(page.locator('input[id="neighborhood"]')).toHaveValue('Bela Vista');
    await expect(page.locator('input[id="city"]')).toHaveValue('São Paulo');
    await expect(page.locator('input[id="state"]')).toHaveValue('SP');
  });

  test('should handle CEP API errors gracefully', async ({ page }) => {
    // Mock ViaCEP API error
    await page.route('**/viacep.com.br/ws/*/json/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          erro: true
        })
      });
    });

    // Enter invalid CEP
    await page.fill('input[id="zipCode"]', '00000000');
    await page.click('input[name="fullName"]'); // Trigger blur event

    // Should show error message
    await expect(page.locator('text=CEP não encontrado')).toBeVisible();
  });

  test('should format CEP correctly', async ({ page }) => {
    // Enter CEP digits
    await page.fill('input[id="zipCode"]', '01310100');

    // Should be formatted
    await expect(page.locator('input[id="zipCode"]')).toHaveValue('01310-100');
  });
});

test.describe('Collaborator Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.goto('/seja-colaborador');
  });

  test('should be navigable with keyboard', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="fullName"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="phone"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="linkedin"]')).toBeFocused();
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check form has proper labeling
    await expect(page.locator('label[for="fullName"]')).toContainText('Nome Completo');
    await expect(page.locator('label[for="email"]')).toContainText('E-mail');
    await expect(page.locator('label[for="phone"]')).toContainText('Telefone/WhatsApp');

    // Check required field indicators
    await expect(page.locator('label[for="fullName"]')).toContainText('*');
    await expect(page.locator('label[for="email"]')).toContainText('*');
    await expect(page.locator('label[for="phone"]')).toContainText('*');
  });

  test('should announce errors to screen readers', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button:has-text("Próximo")');

    // Check if error messages are associated with inputs
    const nameInput = page.locator('input[name="fullName"]');
    const nameError = page.locator('text=Nome deve ter pelo menos 3 caracteres');

    await expect(nameInput).toHaveClass(/border-destructive/);
    await expect(nameError).toBeVisible();
  });
});