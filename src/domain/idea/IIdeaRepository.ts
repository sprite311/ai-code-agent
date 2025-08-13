import { Idea } from './Idea';
import { IdeaId } from './IdeaId';
import { CategoryId } from '../category/CategoryId';

/**
 * 创意仓储接口
 * 
 * 定义创意持久化操作
 */
export interface IIdeaRepository {
  /**
   * 根据ID查找创意
   * 
   * @param id - 创意ID
   * @returns 创意实体，如果不存在则返回null
   */
  findById(id: IdeaId): Promise<Idea | null>;

  /**
   * 保存创意
   * 
   * @param idea - 要保存的创意
   * @returns 保存的创意
   */
  save(idea: Idea): Promise<Idea>;

  /**
   * 删除创意
   * 
   * @param id - 要删除的创意ID
   * @returns 是否成功删除
   */
  delete(id: IdeaId): Promise<boolean>;

  /**
   * 查找所有创意
   * 
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  findAll(limit?: number, offset?: number): Promise<Idea[]>;

  /**
   * 根据标签查找创意
   * 
   * @param tag - 标签名称
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  findByTag(tag: string, limit?: number, offset?: number): Promise<Idea[]>;

  /**
   * 根据分类查找创意
   * 
   * @param categoryId - 分类ID
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  findByCategory(categoryId: CategoryId, limit?: number, offset?: number): Promise<Idea[]>;

  /**
   * 搜索创意
   * 
   * @param query - 搜索查询
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  search(query: string, limit?: number, offset?: number): Promise<Idea[]>;

  /**
   * 查找热门创意
   * 
   * @param limit - 限制返回数量
   * @returns 热门创意列表
   */
  findPopular(limit?: number): Promise<Idea[]>;

  /**
   * 查找最新创意
   * 
   * @param limit - 限制返回数量
   * @returns 最新创意列表
   */
  findRecent(limit?: number): Promise<Idea[]>;
}

