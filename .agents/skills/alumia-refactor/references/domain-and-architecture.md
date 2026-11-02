# ALUMIA — Domain Model & Target Architecture Reference

## 1. Target Directory Structure

```text
src/
├── main.jsx                        # React root mount + global CSS import
├── App.jsx                         # Top-level router switching Public / Student / School / Admin views
├── styles/
│   └── global.css                  # Typography (Syne, Epilogue, JetBrains Mono), animations, utility classes
├── constants/
│   ├── indicators.js               # IND (12 indicators), RISK, URG, ADMIN_EMAIL, ADMIN_HASH
│   └── demoData.js                 # Initial seed data for demo/presentation
├── utils/
│   ├── crypto.js                   # hash(), uid(), genToken(), genPhrase(), normalizePhrase()
│   ├── date.js                     # Local-timezone todayISO(), fmtDate(), fmtLong(), fmtTs(), getWeekDates()
│   └── clinical.js                 # calcRiskLevel(), calcUrgency(), calcTrend(), iColor(), normalizeAnalysisResult()
├── services/
│   ├── storageService.js           # DB wrapper (localStorage + window.storage fallback) & seed initializer
│   └── aiService.js                # Claude Sonnet API integration + clinical heuristic fallback
├── context/
│   └── AppContext.jsx              # React Context providing db state, auth state, and domain actions
├── components/
│   ├── ui/
│   │   └── Primitives.jsx          # Mn, Logo, Btn, Tag, Fld, Sp, Inf, Dv, IBar, Shell, ModalWrap
│   ├── layout/
│   │   ├── Navbar.jsx              # Public navigation bar
│   │   └── Footer.jsx              # Public footer
│   ├── auth/
│   │   └── LoginModal.jsx          # Student/School/Admin login + First-login phrase & Password Recovery
│   ├── student/
│   │   ├── StudentArea.jsx         # Student shell (Diary & History tabs, non-clinical)
│   │   ├── WeekView.jsx            # 7-day calendar without clinical risk colors/tags
│   │   ├── DiaryEditor.jsx         # Safe writing modal & read-only past entry viewer
│   │   └── SubmissionModal.jsx     # Welcoming post-submission confirmation for the student
│   ├── school/
│   │   └── SchoolDashboard.jsx     # Full clinical dashboard for school professionals (6 tabs)
│   └── admin/
│       └── AdminPanel.jsx          # LGPD-restricted school & token administration
└── pages/
    └── PublicPages.jsx             # Home, About, How, Privacy, Team, ContactPage
```

## 2. Data Contracts

### School Record (`db.schools[token]`)
```json
{
  "token": "ESC-2025-ALUMIA",
  "name": "Colégio Modelo Alumia",
  "active": true,
  "createdAt": 1730000000000
}
```

### Student Record (`db.students[code]`)
```json
{
  "code": "TURMA3A-01",
  "pwdHash": "h1a2b3c",
  "recoveryHash": "h9f8e7d",
  "schoolToken": "ESC-2025-ALUMIA",
  "firstLogin": true,
  "createdAt": 1730000000000
}
```
*Note*: `firstLogin: false` means the student has **not** completed their first login onboarding yet. On their first login, a 6-word secret recovery phrase is generated, its hash is stored in `recoveryHash`, the student can optionally set a new personal password, and `firstLogin` is set to `true`.

### Diary Entry & AI Analysis Record (`db.entries[i]`)
```json
{
  "id": "m3xyz...",
  "studentCode": "TURMA3A-01",
  "schoolToken": "ESC-2025-ALUMIA",
  "date": "2026-11-02",
  "timestamp": 1730560000000,
  "content": "Texto livre escrito pelo aluno...",
  "indicators": {
    "ansiedade": 20,
    "depressao": 12,
    "estresse": 30,
    "burnout": 15,
    "desempenho": 25,
    "desmotivacao": 18,
    "isolamento": 10,
    "autodestrutivo": 0,
    "agressividade": 5,
    "inseguranca": 18,
    "oscilacao": 12,
    "sobrecarga": 25
  },
  "riskLevel": "baixo",
  "urgency": "leve",
  "aiText": "O aluno apresenta...",
  "aiSource": "claude"
}
```

## 3. Claude Sonnet Prompt Contract (`src/services/aiService.js`)

- **Environment Variables**:
  - `VITE_ANTHROPIC_API_KEY`: Anthropic API Key.
  - `VITE_ANTHROPIC_MODEL`: Optional model override (default: `claude-sonnet-4-20250514`).
- **Expected JSON Output from Claude**:
  - All 12 keys from `IND` as integers `0` to `100`.
  - `nivel_risco`: `"baixo" | "atencao" | "alto"`.
  - `analise`: 2 to 3 clinical sentences in Portuguese starting with `"O aluno"`, written for the school psychologist/counselor (identifying emotional patterns and suggesting appropriate school support).
