# 创意想法生成应用

一个基于大型语言模型和网络爬虫的创意想法生成和管理平台。

## 项目概述

创意想法生成应用是一个帮助用户生成、收集、分类和管理创意想法的平台。该应用利用大型语言模型（LLM）生成创意，并通过网络爬虫收集互联网上的创意想法。系统能够智能分类这些想法，提供搜索功能，并定期自动爬取热门创意。

## 核心功能

1. **创意生成**：调用大型语言模型根据提示生成创意想法
2. **网络爬取**：从互联网爬取相关创意和想法
3. **智能分类**：利用大型语言模型将相关想法分类并存储
4. **搜索功能**：查找本地已保存或爬取的想法
5. **定时爬取**：定期爬取热门想法，智能选择爬取目标

## 技术栈

- **后端**：Node.js, TypeScript, Express.js
- **前端**：React, TypeScript, Next.js
- **数据库**：MongoDB, Elasticsearch
- **缓存**：Redis
- **消息队列**：RabbitMQ
- **AI集成**：OpenAI API / Hugging Face
- **爬虫**：Puppeteer / Cheerio
- **测试**：Jest, React Testing Library, Cypress

## 开发原则

- **DDD（领域驱动设计）**：采用领域驱动设计架构，先做设计再开始开发，设计要有设计文档
- **TDD（测试驱动开发）**：先写测试，再写实现。测试代码包含单元测试、集成测试、功能测试
- **代码质量优先**：可读性、可维护性、可扩展性
- **团队协作**：统一的代码风格和开发流程

## 项目结构

```
src/
├── domain/           # 领域层 - 核心业务逻辑
│   ├── idea/         # 创意相关领域对象
│   ├── category/     # 分类相关领域对象
│   ├── services/     # 领域服务
│   └── events/       # 领域事件
├── application/      # 应用层 - 用例实现
│   ├── idea/         # 创意相关应用服务
│   ├── crawler/      # 爬虫相关应用服务
│   └── search/       # 搜索相关应用服务
├── infrastructure/   # 基础设施层 - 技术实现
│   ├── persistence/  # 持久化实现
│   ├── llm/          # LLM集成
│   ├── crawler/      # 爬虫实现
│   └── messaging/    # 消息队列集成
├── interfaces/       # 接口层 - 外部交互
│   ├── api/          # API控制器
│   ├── graphql/      # GraphQL解析器
│   └── websocket/    # WebSocket处理器
└── tests/            # 测试
    ├── unit/         # 单元测试
    ├── integration/  # 集成测试
    └── functional/   # 功能测试
```

## 安装和运行

### 前提条件

- Node.js 18+
- MongoDB
- Redis (可选，用于缓存)
- RabbitMQ (可选，用于事件处理)

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/sprite311/ai-code-agent.git
cd ai-code-agent
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

创建 `.env` 文件，参考 `.env.example`

4. 运行开发服务器

```bash
npm run dev
```

## 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行功能测试
npm run test:functional

# 生成测试覆盖率报告
npm run test:coverage
```

## 文档

详细的设计文档和API文档位于 `docs` 目录：

- [领域模型设计](docs/design/domain-model.md)
- [架构设计](docs/design/architecture.md)
- [技术栈详细设计](docs/design/technical-stack.md)

## 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

