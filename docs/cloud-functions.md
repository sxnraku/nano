# Cloud Functions do Gemini

Todas as chamadas ao Gemini passam por Cloud Functions em `functions/`. A chave da API fica só no Secret Manager e já não vai dentro do bundle da app.

| Função | Faz | Limite diário por utilizador |
| --- | --- | --- |
| `scanWarrior` | foto → metadados do guerreiro | 30 |
| `fuseWarriors` | 2 guerreiros → guerreiro fundido | 30 |
| `generateWarriorImage` | prompt visual (+ foto) → retrato | 40 |

Todas exigem utilizador autenticado (o login anónimo também conta). Os contadores ficam em `ai_usage/{uid}_{AAAA-MM-DD}` e só o servidor pode escrever lá. Os limites estão em `DAILY_LIMITS`, no ficheiro `functions/src/index.ts`.

O servidor também valida a resposta do modelo (`sanitizeWarrior`): a raridade tem de ser um valor válido, os textos têm tamanho máximo e a soma dos stats tem um teto por raridade.

## Deploy (uma vez)

O projeto Firebase tem de estar no plano **Blaze** para usar Cloud Functions e o Secret Manager.

```bash
npm install -g firebase-tools
firebase login
cd functions && npm install && cd ..
firebase functions:secrets:set GEMINI_API_KEY   # cola uma chave NOVA
firebase deploy --only functions,firestore:rules
```

Depois do deploy, as versões antigas da app (que tinham a chave dentro) deixam de ser necessárias. Revoga a chave antiga no Google AI Studio.

## Próximo reforço

Ativar o App Check (Play Integrity / App Attest) e mudar `enforceAppCheck` para `true` em `functions/src/index.ts`.
