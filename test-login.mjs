import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar console logs
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));

  // Capturar erros de página
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Capturar requisições falhas
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  try {
    console.log('🔍 Acessando página de login...');
    await page.goto('http://localhost:8080');

    // Esperar a página carregar
    await page.waitForLoadState('networkidle');

    // Tirar screenshot da página inicial
    await page.screenshot({ path: '/Users/saraiva/autonomous-paw-actuator-main/screenshot-inicio.png' });
    console.log('✅ Screenshot salvo: screenshot-inicio.png');

    // Verificar se existe campo de email
    const emailField = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = await page.locator('input[type="password"], input[name="password"]').first();

    if (await emailField.count() > 0) {
      console.log('✅ Campo de email encontrado');

      // Tentar fazer login com credenciais de teste
      await emailField.fill('teste@auzap.com');
      await passwordField.fill('senha123');

      // Procurar botão de login
      const loginButton = await page.locator('button:has-text("Entrar"), button:has-text("Login"), button[type="submit"]').first();

      if (await loginButton.count() > 0) {
        console.log('✅ Botão de login encontrado');

        // Esperar 2 segundos para análise
        await page.waitForTimeout(2000);

        // Tirar screenshot antes do clique
        await page.screenshot({ path: '/Users/saraiva/autonomous-paw-actuator-main/screenshot-preenchido.png' });
        console.log('✅ Screenshot salvo: screenshot-preenchido.png');

        // Clicar no botão
        await loginButton.click();
        console.log('✅ Clicou no botão de login');

        // Esperar resposta (ou erro)
        await page.waitForTimeout(3000);

        // Tirar screenshot após login
        await page.screenshot({ path: '/Users/saraiva/autonomous-paw-actuator-main/screenshot-apos-login.png' });
        console.log('✅ Screenshot salvo: screenshot-apos-login.png');

      } else {
        console.log('❌ Botão de login não encontrado');
      }
    } else {
      console.log('❌ Campos de login não encontrados');
      console.log('📄 HTML da página:');
      const html = await page.content();
      console.log(html.substring(0, 500) + '...');
    }

    // Manter navegador aberto por 5 segundos para análise
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    await page.screenshot({ path: '/Users/saraiva/autonomous-paw-actuator-main/screenshot-erro.png' });
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado');
  }
})();
