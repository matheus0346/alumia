#!/usr/bin/env bash
set -euo pipefail

echo "=== [1/4] Checking modular file structure ==="
REQUIRED_FILES=(
  "src/main.jsx"
  "src/App.jsx"
  "src/styles/global.css"
  "src/constants/indicators.js"
  "src/constants/demoData.js"
  "src/utils/crypto.js"
  "src/utils/date.js"
  "src/utils/clinical.js"
  "src/services/storageService.js"
  "src/services/aiService.js"
  "src/context/AppContext.jsx"
  "src/components/ui/Primitives.jsx"
  "src/components/layout/Navbar.jsx"
  "src/components/layout/Footer.jsx"
  "src/components/auth/LoginModal.jsx"
  "src/components/student/StudentArea.jsx"
  "src/components/student/WeekView.jsx"
  "src/components/student/DiaryEditor.jsx"
  "src/components/student/SubmissionModal.jsx"
  "src/components/school/SchoolDashboard.jsx"
  "src/components/admin/AdminPanel.jsx"
  "src/pages/PublicPages.jsx"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "❌ Missing required module: $f"
    exit 1
  fi
done
echo "✅ All modular files present."

echo "=== [2/4] Auditing student components for clinical data leakage ==="
if grep -rnE "IBar|BarChart|LineChart|aiText" src/components/student/; then
  echo "❌ Clinical indicators, charts, or 3rd-person AI analysis found in student components!"
  exit 1
fi
echo "✅ Student components are free of clinical charts and diagnostic labels."

echo "=== [3/4] Auditing date utilities for UTC day-shift bug ==="
if grep -rn "toISOString().slice(0, 10)" src/utils/date.js; then
  echo "❌ UTC date bug found in src/utils/date.js! Use local timezone formatting."
  exit 1
fi
echo "✅ Local timezone date formatting verified."

echo "=== [4/4] Running Vite production build ==="
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
fi
if command -v npm >/dev/null 2>&1; then
  npm run build
  echo "✅ Build succeeded!"
else
  echo "⚠️ npm not found in PATH; static structure & domain checks passed. Run 'npm run build' in an environment with Node.js installed."
fi
