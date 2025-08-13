import { Client } from '@elastic/elasticsearch';
import { Idea } from '../../domain/idea/Idea';
import { IdeaId } from '../../domain/idea/IdeaId';
import { IdeaContent } from '../../domain/idea/IdeaContent';
import { IdeaSource } from '../../domain/idea/IdeaSource';
import { Tag } from '../../domain/idea/Tag';
import { Category } from '../../domain/category/Category';
import { CategoryId } from '../../domain/category/CategoryId';

/**
 * Elasticsearch服务
 * 
 * 提供创意的搜索和索引功能
 */
export class ElasticsearchService {
  private readonly indexName: string = 'ideas';
  
  /**
   * 创建Elasticsearch服务
   * 
   * @param client - Elasticsearch客户端
   */
  constructor(private readonly client: Client) {}
  
  /**
   * 初始化索引
   */
  async initIndex(): Promise<void> {
    const indexExists = await this.client.indices.exists({
      index: this.indexName
    });
    
    if (!indexExists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          settings: {
            analysis: {
              analyzer: {
                text_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball']
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { 
                type: 'text',
                analyzer: 'text_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              content: { 
                type: 'text',
                analyzer: 'text_analyzer'
              },
              source: {
                properties: {
                  type: { type: 'keyword' },
                  reference: { type: 'keyword' },
                  name: { type: 'keyword' }
                }
              },
              tags: {
                type: 'nested',
                properties: {
                  name: { 
                    type: 'text',
                    fields: {
                      keyword: { type: 'keyword' }
                    }
                  },
                  relevance: { type: 'integer' }
                }
              },
              categories: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  name: { type: 'keyword' },
                  description: { type: 'text' }
                }
              },
              creationDate: { type: 'date' },
              popularity: { type: 'integer' }
            }
          }
        }
      });
      
      console.log(`Created Elasticsearch index: ${this.indexName}`);
    }
  }
  
  /**
   * 索引创意
   * 
   * @param idea - 要索引的创意
   */
  async indexIdea(idea: Idea): Promise<void> {
    const document = this.ideaToDocument(idea);
    
    await this.client.index({
      index: this.indexName,
      id: idea.id.toString(),
      document
    });
  }
  
  /**
   * 批量索引创意
   * 
   * @param ideas - 要索引的创意列表
   */
  async bulkIndexIdeas(ideas: Idea[]): Promise<void> {
    if (ideas.length === 0) {
      return;
    }
    
    const operations = ideas.flatMap(idea => [
      { index: { _index: this.indexName, _id: idea.id.toString() } },
      this.ideaToDocument(idea)
    ]);
    
    await this.client.bulk({ operations });
  }
  
  /**
   * 删除创意索引
   * 
   * @param id - 创意ID
   */
  async deleteIdea(id: IdeaId): Promise<void> {
    await this.client.delete({
      index: this.indexName,
      id: id.toString()
    });
  }
  
  /**
   * 搜索创意
   * 
   * @param query - 搜索查询
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 搜索结果
   */
  async search(query: string, limit: number = 10, offset: number = 0): Promise<Idea[]> {
    const response = await this.client.search({
      index: this.indexName,
      from: offset,
      size: limit,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title^2', 'content', 'tags.name^1.5', 'categories.name'],
            fuzziness: 'AUTO'
          }
        },
        highlight: {
          fields: {
            title: {},
            content: {}
          }
        }
      }
    });
    
    return this.hitsToIdeas(response.hits.hits);
  }
  
  /**
   * 高级搜索
   * 
   * @param options - 搜索选项
   * @returns 搜索结果
   */
  async advancedSearch(options: AdvancedSearchOptions): Promise<Idea[]> {
    const { query, tags, categories, sourceTypes, dateFrom, dateTo, limit, offset } = options;
    
    // 构建查询条件
    const must: any[] = [];
    
    // 文本查询
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^2', 'content', 'tags.name^1.5', 'categories.name'],
          fuzziness: 'AUTO'
        }
      });
    }
    
    // 标签过滤
    if (tags && tags.length > 0) {
      must.push({
        nested: {
          path: 'tags',
          query: {
            terms: {
              'tags.name.keyword': tags
            }
          }
        }
      });
    }
    
    // 分类过滤
    if (categories && categories.length > 0) {
      must.push({
        nested: {
          path: 'categories',
          query: {
            terms: {
              'categories.id': categories
            }
          }
        }
      });
    }
    
    // 来源类型过滤
    if (sourceTypes && sourceTypes.length > 0) {
      must.push({
        terms: {
          'source.type': sourceTypes
        }
      });
    }
    
    // 日期范围过滤
    if (dateFrom || dateTo) {
      const range: any = {};
      
      if (dateFrom) {
        range.gte = dateFrom.toISOString();
      }
      
      if (dateTo) {
        range.lte = dateTo.toISOString();
      }
      
      must.push({
        range: {
          creationDate: range
        }
      });
    }
    
    // 执行搜索
    const response = await this.client.search({
      index: this.indexName,
      from: offset || 0,
      size: limit || 10,
      body: {
        query: {
          bool: {
            must
          }
        },
        highlight: {
          fields: {
            title: {},
            content: {}
          }
        }
      }
    });
    
    return this.hitsToIdeas(response.hits.hits);
  }
  
  /**
   * 获取相似创意
   * 
   * @param id - 创意ID
   * @param limit - 限制返回数量
   * @returns 相似创意列表
   */
  async getSimilarIdeas(id: IdeaId, limit: number = 5): Promise<Idea[]> {
    const response = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          more_like_this: {
            fields: ['title', 'content', 'tags.name'],
            like: [
              {
                _index: this.indexName,
                _id: id.toString()
              }
            ],
            min_term_freq: 1,
            max_query_terms: 12,
            min_doc_freq: 1
          }
        },
        size: limit
      }
    });
    
    return this.hitsToIdeas(response.hits.hits);
  }
  
  /**
   * 将创意转换为文档
   * 
   * @param idea - 创意实体
   * @returns Elasticsearch文档
   */
  private ideaToDocument(idea: Idea): any {
    return {
      id: idea.id.toString(),
      title: idea.title,
      content: idea.content.toString(),
      source: {
        type: idea.source.getType(),
        reference: idea.source.getReference(),
        name: idea.source.getName()
      },
      tags: idea.tags.map(tag => ({
        name: tag.getName(),
        relevance: tag.getRelevance()
      })),
      categories: idea.categories.map(category => ({
        id: category.id.toString(),
        name: category.name,
        description: category.description
      })),
      creationDate: idea.creationDate.toISOString(),
      popularity: idea.popularity
    };
  }
  
  /**
   * 将搜索结果转换为创意实体
   * 
   * @param hits - 搜索结果
   * @returns 创意实体列表
   */
  private hitsToIdeas(hits: any[]): Idea[] {
    return hits.map(hit => {
      const source = hit._source;
      
      // 创建创意ID
      const id = new IdeaId(source.id);
      
      // 创建创意内容
      const content = new IdeaContent(source.content);
      
      // 创建创意来源
      const ideaSource = new IdeaSource(
        source.source.type,
        source.source.reference,
        source.source.name
      );
      
      // 创建创意实体
      const idea = Idea.createWithId(
        id,
        source.title,
        content,
        ideaSource,
        new Date(source.creationDate)
      );
      
      // 设置人气
      idea.popularity = source.popularity || 0;
      
      // 添加标签
      if (source.tags && Array.isArray(source.tags)) {
        source.tags.forEach((tag: any) => {
          idea.addTag(new Tag(tag.name, tag.relevance));
        });
      }
      
      // 添加分类
      if (source.categories && Array.isArray(source.categories)) {
        source.categories.forEach((category: any) => {
          const categoryId = new CategoryId(category.id);
          const categoryEntity = new Category(
            categoryId,
            category.name,
            category.description
          );
          idea.addCategory(categoryEntity);
        });
      }
      
      return idea;
    });
  }
  
  /**
   * 创建Elasticsearch服务
   * 
   * @param connectionString - Elasticsearch连接字符串
   * @returns Elasticsearch服务实例
   */
  static async create(connectionString: string): Promise<ElasticsearchService> {
    const client = new Client({
      node: connectionString
    });
    
    // 测试连接
    await client.ping();
    console.log('Connected to Elasticsearch');
    
    const service = new ElasticsearchService(client);
    await service.initIndex();
    
    return service;
  }
}

/**
 * 高级搜索选项
 */
export interface AdvancedSearchOptions {
  /**
   * 搜索查询
   */
  query?: string;
  
  /**
   * 标签过滤
   */
  tags?: string[];
  
  /**
   * 分类过滤
   */
  categories?: string[];
  
  /**
   * 来源类型过滤
   */
  sourceTypes?: string[];
  
  /**
   * 开始日期
   */
  dateFrom?: Date;
  
  /**
   * 结束日期
   */
  dateTo?: Date;
  
  /**
   * 限制返回数量
   */
  limit?: number;
  
  /**
   * 跳过的数量
   */
  offset?: number;
}

