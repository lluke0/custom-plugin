---
name: view
description: >
  Opens a local web viewer (Vite + React) for a StudyVault — rendered images, Mermaid, code highlighting,
  ⌘K search, dark mode. Triggers: "view my notes", "open vault in browser", "/view", "뷰어 열어줘",
  "노트 브라우저로 보여줘".
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Tutor View — StudyVault Web Viewer

Bootstraps a Vite + React viewer that renders the user's `StudyVault/` as a polished browsable site. Runs **directly from the skill's own `viewer/` directory** — nothing copied into the user's project. Vault is wired in via a single symlink (`viewer/vault → <project>/StudyVault`), refreshed on every invocation.

## Execution Context (MANDATORY)

**모든 단계를 메인 세션에서 직접 실행한다. `Agent`/`Task` 도구나 `subagent_type`을 절대 사용하지 않는다.** `npm run dev`는 long-running foreground 프로세스라 서브에이전트 안에서는 dev-server URL·HMR 로그·Ctrl-C 종료가 사용자에게 보이지 않는다. 심볼릭 링크 갱신과 서버 라이프사이클도 메인 세션 트랜스크립트에 노출되어야 한다.

## Pre-flight

1. Glob `StudyVault/**/*.md` from CWD. If empty: tell user to run `/setup` first and stop.
2. Run `node --version && npm --version`. If either missing: tell user to install Node.js 18+ and stop.

## Bootstrap

```bash
# 1. Locate the skill's viewer directory (Claude Code sets CLAUDE_SKILL_DIR; fallbacks for various install paths).
SKILL_DIR="${CLAUDE_SKILL_DIR:-}"
if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR/viewer" ]; then
  for candidate in \
    "$HOME/.claude/skills/view" \
    "$HOME/.claude/plugins"/*/tutor/skills/view \
    "$HOME/.claude/plugins"/*/*/skills/view; do
    [ -d "$candidate/viewer" ] && SKILL_DIR="$candidate" && break
  done
fi
[ -d "$SKILL_DIR/viewer" ] || { echo "Viewer not found. Reinstall the tutor plugin."; exit 1; }
VIEWER_DIR="$SKILL_DIR/viewer"

# 2. Atomic symlink to current project's vault (fixed-name contract — Vite's import.meta.glob needs a static path).
PROJECT_DIR="$(pwd)"
[ -d "$PROJECT_DIR/StudyVault" ] || { echo "StudyVault not found. Run /setup first."; exit 1; }
ln -sfn "$PROJECT_DIR/StudyVault" "$VIEWER_DIR/vault"

# 3. Install deps once per plugin version (node_modules survives plugin updates — untracked files are preserved).
cd "$VIEWER_DIR"
[ ! -d node_modules ] || [ "package.json" -nt "node_modules/.package-lock.json" ] && npm install

# 4. Start dev server (URL: http://127.0.0.1:5273, HMR; static preview uses 5274).
npm run dev
```

If the user's vault folder is named something other than `StudyVault`, have them symlink before invoking:
```bash
ln -sfn path/to/actual-vault StudyVault   # in user's project root
```

### Static build (when user passes `--build` or asks for deployable site)

```bash
cd "$VIEWER_DIR" && npm run build
cp -R "$VIEWER_DIR/dist" "$PROJECT_DIR/view-dist"   # build bakes in symlinked vault — copy out before next invocation
```
Serve with `npx serve view-dist`.

## Concurrent projects

Single-tenant per machine: the `viewer/vault` symlink points to one vault at a time. Running `/view` in project B while A's dev server is live repoints the symlink (HMR switches the open tab). For two vaults at once: open the first as a static build (`npm run build` → `npx serve dist`), the second with the dev server.

## Node polyfills (Buffer)

`gray-matter`는 브라우저에서 Node `Buffer`를 참조합니다. `vault-index.ts`의 static import가 `main.tsx`보다 먼저 평가되므로 수동 polyfill은 항상 너무 늦습니다. 반드시 `vite.config.ts`에서 `vite-plugin-node-polyfills`로 주입하세요: `nodePolyfills({ include: ['buffer'], globals: { Buffer: true } })`.

## Features & Design

Full feature list: see [README.md](../../README.md). Design tokens (typography, color, layout): see [design-system.md](references/design-system.md).
