# 04 · Contrato da API

Todas as rotas ficam em `/api`, usam JSON (`Content-Type: application/json`) e exigem o cookie de sessão,
exceto `POST /api/login`. Erros seguem o formato `{ "error": { "code": "...", "message": "..." } }`.

| Status | Uso |
|---|---|
| 200 / 201 / 204 | Sucesso |
| 400 | Entrada inválida (`code: "invalid_input"`) |
| 401 | Sem sessão ou cookie inválido |
| 404 | Recurso inexistente |
| 409 | Conflito (ex.: nome de matéria repetido) |
| 429 | Muitas tentativas de login |

## Autenticação

### `POST /api/login`
```json
{ "password": "..." }
```
`204` e `Set-Cookie: studyos_auth=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`.
`401` se a senha estiver errada. Limite: 5 tentativas por minuto por IP (`429`).

### `POST /api/logout`
`204` e cookie expirado.

## Matérias

### `GET /api/subjects`
```json
[{ "id": 1, "name": "Backend", "color": "#8b5cf6", "weeklyGoal": 360 }]
```

### `POST /api/subjects`
```json
{ "name": "Backend", "color": "#8b5cf6", "weeklyGoal": 360 }
```
`201` com a matéria criada. `409` se o nome já existir. `name`: 1 a 60 caracteres. `color`: `#RRGGBB`. `weeklyGoal`: 0 a 10080.

### `PATCH /api/subjects/:id` · `DELETE /api/subjects/:id`
Atualiza campos parciais / exclui a matéria **e suas sessões** (o front confirma). Excluir recalcula o `Profile`.

## Sessões

### `POST /api/sessions` (finalizar sessão)
```json
{
  "subjectId": 1,
  "topic": "Índices no PostgreSQL",
  "kind": "pratica",
  "startedAt": "2026-11-23T13:00:00.000Z",
  "endedAt": "2026-11-23T14:05:00.000Z",
  "pausedSeconds": 120,
  "rating": 4,
  "summary": "Entendi quando usar índice composto."
}
```
Validações: `endedAt` > `startedAt`; `endedAt` não pode estar no futuro (tolerância de 2 min); duração líquida entre 1 min e 12 h;
`rating` de 1 a 5; `kind` ∈ `estudo|leitura|pratica|revisao|projeto`; `topic` até 120 caracteres; `summary` até 500.

Resposta `201`:
```json
{
  "session": { "id": 42, "minutes": 63, "xp": 96 },
  "reward": {
    "xpBefore": 980,
    "xpGained": 96,
    "base": { "minutes": 63, "multiplier": 1.2, "xp": 76 },
    "bonuses": [{ "code": "first_of_day", "xp": 20 }],
    "xpTotal": 1076,
    "levelBefore": 4,
    "level": 5,
    "levelUp": true,
    "streak": 8,
    "streakIncreased": true,
    "streakBefore": 7,
    "newAchievements": ["streak_7"],
    "subjectWeek": { "minutesBefore": 250, "minutes": 313, "goal": 360 },
    "questsCompleted": ["study_30"]
  }
}
```
Os campos `*Before` existem para a tela de recompensa animar do valor antigo para o novo.
Cálculo do exemplo: `round(63 × 1.2) = 76` + 20 (primeira do dia) = 96; 980 → 1076 cruza 1000, logo nível 4 → 5. Regras em [05-gamificacao](05-gamificacao.md).

### `GET /api/sessions`
Query: `from`, `to` (ISO), `subjectId`, `limit` (padrão 30, máx. 100), `cursor` (id da última sessão da página anterior).
Resposta: `{ "items": [...], "nextCursor": 17 | null }`, ordenado por `startedAt` decrescente.

### `PATCH /api/sessions/:id` · `DELETE /api/sessions/:id`
Edita `topic`, `kind`, `rating`, `summary`, `subjectId` / exclui. Alterar `rating` ou excluir dispara o
**recálculo do Profile** ([ADR-0004](adr/0004-estado-derivado.md)). O `xp` da sessão é recalculado, mantendo
os bônus já concedidos.

## Estatísticas

### `GET /api/stats`
```json
{
  "profile": { "xp": 1250, "level": 5, "xpToNext": 350, "streak": 8, "bestStreak": 12 },
  "today": { "minutes": 95, "sessions": 2 },
  "week":  { "minutes": 610, "goalMinutes": 1200 },
  "month": { "minutes": 2400 },
  "heatmap": [{ "day": "2026-11-23", "minutes": 95 }],
  "bySubject": [{ "subjectId": 1, "name": "Backend", "minutes": 410, "avgRating": 4.2, "weeklyGoal": 360 }],
  "avgRating": 3.9
}
```
`heatmap` cobre as últimas 12 semanas, apenas dias com estudo. Semana começa na segunda-feira (fuso `APP_TZ`).

## Missões do dia

### `GET /api/quests`
```json
{
  "day": "2026-11-23",
  "resetsAt": "2026-11-24T03:00:00.000Z",
  "items": [
    { "code": "study_30", "title": "Estudar 30 min hoje", "xp": 25, "progress": 95, "target": 30, "status": "claimable" },
    { "code": "two_summaries", "title": "Escrever 2 resumos", "xp": 15, "progress": 2, "target": 2, "status": "claimed" },
    { "code": "quality_session", "title": "Sessão de qualidade (25 min, nota 4+)", "xp": 30, "progress": 0, "target": 1, "status": "in_progress" }
  ]
}
```
`status`: `in_progress | claimable | claimed`.

### `POST /api/quests/:code/claim`
`201` com `{ "xpGained": 25, "xpBefore": 1430, "xpTotal": 1455, "levelBefore": 5, "level": 5, "levelUp": false }`.
`409` se já coletada hoje; `400` se a missão não estiver completa; `404` se o código não existir.

## Saúde

### `GET /api/health`
Sem autenticação. `200 { "ok": true }` se o banco responde; `503` caso contrário.

## Rotas futuras (V2/V3)

`/api/topics`, `/api/notes` (com `?q=` para busca), `/api/export`, `/api/reviews/due`, `/api/ai/summarize`,
`/api/ai/flashcards`, `/api/ai/weekly-report`. Contrato detalhado quando a fase começar.

## Validação

Toda entrada passa por validação de esquema (planejado: `zod`, a adicionar às dependências) antes de tocar no banco.
Campos desconhecidos são ignorados; textos são tratados como texto puro (a interface escapa na renderização).
