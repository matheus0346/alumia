---
name: alumia-refactor
description: >-
  Use this skill when refactoring, fixing product misalignments, auditing clinical
  indicator rules, updating the Claude Sonnet AI integration, or maintaining the
  ALUMIA school emotional well-being platform.
---

# ALUMIA — Refactoring, Alignment & Maintenance Skill

This skill guides the agent in refactoring, aligning, and maintaining **ALUMIA**, an anonymous school emotional well-being platform where students write weekly diary entries and **Claude Sonnet** analyzes the text across **12 emotional indicators**, providing clinical interpretations and visual charts exclusively to school professionals (psychologists/counselors/coordinators).

## Core Domain Rules & Product Alignment

Whenever modifying or auditing the codebase, strictly enforce these 5 pillars:

1. **Strict Separation Between Student View and School View**:
   - **Student Area (`src/components/student/`)**: Must be a welcoming, non-judgmental, safe writing environment.
   - **NEVER expose to the student**: clinical percentages (`0-100%`), self-harm/depression labels (`Pens. Autodestrutivos`, etc.), risk tags (`Alto Risco`, `Atenção`, `Baixo Risco`), urgency badges (`CRÍTICO`, `MODERADO`, `LEVE`), indicator charts, or 3rd-person clinical AI text (`"O aluno apresenta..."`).
   - After submitting a text, the student receives an empathetic confirmation modal acknowledging their writing and reminding them that the school support team accompanies their journey with confidentiality.
   - **School Dashboard (`src/components/school/`)**: Exclusively displays the 12 emotional indicators, bar/line charts, historical evolution, risk/urgency classifications, alerts, and Claude Sonnet's clinical synthesis (`aiText`).

2. **LGPD & Privacy-by-Design**:
   - Students are identified strictly by anonymous school-issued codes (e.g., `TURMA3A-01`). Never add fields for real names, CPF, or personal emails in student records.
   - **Admin Panel (`src/components/admin/`)**: Manages school tokens and global system metrics only. Admins must **never** have access to student texts, individual indicators, or recovery phrases.

3. **The 12 Emotional Indicators & Clinical Thresholds**:
   - Keys (`IND`): `ansiedade`, `depressao`, `estresse`, `burnout`, `desempenho`, `desmotivacao`, `isolamento`, `autodestrutivo`, `agressividade`, `inseguranca`, `oscilacao`, `sobrecarga`.
   - Risk rules (`calcRiskLevel`):
     - `alto`: `autodestrutivo >= 35` OR `max(indicators) >= 70` OR `mean(indicators) >= 52`
     - `atencao`: `max(indicators) >= 40` OR `mean(indicators) >= 30`
     - `baixo`: otherwise
   - Urgency rules (`calcUrgency`):
     - `critico`: `autodestrutivo >= 35` OR `riskLevel === 'alto'`
     - `moderado`: `riskLevel === 'atencao'` OR any indicator `>= 55`
     - `leve`: otherwise

4. **Claude Sonnet AI Integration (`src/services/aiService.js`)**:
   - Uses configurable model via `VITE_ANTHROPIC_MODEL` (defaulting to Claude Sonnet 4.x `claude-sonnet-4-20250514`) and `VITE_ANTHROPIC_API_KEY`.
   - Always sanitize and normalize AI JSON responses through `normalizeAnalysisResult` so all 12 indicators are clamped to integers `0..100` and `nivel_risco` is consistent with clinical thresholds.
   - Preserve the deterministic/heuristic clinical fallback (`simulateAiAnalyze`) when no API key is configured or when offline so demos and local testing never break.

5. **Modular Architecture**:
   - Never place business logic, AI prompts, storage adapters, and multiple page components into a single monolithic file.
   - Follow the modular directory structure documented in [references/domain-and-architecture.md](./references/domain-and-architecture.md).

---

## Step-by-Step Workflow

### Step 1: Audit Current State
1. Read [references/domain-and-architecture.md](./references/domain-and-architecture.md) to check the target module boundaries and data contracts.
2. Inspect `src/` for any monolithic files, leaked clinical data in student components, UTC date bugs (`.toISOString().slice(0, 10)` instead of local date), or broken authentication/recovery flows.

### Step 2: Apply Modular Refactoring & Fixes
1. **Constants & Utils (`src/constants/`, `src/utils/`)**:
   - Keep indicator definitions, risk/urgency palettes, and demo data in `src/constants/`.
   - Ensure date utilities (`todayISO`, `getWeekDates`) use local timezone rather than UTC so evening entries in Brazil (`UTC-3`) do not roll over to the next day.
   - Ensure clinical utilities (`calcRiskLevel`, `calcUrgency`, `calcTrend`, `normalizeAnalysisResult`) validate all 12 indicators.
2. **Services & Context (`src/services/`, `src/context/`)**:
   - Keep `storageService.js` compatible with both `localStorage` and `window.storage`.
   - Keep `aiService.js` responsible for Claude Sonnet API calls, prompt construction, JSON extraction, and fallback analysis.
   - Centralize state mutations in `AppContext.jsx` (login, first-login recovery phrase & optional password update, password recovery via secret phrase, diary entry creation, student/school management).
3. **UI Components (`src/components/`, `src/pages/`)**:
   - Verify that `src/components/student/` renders only welcoming, student-appropriate UI.
   - Verify that `src/components/school/` provides full 12-indicator charts (bar chart + selectable multi-indicator historical line chart), AI clinical analyses, full text inspection, and critical/worsening alerts.

### Step 3: Verify & Validate
Run the verification script to confirm build integrity, module structure, and domain rules:
```bash
bash .agents/skills/alumia-refactor/scripts/verify-project.sh
```
