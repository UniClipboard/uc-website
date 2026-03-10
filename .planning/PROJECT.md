# UniClipboard Website

## What This Is

UniClipboard 的官网与落地页站点，面向潜在与现有用户，提供产品价值说明、功能介绍、白皮书与关键行动入口。当前项目重点是把站点从“早期测试招募”口径升级为“正式发布下载引导”，让访问者可以直接获取最新安装包。

## Core Value

用户进入官网后，能快速理解产品价值并无障碍下载到适配自己系统的最新稳定版本。

## Requirements

### Validated

- ✓ 提供多语言落地页（`en` / `zh`）并基于 locale 路由渲染 — existing
- ✓ 已有完整 landing 信息架构（Hero、Features、How it Works、FAQ、CTA、Footer） — existing
- ✓ 已有白皮书页面并可从 Markdown 内容渲染 — existing
- ✓ 已有主题切换与基础 SEO 元数据/站点地图能力 — existing

### Active

- [ ] 官网新增下载板块，提供三平台下载入口（Linux、Windows、macOS）
- [ ] 下载信息以 `https://release.uniclipboard.app/stable.json` 为单一事实源，动态读取版本与链接
- [ ] 落地页文案由“加入早期测试”升级为“正式发布可下载”
- [ ] 下载板块展示最新版本摘要信息（版本号、发布时间、更新日志要点）
- [ ] 下载入口以直接下载为默认行为，减少跳转与决策成本

### Out of Scope

- 客户端自动更新机制改造 — 属于桌面端应用范围，不在官网 v1 改造内
- 账号系统、支付系统或后台管理上线 — 当前目标仅为官网下载引导升级
- 新增移动端安装分发链路（iOS/Android） — 当前数据源与发布物聚焦桌面平台

## Context

- 当前仓库是 Next.js App Router + TypeScript 的官网项目，已有 i18n 与 landing section 结构。
- 发布源 `stable.json`（当前版本 `0.2.1`，发布时间 `2026-03-09`）已包含多平台直链与更新日志，可直接作为下载区的数据源。
- 现状问题：页面主诉求仍偏“早期测试”，与已正式发布状态不一致，导致下载路径表达不清晰，影响转化。

## Constraints

- **Tech stack**: 必须沿用现有 Next.js/React/i18n 架构 — 保持与现有代码一致、降低改造风险
- **Data source**: 下载链接与版本信息以 `stable.json` 为准 — 避免手动维护导致链接失效或版本滞后
- **Localization**: 首发至少覆盖 `en` 与 `zh` 文案 — 与当前生产站多语言策略一致
- **UX**: 下载行为优先“直接下载” — 目标是提升落地页下载转化率

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 下载区由 `stable.json` 动态驱动 | 避免每次发版手动改官网，减少运营成本与错误 | — Pending |
| v1 同时展示下载与版本日志摘要 | 兼顾“立即下载”与“是否值得更新”的判断信息 | — Pending |
| 正式发布口径替换早测口径 | 统一产品对外状态，减少用户理解偏差 | — Pending |

---
*Last updated: 2026-03-10 after initialization*
