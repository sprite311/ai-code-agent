import { IIdeaRepository } from '../../domain/idea/IIdeaRepository';
import { Idea } from '../../domain/idea/Idea';
import { IdeaId } from '../../domain/idea/IdeaId';
import { CategoryId } from '../../domain/category/CategoryId';

/**
 * 内存创意仓储
 * 
 * 基于内存的创意仓储实现，主要用于测试和原型开发
 */
export class InMemoryIdeaRepository implements IIdeaRepository {
  private ideas: Idea[] = [];

  /**
   * 根据ID查找创意
   * 
   * @param id - 创意ID
   * @returns 创意实体，如果不存在则返回null
   */
  async findById(id: IdeaId): Promise<Idea | null> {
    const idea = this.ideas.find(i => i.id.toString() === id.toString());
    return idea || null;
  }

  /**
   * 保存创意
   * 
   * @param idea - 要保存的创意
   * @returns 保存的创意
   */
  async save(idea: Idea): Promise<Idea> {
    const existingIndex = this.ideas.findIndex(i => i.id.toString() === idea.id.toString());
    
    if (existingIndex >= 0) {
      // 更新现有创意
      this.ideas[existingIndex] = idea;
    } else {
      // 添加新创意
      this.ideas.push(idea);
    }
    
    return idea;
  }

  /**
   * 删除创意
   * 
   * @param id - 要删除的创意ID
   * @returns 是否成功删除
   */
  async delete(id: IdeaId): Promise<boolean> {
    const initialLength = this.ideas.length;
    this.ideas = this.ideas.filter(i => i.id.toString() !== id.toString());
    return initialLength > this.ideas.length;
  }

  /**
   * 查找所有创意
   * 
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async findAll(limit?: number, offset = 0): Promise<Idea[]> {
    let result = this.ideas.slice(offset);
    
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * 根据标签查找创意
   * 
   * @param tag - 标签名称
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async findByTag(tag: string, limit?: number, offset = 0): Promise<Idea[]> {
    const normalizedTag = tag.toLowerCase();
    let result = this.ideas
      .filter(idea => idea.hasTag(normalizedTag))
      .slice(offset);
    
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * 根据分类查找创意
   * 
   * @param categoryId - 分类ID
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async findByCategory(categoryId: CategoryId, limit?: number, offset = 0): Promise<Idea[]> {
    let result = this.ideas
      .filter(idea => idea.belongsToCategory(categoryId))
      .slice(offset);
    
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * 搜索创意
   * 
   * @param query - 搜索查询
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async search(query: string, limit?: number, offset = 0): Promise<Idea[]> {
    const normalizedQuery = query.toLowerCase();
    
    let result = this.ideas
      .filter(idea => 
        idea.title.toLowerCase().includes(normalizedQuery) || 
        idea.content.toString().toLowerCase().includes(normalizedQuery)
      )
      .slice(offset);
    
    if (limit !== undefined) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * 查找热门创意
   * 
   * @param limit - 限制返回数量
   * @returns 热门创意列表
   */
  async findPopular(limit = 10): Promise<Idea[]> {
    return this.ideas
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * 查找最新创意
   * 
   * @param limit - 限制返回数量
   * @returns 最新创意列表
   */
  async findRecent(limit = 10): Promise<Idea[]> {
    return this.ideas
      .sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime())
      .slice(0, limit);
  }
}

