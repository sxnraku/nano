# Gemini via Firebase AI Logic

A app chama o Gemini através do **Firebase AI Logic**, com o backend Gemini Developer API (`src/services/gemini.ts`). A chave da API é guardada pelo Firebase do lado do servidor e não vai dentro do bundle nem do APK. Funciona no plano gratuito (Spark).

- Modelos: `gemini-2.5-flash` (scan e fusão, com saída JSON) e `gemini-2.5-flash-image` (retratos).
- `sanitizeWarrior` normaliza a resposta do modelo: a raridade tem de ser válida, os textos têm tamanho máximo e a soma dos stats tem um teto por raridade.
- Limites de pedidos por utilizador: Firebase console → AI Logic → Settings.
- **App Check:** se estiver em *Enforced* para o AI Logic, a app tem de enviar um token App Check, caso contrário todas as chamadas falham com 401. Enquanto o App Check não estiver integrado na app (Play Integrity no Android, reCAPTCHA na web), deixa a aplicação do App Check em *Unenforced*.
