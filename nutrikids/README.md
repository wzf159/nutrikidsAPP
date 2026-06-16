# NutriKids · Food Analyzer

儿童食品营养分析平台 — 扫描或搜索食品，结合儿童成长阶段，生成个性化营养评分与建议。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router DOM 7 |
| 国际化 | i18next + react-i18next |

## 项目结构

```
nutrikids/
├── public/
│   ├── icons.svg
│   └── mock/                        # 本地 Mock 数据
│       ├── food.json
│       ├── childProfile.json
│       ├── nutrition.json
│       └── score.json
├── src/
│   ├── components/
│   │   ├── E1_Layout/               # Epic 1 · 导航与页面框架
│   │   │   ├── TopNav.tsx           #   S1.1 顶部导航栏（三入口 + Get Started）
│   │   │   ├── SideNav.tsx          #   S1.2 左侧图标导航栏（响应式）
│   │   │   └── LanguageSwitcher.tsx #   S1.x 语言切换
│   │   │
│   │   ├── E2_FoodInput/            # Epic 2 · 食物录入
│   │   │   ├── SearchBar.tsx        #   S2.3 文字搜索 + 搜索历史
│   │   │   ├── BarcodeScanner.tsx   #   S2.1 条形码扫描
│   │   │   └── PhotoUpload.tsx      #   S2.2 图片上传识别
│   │   │
│   │   ├── E3_ProductInfo/          # Epic 3 · 产品信息面板
│   │   │   └── ProductInfoPanel.tsx #   S3.1 食物图片 / 名称 / Verified / NOVA
│   │   │
│   │   ├── E4_Score/                # Epic 4 · 综合评分模块
│   │   │   ├── ScoreModule.tsx      #   S4.1 评分模块容器
│   │   │   └── CircleScore.tsx      #   S4.1 圆形评分 SVG 动画（0–100）
│   │   │
│   │   ├── E5_ChildProfile/         # Epic 5 · 儿童档案模块
│   │   │   ├── ChildProfileCard.tsx #   S5.1 头像 / 姓名 / 年龄 / Stage
│   │   │   ├── DevelopmentGoalList.tsx #  S5.2 发展目标列表（最多 4 个）
│   │   │   └── KeyNutrientGrid.tsx  #   S5.3 关键营养需求图标网格
│   │   │
│   │   └── E6_NutritionAssessment/  # Epic 6 · 营养素评估四格
│   │       ├── NutritionSupportCard.tsx  #  S6.1 营养支持（DRI 达标率）
│   │       ├── ExposureConcernCard.tsx   #  S6.2 风险成分（添加糖 / 钠）
│   │       ├── AllergicConcernsCard.tsx  #  S6.3 过敏原匹配
│   │       └── ProcessingLevelCard.tsx   #  S6.4 加工程度滑条（NOVA）
│   │
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── i18n.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Epic → 文件夹 · Story → 组件 对应关系

| 文件夹 | Epic | Stories |
|--------|------|---------|
| `E1_Layout` | 导航与页面框架 | S1.1 顶部导航 · S1.2 侧边栏 |
| `E2_FoodInput` | 食物录入 | S2.1 扫码 · S2.2 图片识别 · S2.3 文字搜索 |
| `E3_ProductInfo` | 产品信息面板 | S3.1 产品面板 |
| `E4_Score` | 综合评分模块 | S4.1 评分展示 |
| `E5_ChildProfile` | 儿童档案模块 | S5.1 档案卡 · S5.2 发展目标 · S5.3 营养网格 |
| `E6_NutritionAssessment` | 营养素评估四格 | S6.1–S6.4 四格评估卡 |

> **约定**：Epic 文件夹 = 功能模块，Story = 组件文件。后端 Story（E7 数据基础设施、E8 评分引擎）不在此目录，进入 `server/` 或独立服务。

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（含 Mock 数据）
npm run dev

# 类型检查 + 构建生产版本
npm run build

# 预览生产版本
npm run preview

# Lint
npm run lint
```

## Sprint 计划

| Sprint | 周期 | 交付 Epic | 累计 pts |
|--------|------|-----------|---------|
| S1 | Week 1–2 | E7 + E1 + E2（搜索 / 扫码） | 40 |
| S2 | Week 3–4 | E2（图片）+ E3 + E5 | 82 |
| S3 | Week 5–6 | E8 + E4 | 128 |
| S4 | Week 7–8 | E6 + 收尾 | 160 |

详细 Epic / Story / Task 见 [Notion Scrum 看板](https://notion.so)。
