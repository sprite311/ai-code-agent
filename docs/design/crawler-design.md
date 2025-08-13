# 爬虫功能设计文档

## 1. 概述

爬虫功能是创意想法生成应用的核心组件之一，负责从互联网上抓取创意和想法。本文档描述了爬虫功能的设计和实现。

## 2. 领域模型

### 2.1 核心实体

#### CrawlerTarget（爬虫目标）

表示一个要爬取的目标网站。

**属性：**
- `id`: 唯一标识符
- `url`: 目标URL
- `name`: 目标名称
- `type`: 目标类型（网站、博客、论坛、社交媒体、新闻）
- `selectors`: CSS选择器配置
- `priority`: 优先级（1-10，10为最高）
- `crawlFrequency`: 爬取频率（小时）
- `lastCrawled`: 上次爬取时间

**方法：**
- `needsCrawling()`: 检查是否需要爬取
- `getCrawlDelay()`: 获取爬取延迟（毫秒）

#### CrawlerResult（爬虫结果）

表示一次爬取操作的结果。

**属性：**
- `targetId`: 爬取目标ID
- `url`: 爬取的URL
- `status`: 爬取状态（成功、部分成功、失败）
- `items`: 爬取的项目
- `error`: 错误信息（如果有）
- `timestamp`: 爬取时间戳

**方法：**
- `getSuccessCount()`: 获取成功爬取的项目数量
- `isSuccess()`: 是否成功爬取
- `isPartial()`: 是否部分成功
- `isFailed()`: 是否失败

#### CrawledItem（爬取的项目）

表示从网页爬取的一个项目。

**属性：**
- `title`: 项目标题
- `content`: 项目内容
- `url`: 项目URL
- `sourceType`: 项目来源类型
- `sourceName`: 项目来源名称
- `crawledAt`: 爬取时间
- `author`: 作者（可选）
- `publishDate`: 发布日期（可选）
- `tags`: 标签（可选）

### 2.2 接口

#### ICrawlerService（爬虫服务接口）

定义爬虫服务的功能。

**方法：**
- `crawlTarget(target: CrawlerTarget): Promise<CrawlerResult>`: 爬取单个目标
- `crawlTargets(targets: CrawlerTarget[], concurrency?: number): Promise<CrawlerResult[]>`: 爬取多个目标
- `crawlUrl(url: string, selectors: any): Promise<CrawlerResult>`: 爬取URL
- `stopAll(): Promise<void>`: 停止所有爬取任务

#### ICrawlerTargetRepository（爬虫目标仓储接口）

定义爬虫目标的存储和检索功能。

**方法：**
- `findById(id: string): Promise<CrawlerTarget | null>`: 根据ID查找爬虫目标
- `save(target: CrawlerTarget): Promise<CrawlerTarget>`: 保存爬虫目标
- `delete(id: string): Promise<boolean>`: 删除爬虫目标
- `findAll(): Promise<CrawlerTarget[]>`: 查找所有爬虫目标
- `findTargetsForCrawling(limit?: number): Promise<CrawlerTarget[]>`: 查找需要爬取的目标
- `updateLastCrawled(id: string, timestamp: Date): Promise<CrawlerTarget>`: 更新爬取时间
- `findByType(type: string): Promise<CrawlerTarget[]>`: 根据类型查找爬虫目标
- `findByPriority(minPriority: number, maxPriority: number): Promise<CrawlerTarget[]>`: 根据优先级查找爬虫目标

## 3. 应用服务

### 3.1 CrawlerSchedulerService（爬虫调度服务）

负责调度爬虫任务和处理爬取结果。

**依赖：**
- `ICrawlerService`: 爬虫服务
- `ICrawlerTargetRepository`: 爬虫目标仓储
- `IIdeaRepository`: 创意仓储
- `ILLMService`: LLM服务
- `IDomainEventDispatcher`: 事件分发器

**功能：**
- 启动定时爬取
- 停止定时爬取
- 手动爬取目标
- 爬取URL
- 处理爬取结果
- 使用LLM为创意生成标签

## 4. 基础设施

### 4.1 PuppeteerCrawlerService（Puppeteer爬虫服务）

使用Puppeteer实现的爬虫服务。

**功能：**
- 初始化浏览器
- 爬取单个目标
- 爬取多个目标（并发控制）
- 爬取URL
- 从页面提取项目
- 处理分页

### 4.2 MongoDBCrawlerTargetRepository（MongoDB爬虫目标仓储）

基于MongoDB的爬虫目标仓储实现。

**功能：**
- 根据ID查找爬虫目标
- 保存爬虫目标
- 删除爬虫目标
- 查找所有爬虫目标
- 查找需要爬取的目标
- 更新爬取时间
- 根据类型查找爬虫目标
- 根据优先级查找爬虫目标

## 5. 接口层

### 5.1 CrawlerController（爬虫控制器）

处理爬虫相关的API请求。

**功能：**
- 获取所有爬虫目标
- 获取爬虫目标
- 创建爬虫目标
- 更新爬虫目标
- 删除爬虫目标
- 手动爬取目标
- 爬取URL
- 启动定时爬取
- 停止定时爬取

### 5.2 API路由

- `GET /api/crawler/targets`: 获取所有爬虫目标
- `GET /api/crawler/targets/:id`: 获取爬虫目标
- `POST /api/crawler/targets`: 创建爬虫目标
- `PUT /api/crawler/targets/:id`: 更新爬虫目标
- `DELETE /api/crawler/targets/:id`: 删除爬虫目标
- `POST /api/crawler/targets/:id/crawl`: 手动爬取目标
- `POST /api/crawler/crawl-url`: 爬取URL
- `POST /api/crawler/schedule/start`: 启动定时爬取
- `POST /api/crawler/schedule/stop`: 停止定时爬取

## 6. 技术实现

### 6.1 爬虫实现

使用Puppeteer作为爬虫引擎，提供以下功能：

- 浏览器自动化
- 页面导航
- 内容提取
- 分页处理
- 并发控制
- 错误处理和重试

### 6.2 存储实现

使用MongoDB存储爬虫目标和爬取结果，提供以下功能：

- 文档存储
- 索引优化
- 查询功能
- 事务支持

### 6.3 调度实现

使用Node.js的定时器实现爬虫调度，提供以下功能：

- 定时执行
- 并发控制
- 优先级排序
- 错误恢复

## 7. 安全考虑

### 7.1 爬虫限制

- 使用自定义User-Agent
- 添加随机延迟
- 遵循robots.txt规则
- 限制并发请求数量

### 7.2 数据验证

- 验证爬虫目标URL
- 验证爬取的内容
- 过滤恶意内容

## 8. 性能优化

### 8.1 爬虫优化

- 使用无头浏览器模式
- 禁用不必要的浏览器功能
- 资源加载优化
- 连接池管理

### 8.2 存储优化

- 索引优化
- 批量操作
- 连接池管理
- 缓存策略

## 9. 测试策略

### 9.1 单元测试

- 测试爬虫目标实体
- 测试爬虫结果实体
- 测试爬虫服务接口
- 测试爬虫目标仓储接口

### 9.2 集成测试

- 测试爬虫服务与仓储的集成
- 测试爬虫调度服务
- 测试API接口

### 9.3 功能测试

- 测试完整的爬取流程
- 测试定时调度功能
- 测试错误处理和恢复

