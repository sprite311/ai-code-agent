import { Idea } from '../idea/Idea';
import { Category } from '../category/Category';
import { Tag } from '../idea/Tag';

/**
 * 创意分类服务接口
 * 
 * 定义创意分类和标记相关的领域服务
 */
export interface IIdeaCategorizationService {
  /**
   * 对创意进行分类
   * 
   * @param idea - 要分类的创意
   * @param availableCategories - 可用的分类列表
   * @returns 分配给创意的分类列表
   */
  categorizeIdea(idea: Idea, availableCategories: Category[]): Promise<Category[]>;

  /**
   * 为创意推荐标签
   * 
   * @param idea - 要标记的创意
   * @param maxTags - 最大标签数量，默认为5
   * @returns 推荐的标签列表
   */
  suggestTags(idea: Idea, maxTags?: number): Promise<Tag[]>;

  /**
   * 分析创意内容并提取关键概念
   * 
   * @param idea - 要分析的创意
   * @returns 关键概念列表
   */
  extractKeyConcepts(idea: Idea): Promise<string[]>;

  /**
   * 计算两个创意之间的相似度
   * 
   * @param ideaA - 第一个创意
   * @param ideaB - 第二个创意
   * @returns 相似度分数（0-100）
   */
  calculateSimilarity(ideaA: Idea, ideaB: Idea): Promise<number>;

  /**
   * 为创意推荐相关创意
   * 
   * @param idea - 源创意
   * @param candidateIdeas - 候选创意列表
   * @param maxRecommendations - 最大推荐数量，默认为5
   * @returns 推荐的相关创意列表
   */
  recommendRelatedIdeas(
    idea: Idea,
    candidateIdeas: Idea[],
    maxRecommendations?: number
  ): Promise<Idea[]>;
}

