# Baseline Status

基线日期：2026-09-10  
基线分支：`main`（工作区在测试前无业务代码修改）

本文件记录当前 UW Degree Planner 在本地环境中的行为基线。本轮仅增加 E2E 测试环境字体 fallback，并未修改业务逻辑、UI、数据模型、Supabase schema 或 Waterloo 规则。

## 环境与项目命令

- Node.js：`v24.15.0`
- pnpm：`11.19.0`（项目 `package.json` 固定 `pnpm@11.18.0`，本机版本可执行但存在小版本差异）
- 项目要求：Node `>=22.13.0`、pnpm 11
- 依赖安装：`pnpm install --frozen-lockfile`，成功；未增加依赖
- Supabase 配置：仓库根目录没有 `.env.local`，仅有 `.env.example`

`AGENTS.md` 要求测试放在相邻 `test/` 目录，当前命令来自 `package.json`：

```text
pnpm test        # vitest run
pnpm lint        # biome check .
pnpm knip        # unused files/deps/exports 检查
pnpm test:e2e    # playwright test
```

项目没有独立的 `typecheck` script。本轮使用安装后的本地编译器直接执行：

```text
.\\node_modules\\.bin\\tsc.cmd --noEmit
```

直接执行 `pnpm exec tsc --noEmit` 在本机 Windows shell 中错误地报告 `tsc` 不可识别，但对应的本地 shim `node_modules/.bin/tsc.cmd` 正常工作并通过；这属于 pnpm/shell 调用差异，不是 TypeScript 源码错误。

## 结果摘要

| 检查 | 结果 | 统计/说明 |
|---|---|---|
| TypeScript | 通过 | `tsc --noEmit`，无诊断 |
| Vitest | 通过 | 140 个测试文件，2,655 个测试全部通过 |
| Biome lint | 通过 | 检查 405 个文件，无修复 |
| Knip | 失败 | 1 个未使用文件、2 个未使用 devDependency、4 个未使用导出、11 个未使用导出类型 |
| Playwright E2E | 服务器已启动，浏览器未启动 | 已进入 9 个测试的执行阶段；Chromium 可执行文件缺失，未产生业务断言结果 |

### 测试计数

- Vitest：总计 2,655；通过 2,655；失败 0；跳过 0
- Vitest 测试文件：140；通过 140；失败 0
- Playwright：发现 9 个测试；实际启动浏览器 0；通过 0；失败 0；未执行 9
- E2E 中部分用例本身按环境条件 skip（例如无 Sentry DSN、无 `E2E_SHARE_TOKEN`），但本轮浏览器在启动前即失败，因此不将它们伪计为通过或跳过

## 失败与环境判定

### Knip

`pnpm knip` 退出码为 1，报告的是当前源码/配置中的未使用项，不是依赖安装或 Supabase 连接错误：

- 未使用文件：`scripts/diagnostic/check-dropped.ts`
- 未使用 devDependencies：`@svgr/webpack`、`supabase`
- 未使用导出：
  - `EligibilityChip` — `components/catalog/CourseTable.tsx`
  - `ruleRoots` — `lib/audit/test/helpers.ts`
  - `jointHonoursPartnerMessage` — `lib/plan/jointHonours.ts`
  - `__resetCatalogCache` — `scripts/scrape/util/catalog.ts`
- 另有 11 个未使用导出类型，详见 Knip 原始输出

本轮没有为了通过 Knip 删除或改写这些代码。

### Playwright

本轮为 E2E 增加了最小的离线字体隔离：

- 新增 `app/fonts.e2e.ts`，提供不加载网络资源的 system-font fallback。
- `next.config.ts` 仅在 `E2E_NO_EXTERNAL_FONTS=1` 时将 `next/font/google` 别名到该 fallback。
- `playwright.config.ts` 通过 `webServer.env` 只为 E2E server 设置 `E2E_NO_EXTERNAL_FONTS=1`。

验证结果：`pnpm test:e2e` 已成功启动 `next dev` 并进入 `Running 9 tests using 8 workers`，不再出现 `fonts.gstatic.com` 或 `@vercel/turbopack-next/internal/font/google/font` 错误。生产和普通开发环境仍走 `app/fonts.ts` 的真实 Google font loader。

随后所有用例在浏览器启动前失败，Playwright 报告为：

```text
browserType.launch: Executable doesn't exist at
C:\Users\hp\AppData\Local\ms-playwright\chromium_headless_shell-1228\...
```

因此剩余阻塞是浏览器运行时缺失，不是页面断言或 Supabase 业务错误。已尝试执行既有 Playwright 的 `install chromium`，但当前网络环境无可用下载结果并中止；未修改测试断言，也未伪造浏览器或 Supabase 数据。

### Supabase

本轮未启动 Supabase，也未执行需要真实账户或数据库数据的成功路径 E2E。缺少 `.env.local` 中的：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

源码依据：`lib/supabase/env.ts`、`supabase/README.md`。匿名 localStorage 相关 Vitest 测试已通过；Supabase 云端读写能力不在本轮可验证范围内。

## 可复现命令

```powershell
pnpm install --frozen-lockfile
.\\node_modules\\.bin\\tsc.cmd --noEmit
pnpm test
pnpm lint
pnpm knip
pnpm test:e2e
```

查看 E2E 测试清单（不启动服务器）：

```powershell
.\\node_modules\\.bin\\playwright.cmd test --list
```

## 当前基线结论

1. TypeScript、核心单元测试和 Biome lint 在当前环境下是绿色的。
2. 当前 Vitest 基线覆盖 2,655 个测试，未发现业务回归。
3. Knip 已存在基线级未使用项，应作为技术债记录，不应在本阶段为了“全绿”删除业务/测试辅助代码。
4. E2E 的 Next/Turbopack Google Font 阻塞已通过测试环境 fallback 解除；当前仍需安装匹配版本的 Chromium 才能形成有效断言基线。
5. 需要真实 Supabase 环境变量才能验证登录、云端计划、计划列表、保存和分享成功路径。

## 后续建议（本轮不执行）

- 在具备网络或预置浏览器缓存的环境中执行 `playwright install chromium`，再重跑 `pnpm test:e2e`。
- 配置本地 Supabase 后单独执行认证、计划 CRUD、共享 RPC 的 E2E/集成基线。
- 在确认基线后，再开始领域模型适配或中国高校培养方案改造。
