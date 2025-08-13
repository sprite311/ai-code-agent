# 搜索功能设计文档

## 1. 概述

搜索功能是创意想法生成应用的重要组件，允许用户查找本地已保存或爬取的想法。本文档描述了搜索功能的设计和实现。

## 2. 功能需求

### 2.1 基本搜索

- 根据关键词搜索创意
- 支持标题和内容搜索
- 支持分页和排序

### 2.2 高级搜索

- 支持多字段组合搜索
- 支持标签过滤
- 支持分类过滤
- 支持来源类型过滤
- 支持日期范围过滤

### 2.3 相似搜索

- 查找与指定创意相似的其他创意
- 基于内容和标签的相似度计算

### 2.4 索引管理

- 创建和更新索引
- 重建索引
- 删除索引

## 3. 技术选型

### 3.1 搜索引擎

选择Elasticsearch作为搜索引擎，原因如下：

- 全文搜索能力强大
- 支持复杂查询和过滤
- 支持相似度搜索
- 性能和可扩展性好
- 与Node.js集成简单

### 3.2 客户端库

使用官方的Elasticsearch Node.js客户端：

```typescript
import { Client } from '@elastic/elasticsearch';
```

## 4. 架构设计

### 4.1 领域模型

搜索功能主要与以下领域模型交互：

- `Idea`：创意实体
- `Tag`：标签值对象
- `Category`：分类实体
- `IdeaSource`：创意来源值对象

### 4.2 服务层

#### ElasticsearchService

提供搜索和索引功能的服务类。

**主要方法：**

- `initIndex()`: 初始化索引
- `indexIdea(idea: Idea)`: 索引单个创意
- `bulkIndexIdeas(ideas: Idea[])`: 批量索引创意
- `deleteIdea(id: IdeaId)`: 删除创意索引
- `search(query: string, limit?: number, offset?: number)`: 基本搜索
- `advancedSearch(options: AdvancedSearchOptions)`: 高级搜索
- `getSimilarIdeas(id: IdeaId, limit?: number)`: 获取相似创意

### 4.3 控制器层

#### SearchController

处理搜索相关的API请求。

**主要方法：**

- `search(req: Request, res: Response)`: 处理基本搜索请求
- `advancedSearch(req: Request, res: Response)`: 处理高级搜索请求
- `getSimilarIdeas(req: Request, res: Response)`: 处理相似创意请求
- `rebuildIndex(req: Request, res: Response)`: 处理重建索引请求

### 4.4 路由层

```typescript
// 搜索路由
router.get('/', (req, res) => searchController.search(req, res));
router.post('/advanced', (req, res) => searchController.advancedSearch(req, res));
router.get('/similar/:id', (req, res) => searchController.getSimilarIdeas(req, res));
router.post('/rebuild-index', (req, res) => searchController.rebuildIndex(req, res));
```

## 5. 索引设计

### 5.1 索引映射

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "snowball"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": { 
        "type": "text",
        "analyzer": "text_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "content": { 
        "type": "text",
        "analyzer": "text_analyzer"
      },
      "source": {
        "properties": {
          "type": { "type": "keyword" },
          "reference": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },
      "tags": {
        "type": "nested",
        "properties": {
          "name": { 
            "type": "text",
            "fields": {
              "keyword": { "type": "keyword" }
            }
          },
          "relevance": { "type": "integer" }
        }
      },
      "categories": {
        "type": "nested",
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" },
          "description": { "type": "text" }
        }
      },
      "creationDate": { "type": "date" },
      "popularity": { "type": "integer" }
    }
  }
}
```

### 5.2 分析器配置

使用自定义分析器`text_analyzer`，包含以下组件：

- `standard`分词器：按单词分词
- `lowercase`过滤器：转换为小写
- `stop`过滤器：移除停用词
- `snowball`过滤器：词干提取

### 5.3 字段配置

- `title`：使用`text`类型，并添加`keyword`子字段用于精确匹配和排序
- `content`：使用`text`类型，用于全文搜索
- `tags`和`categories`：使用`nested`类型，支持嵌套查询
- `source.type`：使用`keyword`类型，用于过滤
- `creationDate`：使用`date`类型，支持日期范围查询
- `popularity`：使用`integer`类型，用于排序

## 6. 查询设计

### 6.1 基本搜索查询

```json
{
  "query": {
    "multi_match": {
      "query": "搜索关键词",
      "fields": ["title^2", "content", "tags.name^1.5", "categories.name"],
      "fuzziness": "AUTO"
    }
  },
  "highlight": {
    "fields": {
      "title": {},
      "content": {}
    }
  }
}
```

特点：
- 多字段匹配
- 字段权重设置（标题权重为2，标签权重为1.5）
- 模糊匹配
- 结果高亮

### 6.2 高级搜索查询

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "搜索关键词",
            "fields": ["title^2", "content", "tags.name^1.5", "categories.name"]
          }
        },
        {
          "nested": {
            "path": "tags",
            "query": {
              "terms": {
                "tags.name.keyword": ["标签1", "标签2"]
              }
            }
          }
        },
        {
          "terms": {
            "source.type": ["GENERATED", "CRAWLED"]
          }
        },
        {
          "range": {
            "creationDate": {
              "gte": "2023-01-01",
              "lte": "2023-12-31"
            }
          }
        }
      ]
    }
  }
}
```

特点：
- 布尔查询组合
- 嵌套查询（标签）
- 词条查询（来源类型）
- 范围查询（日期）

### 6.3 相似创意查询

```json
{
  "query": {
    "more_like_this": {
      "fields": ["title", "content", "tags.name"],
      "like": [
        {
          "_index": "ideas",
          "_id": "创意ID"
        }
      ],
      "min_term_freq": 1,
      "max_query_terms": 12,
      "min_doc_freq": 1
    }
  }
}
```

特点：
- 基于内容相似度
- 可配置相似度参数
- 支持多字段相似度计算

## 7. 性能优化

### 7.1 索引优化

- 使用适当的分片和副本设置
- 定期合并分片
- 使用适当的刷新间隔

### 7.2 查询优化

- 使用过滤器缓存
- 限制返回字段
- 使用分页和限制结果数量
- 避免深度分页

### 7.3 批量操作

- 使用批量索引而不是单个索引
- 使用批量删除而不是单个删除

## 8. 安全考虑

### 8.1 输入验证

- 验证搜索查询参数
- 防止注入攻击
- 限制查询复杂度

### 8.2 访问控制

- 限制索引管理操作
- 实施用户权限检查

## 9. 错误处理

### 9.1 连接错误

- 实施重试机制
- 提供友好的错误消息

### 9.2 查询错误

- 验证查询语法
- 捕获和记录查询异常

## 10. 测试策略

### 10.1 单元测试

- 测试搜索服务方法
- 测试查询构建逻辑

### 10.2 集成测试

- 测试与Elasticsearch的集成
- 测试索引和搜索功能

### 10.3 性能测试

- 测试大数据量下的搜索性能
- 测试并发搜索请求

