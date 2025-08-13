# 创意想法生成应用 - 领域模型设计

## 1. 领域概述

创意想法生成应用是一个帮助用户生成、收集、分类和管理创意想法的平台。该应用利用大型语言模型（LLM）生成创意，并通过网络爬虫收集互联网上的创意想法。系统能够智能分类这些想法，提供搜索功能，并定期自动爬取热门创意。

## 2. 核心领域和限界上下文

根据领域驱动设计（DDD）原则，我们将系统划分为以下限界上下文：

### 2.1 创意生成上下文 (Idea Generation Context)

负责通过LLM生成创意想法，处理用户提示，并管理生成过程。

### 2.2 内容采集上下文 (Content Acquisition Context)

负责从互联网爬取创意想法，管理爬虫任务，并处理原始数据。

### 2.3 创意管理上下文 (Idea Management Context)

负责创意的存储、分类、标记和组织。

### 2.4 搜索发现上下文 (Search & Discovery Context)

负责提供搜索功能，帮助用户发现相关创意。

### 2.5 智能调度上下文 (Intelligent Scheduling Context)

负责管理定期爬取任务，并基于LLM反馈选择爬取目标。

## 3. 统一语言 (Ubiquitous Language)

为确保团队成员和领域专家之间的有效沟通，我们定义以下统一语言：

- **创意 (Idea)**: 一个独特的概念、想法或灵感，可以来自LLM生成或网络爬取。
- **提示 (Prompt)**: 用户提供给LLM以生成创意的输入文本。
- **分类 (Category)**: 创意的主题分类，如"技术"、"艺术"、"商业"等。
- **标签 (Tag)**: 与创意相关的关键词，用于更精细的分类和搜索。
- **爬虫任务 (Crawl Task)**: 从特定网站或平台收集创意的计划任务。
- **热门度 (Popularity)**: 衡量创意受欢迎程度的指标。
- **相关性 (Relevance)**: 创意与用户查询或其他创意的相关程度。
- **来源 (Source)**: 创意的来源，可以是"生成的"或特定的网站URL。

## 4. 核心领域实体和值对象

### 4.1 创意生成上下文

#### 实体
- **Prompt**: 用户提供的生成提示
  - 属性: id, content, userId, createdAt
  - 行为: refine(), expand()

- **GeneratedIdea**: 由LLM生成的创意
  - 属性: id, content, promptId, creationDate, model
  - 行为: regenerate(), save()

#### 值对象
- **GenerationParameters**: LLM生成参数
  - 属性: temperature, maxTokens, model

#### 领域服务
- **IdeaGenerationService**: 协调LLM生成创意的过程
  - 行为: generateIdeas(prompt, parameters)

### 4.2 内容采集上下文

#### 实体
- **CrawlTask**: 爬取任务
  - 属性: id, source, schedule, status, lastRunTime
  - 行为: execute(), pause(), resume()

- **CrawledIdea**: 从网络爬取的创意
  - 属性: id, content, source, crawlDate, originalUrl
  - 行为: validate(), normalize()

#### 值对象
- **CrawlSource**: 爬取源
  - 属性: url, selectors, priority

- **CrawlSchedule**: 爬取计划
  - 属性: frequency, startTime, endTime

#### 领域服务
- **ContentCrawlingService**: 管理网络爬取过程
  - 行为: scheduleCrawl(source), executeCrawl(task)

### 4.3 创意管理上下文

#### 实体
- **Idea**: 统一的创意实体（可能是生成的或爬取的）
  - 属性: id, title, content, source, creationDate, popularity
  - 行为: categorize(), tag(), rate()

- **Category**: 创意分类
  - 属性: id, name, description, parentCategory
  - 行为: addIdea(idea), removeIdea(idea)

#### 值对象
- **Tag**: 创意标签
  - 属性: name, relevance

- **Source**: 创意来源
  - 属性: type, details

#### 领域服务
- **IdeaCategorizationService**: 使用LLM对创意进行分类
  - 行为: categorizeIdea(idea), suggestTags(idea)

### 4.4 搜索发现上下文

#### 实体
- **SearchQuery**: 用户搜索查询
  - 属性: id, content, userId, timestamp
  - 行为: refine(), save()

- **SearchResult**: 搜索结果集
  - 属性: id, queryId, results, timestamp
  - 行为: filter(), sort(), paginate()

#### 值对象
- **SearchFilter**: 搜索过滤条件
  - 属性: categories, tags, dateRange, sources

- **Relevance**: 相关性评分
  - 属性: score, factors

#### 领域服务
- **IdeaSearchService**: 处理创意搜索
  - 行为: search(query, filters), recommendRelated(idea)

### 4.5 智能调度上下文

#### 实体
- **CrawlStrategy**: 爬取策略
  - 属性: id, name, parameters, performance
  - 行为: evaluate(), adjust()

- **ScheduledTask**: 计划任务
  - 属性: id, type, schedule, status, priority
  - 行为: execute(), reschedule()

#### 值对象
- **TaskPriority**: 任务优先级
  - 属性: level, reason

- **PerformanceMetrics**: 性能指标
  - 属性: successRate, ideaQuality, uniqueness

#### 领域服务
- **IntelligentSchedulingService**: 基于LLM反馈调度爬取任务
  - 行为: optimizeSchedule(), suggestSources()

## 5. 聚合和聚合根

### 5.1 创意生成聚合
- 聚合根: **Prompt**
- 包含: GeneratedIdea, GenerationParameters

### 5.2 爬取任务聚合
- 聚合根: **CrawlTask**
- 包含: CrawledIdea, CrawlSource, CrawlSchedule

### 5.3 创意管理聚合
- 聚合根: **Idea**
- 包含: Tag, Source

### 5.4 分类聚合
- 聚合根: **Category**
- 包含: 子分类

### 5.5 搜索聚合
- 聚合根: **SearchQuery**
- 包含: SearchResult, SearchFilter

### 5.6 调度聚合
- 聚合根: **CrawlStrategy**
- 包含: ScheduledTask, TaskPriority, PerformanceMetrics

## 6. 领域事件

为支持领域间的松耦合通信，我们定义以下领域事件：

1. **IdeaGenerated**: 当新创意被生成时触发
2. **IdeaCrawled**: 当新创意被爬取时触发
3. **IdeaCategorized**: 当创意被分类时触发
4. **PopularSourceIdentified**: 当识别到热门创意来源时触发
5. **SearchPerformed**: 当用户执行搜索时触发
6. **CrawlTaskCompleted**: 当爬取任务完成时触发

## 7. 仓储接口

每个聚合根都需要相应的仓储接口：

1. **IPromptRepository**: 管理Prompt实体的持久化
2. **ICrawlTaskRepository**: 管理CrawlTask实体的持久化
3. **IIdeaRepository**: 管理Idea实体的持久化
4. **ICategoryRepository**: 管理Category实体的持久化
5. **ISearchQueryRepository**: 管理SearchQuery实体的持久化
6. **ICrawlStrategyRepository**: 管理CrawlStrategy实体的持久化

## 8. 领域服务

除了前面提到的领域服务外，还有一些跨聚合的领域服务：

1. **IdeaEnrichmentService**: 丰富创意内容，添加相关资源和参考
2. **TrendAnalysisService**: 分析创意趋势和模式
3. **UserPreferenceService**: 基于用户行为分析偏好
4. **ContentQualityService**: 评估创意质量和独特性

## 9. 应用服务

应用服务将协调领域对象以完成用户用例：

1. **IdeaGenerationApplicationService**: 处理创意生成请求
2. **ContentCrawlingApplicationService**: 管理内容爬取过程
3. **IdeaManagementApplicationService**: 处理创意管理操作
4. **SearchApplicationService**: 处理搜索请求
5. **SchedulingApplicationService**: 管理智能调度

## 10. 领域模型图

[此处应有领域模型UML图，展示实体、值对象、聚合和它们之间的关系]

## 11. 下一步

1. 细化每个限界上下文的领域模型
2. 定义领域服务的详细接口
3. 设计仓储接口和实现策略
4. 开发应用服务和用例
5. 实现基础设施层

