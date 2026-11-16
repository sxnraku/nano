# Gemini via Firebase AI Logic

A app chama o Gemini através do **Firebase AI Logic**, com o backend Gemini Developer API (`src/services/gemini.ts`). A chave da API é guardada pelo Firebase do lado do servidor e não vai dentro do bundle nem do APK. Funciona no plano gratuito (Spark).

- Modelos: `gemini-3.5-flash` (scan e fusão, com saída JSON; o `gemini-2.5-flash` já não está disponível para projetos novos) e `gemini-2.5-flash-image` (retratos). Os modelos de imagem não têm quota gratuita: no plano Spark os retratos usam o fallback do Pollinations.
- `sanitizeWarrior` normaliza a resposta do modelo: a raridade tem de ser válida, os textos têm tamanho máximo e a soma dos stats tem um teto por raridade.
- Limites de pedidos por utilizador: Firebase console → AI Logic → Settings.
## App Check (obrigatório, está em Enforced para o AI Logic)

Ver `src/services/appCheck.ts`.

| Build | Provider | Configuração |
| --- | --- | --- |
| Testers (CI → App Distribution) | debug | Secret do GitHub `APPCHECK_DEBUG_TOKEN`, que tem de ser igual a um token registado em App Check → app web → *Manage debug tokens* (já existe um chamado `testers-ci`). |
| Android na Play Store | Play Integrity (nativo) | Registar a app Android em App Check → Play Integrity com o SHA-256 do certificado de assinatura, e ligar o projeto na Play Console. |
| iOS na App Store | App Attest (nativo) | Registar a app iOS em App Check. |
| Web | reCAPTCHA Enterprise | `VITE_RECAPTCHA_SITE_KEY` no build. |

O token de debug fica dentro do APK de teste, por isso só deve ser distribuído a testers de confiança. Revoga-o na consola se o APK se espalhar.
