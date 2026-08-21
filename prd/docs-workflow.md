# Docsify 文档方案

本文说明 AyuChat 如何用 **Docsify + 原始 Markdown** 做文档 review：仓库里仍是 `.md` 源码，本地起服务后在浏览器里看渲染结果。

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| **MD 即源码** | 所有 PRD、设计说明以 `.md` 存放在 `prd/`，直接编辑、直接 commit |
| **零构建** | 不写 HTML 正文、不导出 PDF；Docsify 运行时拉取 MD 渲染 |
| **预览与仓库分离关注点** | `index.html`、`_sidebar.md` 只是「阅读器壳」，正文仍是普通 MD |
| **Git 不变** | 不引入 Git LFS、子模块；review 流程：改 MD → commit → 同事 `git pull` → 本地预览 |

---

## 2. 目录结构

```
AyuChat/
├── package.json           # pnpm scripts：启动文档服务
├── pnpm-lock.yaml         # 依赖锁文件（提交到 Git）
├── README.md              # 项目说明 + 文档入口
├── .gitignore             # 忽略 node_modules
└── prd/                   # 文档根目录（docsify serve 指向此处）
    ├── index.html         # Docsify 配置与 CDN 依赖
    ├── README.md          # 文档站首页
    ├── _sidebar.md        # 左侧导航树
    ├── docs-workflow.md   # 本方案说明
    └── Fronted_part/
        └── UI/
            └── ui_setting.md
```

**为何把 Docsify 放在 `prd/`？**

- `docsify serve prd` 以 `prd/` 为站点根目录
- 正文路径与磁盘路径一致，例如 `Fronted_part/UI/ui_setting.md`
- 侧边栏链接与文件路径一一对应，无需复制或 symlink

---

## 3. 本地预览

### 3.1 首次使用

若尚未安装 pnpm，可任选其一：

```bash
# 方式 A：Corepack（Node.js 16.13+ 自带，推荐）
corepack enable
corepack prepare pnpm@9.15.4 --activate

# 方式 B：全局安装
npm install -g pnpm
```

然后在项目根目录：

```bash
cd AyuChat
pnpm install
```

### 3.2 启动（推荐）

```bash
pnpm docs:dev
```

- 默认地址：<http://localhost:3000>
- 自动打开浏览器
- 修改任意 `.md` 后**刷新页面**即可看到更新（热更新对 MD 支持有限，手动刷新最稳）

### 3.3 仅启动、不自动开浏览器

```bash
pnpm docs:serve
```

### 3.4 未安装依赖时（临时）

```bash
pnpm dlx docsify-cli serve prd --port 3000 --open
```

依赖 Docsify 官方 CDN（见 `index.html`），**无需打包前端资源**。

---

## 4. Review 工作流

```mermaid
flowchart LR
  A[编辑 prd/*.md] --> B[git add / commit / push]
  B --> C[同事 git pull]
  C --> D[pnpm docs:dev]
  D --> E[浏览器侧边栏点击阅读]
```

1. 在 IDE 中编辑 `prd/` 下 Markdown（与现在相同）
2. `git diff` 看 MD 源码变更（适合精 diff）
3. 需要「像读网页一样」通读时：`pnpm docs:dev`，用左侧导航跳转
4. PR review：GitHub/GitLab 仍显示 MD diff；本地可开 Docsify 对照阅读体验

---

## 5. 新增一篇文档

1. **创建 MD 文件**  
   例：`prd/Fronted_part/UI/ui_components.md`

2. **写入侧边栏**  
   编辑 `prd/_sidebar.md`：

   ```markdown
   - **前端**
     - [UI 总方案](Fronted_part/UI/ui_setting.md)
     - [UI 组件说明](Fronted_part/UI/ui_components.md)
   ```

3. **（可选）首页索引**  
   在 `prd/README.md` 表格中加一行链接

4. **本地验证**  
   `pnpm docs:dev` → 点击新链接 → 确认标题、表格、代码块渲染正常

5. **提交 Git**

   ```bash
   git add prd/Fronted_part/UI/ui_components.md prd/_sidebar.md
   git commit -m "docs: add UI components spec"
   ```

> 链接写法：相对路径 + `.md` 后缀，Docsify 会自动处理路由。

---

## 6. 已启用能力

| 能力 | 配置位置 |
|------|----------|
| 左侧导航 | `_sidebar.md` + `loadSidebar: true` |
| 页内 TOC（h2–h4） | `subMaxLevel: 4` |
| 全文搜索 | search 插件 |
| 代码块一键复制 | copy-code 插件 |
| 上一页 / 下一页 | pagination 插件 |
| 主题色 | `index.html` 内 CSS `--theme-color`（与 UI 主色 `#2563EB` 对齐） |

---

## 7. 写作建议（兼容 Docsify）

- 标题层级从 `#` 起跳，避免多个一级标题混乱（每页一个 `#` 最佳）
- 图片：使用相对路径，放在 MD 同目录或 `prd/assets/`，例如 `![](./assets/layout.png)`
- 内部链接：`[UI 总方案](Fronted_part/UI/ui_setting.md)` 或 `[UI 总方案](#/Fronted_part/UI/ui_setting)` 均可
- 表格、代码块、Mermaid：标准 MD 语法；若需 Mermaid 图，可在 `index.html` 追加 mermaid 插件（当前未启用）
- **不要在 MD 里写 HTML 壳**：正文保持纯 MD，便于 Git diff

---

## 8. 常见问题

### Q：改了 MD 浏览器没变化？

刷新页面（F5）。若仍旧内容，确认改的是 `prd/` 下文件且服务指向 `prd`。

### Q：新文档 404？

检查 `_sidebar.md` 路径是否与磁盘路径一致（大小写、斜杠方向）。

### Q：要不要把 `node_modules` 提交？

不要。已在根目录 `.gitignore` 忽略；同事各自 `pnpm install`。`pnpm-lock.yaml` 需提交，保证依赖版本一致。

### Q：能否部署成在线文档？

可以。将 `prd/` 作为静态站点根目录部署（Nginx / GitHub Pages / Vercel）。`index.html` 使用 CDN，部署时只需上传 `prd/` 目录内容。在线部署方案可在有需求时单独补充。

---

## 9. 后续扩展（可选）

- [ ] 增加 `prd/Server/`、`prd/Connect/` 等模块目录
- [ ] `index.html` 接入 Mermaid 插件（渲染架构图）
- [ ] CI 检查：`_sidebar.md` 链接是否指向存在的文件
- [ ] GitHub Pages 自动部署 `prd/`

---

## 10. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-08-21 | 初版：Docsify 本地预览方案与协作流程 |
| v1.1 | 2026-08-21 | 包管理器改为 pnpm |
