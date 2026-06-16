# NutriKids 参考数据库联动方案

## 一、当前状态分析

### 1.1 前端数据现状

当前项目在 `src/data/growth.ts` 中硬编码了以下参考数据：

| 数据类型 | 覆盖范围 | 存在问题 |
|---------|---------|---------|
| BMI 百分位表 | 6个年龄段 × 2性别 × 9个百分位 | 仅9个离散点，精度有限 |
| 身高/体重百分位 | 仅8岁男孩样例数据 | 覆盖不全，无法通用 |
| DRI 每日营养推荐量 | 12种营养素 × 6个年龄段 | 仅取中点值，无详细年龄细分 |

### 1.2 后端架构

后端采用 **Fastify + Prisma + SQLite**，已支持：
- 用户认证（JWT）
- 儿童档案 CRUD
- 食品产品搜索与分析
- 外部数据源测试管理

### 1.3 管理后台现有功能

已实现数据源管理页面（`/admin/datasources`），支持：
- 数据源列表展示
- 连通性测试
- 采样数据预览

---

## 二、目标数据标准数据库

### 2.1 CDC Growth Charts 2000

**数据内容**：
- 身高/年龄百分位表（0-20岁，男/女）
- 体重/年龄百分位表（0-20岁，男/女）
- BMI/年龄百分位表（2-20岁，男/女）
- 头围/年龄百分位表（0-36个月，男/女）

**数据格式**：
- LMS 方法参数（Lambda、Mu、Sigma）
- 或直接的百分位表格数据
- 精度：按月龄/年龄细分

### 2.2 WHO Child Growth Standards

**数据内容**：
- 0-5岁儿童生长标准
- 身高/年龄、体重/年龄、BMI/年龄
- 含 Z-score 标准

**适用场景**：
- 婴幼儿期（0-5岁）更精确的生长评估

### 2.3 IOM Dietary Reference Intakes (DRI)

**数据内容**：
- 宏量营养素（蛋白质、碳水、脂肪、膳食纤维）
- 矿物质（钙、铁、锌、镁、碘等）
- 维生素（A、D、C、B族等）

**年龄细分**：
- 0-6个月
- 7-12个月
- 1-3岁
- 4-8岁
- 9-13岁
- 14-18岁
- 分性别差异

### 2.4 NOVA Food Classification

**数据内容**：
- 加工程度分级（1-4级）
- 各类别定义与示例

---

## 三、联动方案设计

### 3.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 UI                              │
│  ScienceInsights  │  GrowthProfile  │  FoodAnalyzer         │
└───────────────────┼─────────────────┼───────────────────────┘
                    ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│  /api/guidelines/*  │  /api/children/*  │  /api/analyses/*   │
└─────────────────────┼───────────────────┼───────────────────┘
                      ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     参考数据库层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ CDC Growth  │  │ WHO Growth  │  │ IOM DRI / NOVA    │   │
│  │ Charts      │  │ Standards   │  │                  │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 数据库表设计

#### 3.2.1 `reference_datasets` - 数据集元信息

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| name | varchar | 数据集名称 |
| name_zh | varchar | 中文名称 |
| source | varchar | 来源（CDC/WHO/IOM/NOVA） |
| category | varchar | 类别（growth/bmi/nutrition/classification） |
| version | varchar | 版本号 |
| url | varchar | 原始数据URL |
| created_at | datetime | 创建时间 |

#### 3.2.2 `growth_percentiles` - 生长百分位数据

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| dataset_id | UUID | 关联数据集 |
| metric | varchar | 指标（height/weight/bmi/head_circum） |
| gender | varchar | 性别（boy/girl） |
| age_months | float | 月龄（精确到0.1个月） |
| pct_01 | float | 第1百分位 |
| pct_03 | float | 第3百分位 |
| pct_05 | float | 第5百分位 |
| pct_10 | float | 第10百分位 |
| pct_25 | float | 第25百分位 |
| pct_50 | float | 第50百分位 |
| pct_75 | float | 第75百分位 |
| pct_90 | float | 第90百分位 |
| pct_95 | float | 第95百分位 |
| pct_97 | float | 第97百分位 |
| pct_99 | float | 第99百分位 |

#### 3.2.3 `dri_values` - 每日营养推荐量

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| dataset_id | UUID | 关联数据集 |
| nutrient_code | varchar | 营养素代码 |
| nutrient_name | varchar | 英文名称 |
| nutrient_name_zh | varchar | 中文名称 |
| unit | varchar | 单位 |
| category | varchar | 类别（macronutrient/mineral/vitamin） |
| age_group | varchar | 年龄组（0-6m/7-12m/1-3y/4-8y/9-13y/14-18y） |
| gender | varchar | 性别（boy/girl/all） |
| rda | float | 推荐膳食摄入量 |
| ai | float | 适宜摄入量 |
| ul | float | 可耐受最高摄入量 |

#### 3.2.4 `nova_classification` - NOVA 分类

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | UUID | 主键 |
| level | int | 等级（1-4） |
| name | varchar | 英文名称 |
| name_zh | varchar | 中文名称 |
| description | text | 英文描述 |
| description_zh | text | 中文描述 |
| examples | text | 英文示例 |
| examples_zh | text | 中文示例 |

### 3.3 API 接口设计

#### 3.3.1 生长百分位查询

```
GET /api/guidelines/growth/{metric}/{gender}/{age_months}
```

**参数**：
- `metric`: height/weight/bmi/head_circum
- `gender`: boy/girl
- `age_months`: 月龄（如 48.5）

**响应**：
```json
{
  "metric": "bmi",
  "gender": "boy",
  "age_months": 48.5,
  "percentiles": {
    "5": 13.6,
    "10": 14.1,
    "25": 15.0,
    "50": 15.8,
    "75": 17.0,
    "90": 18.5,
    "95": 19.6
  },
  "child_value": 16.2,
  "child_percentile": 58,
  "category": "healthy"
}
```

#### 3.3.2 DRI 查询

```
GET /api/guidelines/dri/{age_group}/{gender}
```

**参数**：
- `age_group`: 0-6m/7-12m/1-3y/4-8y/9-13y/14-18y
- `gender`: boy/girl/all

**响应**：
```json
{
  "age_group": "4-8y",
  "gender": "boy",
  "nutrients": [
    { "code": "protein", "nameZh": "蛋白质", "unit": "g", "rda": 19 },
    { "code": "calcium", "nameZh": "钙", "unit": "mg", "rda": 1000 },
    { "code": "iron", "nameZh": "铁", "unit": "mg", "rda": 10 }
  ]
}
```

#### 3.3.3 NOVA 查询

```
GET /api/guidelines/nova/{level}
```

**响应**：
```json
{
  "level": 3,
  "name": "Processed Foods",
  "nameZh": "加工食品",
  "descriptionZh": "由食品成分制成的食品...",
  "examplesZh": "面包、奶酪、即食麦片..."
}
```

---

## 四、实施计划

### 阶段一：数据导入（第1-2周）

| 任务 | 描述 | 优先级 |
|-----|------|-------|
| 1.1 | CDC BMI 全表数据整理与导入 | 高 |
| 1.2 | CDC 身高/体重全表数据整理与导入 | 高 |
| 1.3 | WHO 0-5岁生长标准数据整理与导入 | 中 |
| 1.4 | IOM DRI 完整数据整理与导入 | 高 |
| 1.5 | NOVA 分类数据导入 | 低 |

### 阶段二：后端 API 开发（第2-3周）

| 任务 | 描述 | 优先级 |
|-----|------|-------|
| 2.1 | 实现生长百分位查询 API | 高 |
| 2.2 | 实现 DRI 查询 API | 高 |
| 2.3 | 实现 NOVA 查询 API | 中 |
| 2.4 | 添加数据缓存层（Redis） | 中 |

### 阶段三：前端迁移（第3-4周）

| 任务 | 描述 | 优先级 |
|-----|------|-------|
| 3.1 | GrowthProfile 页面迁移到后端 API | 高 |
| 3.2 | ScienceInsights 页面迁移到后端 API | 高 |
| 3.3 | FoodAnalyzer 页面营养评估迁移到后端 | 高 |
| 3.4 | 清理前端硬编码数据（growth.ts） | 中 |

### 阶段四：管理后台增强（第4周）

| 任务 | 描述 | 优先级 |
|-----|------|-------|
| 4.1 | 数据源导入界面 | 中 |
| 4.2 | 数据版本管理 | 低 |
| 4.3 | 数据质量检查工具 | 低 |

---

## 五、数据获取来源

### 5.1 CDC 数据
- **官网**: https://www.cdc.gov/growthcharts/data/
- **文件格式**: CSV / SAS 数据集
- **下载**: ftp://ftp.cdc.gov/pub/Health_Statistics/NCHS/growthcharts/

### 5.2 WHO 数据
- **官网**: https://www.who.int/tools/child-growth-standards/standards
- **文件格式**: CSV / Excel
- **下载**: WHO Child Growth Standards - Length/height-for-age

### 5.3 IOM DRI 数据
- **官网**: https://ods.od.nih.gov/HealthInformation/Dietary_Reference_Intakes.aspx
- **文件格式**: PDF 表格需手动整理
- **推荐**: 使用 USDA FoodData Central API 作为补充

### 5.4 NOVA 数据
- **官网**: https://www.fsp.unicamp.br/nova/
- **分类标准**: 公开文档

---

## 六、技术选型建议

### 6.1 数据导入工具
- **Python** + **pandas**: 数据清洗与转换
- **Prisma Seed**: 数据库初始化
- **SQLite**: 轻量级开发环境

### 6.2 数据插值
- **LMS 方法**: CDC 推荐的百分位插值算法
- **线性插值**: 简单场景下的近似

### 6.3 缓存策略
- **Redis**: API 响应缓存（TTL 1小时）
- **前端缓存**: localStorage 存储常用年龄段数据

---

## 七、风险与应对

| 风险 | 应对策略 |
|-----|---------|
| CDC 数据格式复杂 | 使用 Python 脚本批量处理 |
| 数据量较大（数万条） | 分页查询 + 缓存 |
| 不同数据源冲突 | 明确优先级（CDC > WHO） |
| 前端向后端迁移兼容性 | 保留 mock 数据作为降级方案 |

---

## 八、里程碑

| 时间 | 里程碑 | 验收标准 |
|-----|-------|---------|
| 第2周 | 数据导入完成 | 数据库中包含完整的 CDC/WHO/DRI 数据 |
| 第3周 | API 开发完成 | 所有参考数据接口可正常调用 |
| 第4周 | 前端迁移完成 | 所有页面使用后端 API，无硬编码数据 |
| 第5周 | 测试与优化 | 页面加载速度 < 2s，数据准确性验证通过 |
