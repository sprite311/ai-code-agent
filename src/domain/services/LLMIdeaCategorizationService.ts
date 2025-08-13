import { IIdeaCategorizationService } from './IdeaCategorizationService';
import { ILLMService } from './ILLMService';
import { Idea } from '../idea/Idea';
import { Category } from '../category/Category';
import { Tag } from '../idea/Tag';

/**
 * 基于LLM的创意分类服务
 * 
 * 使用大型语言模型对创意进行分类和标记
 */
export class LLMIdeaCategorizationService implements IIdeaCategorizationService {
  /**
   * 创建LLM创意分类服务
   * 
   * @param llmService - LLM服务
   */
  constructor(private readonly llmService: ILLMService) {}

  /**
   * 对创意进行分类
   * 
   * @param idea - 要分类的创意
   * @param availableCategories - 可用的分类列表
   * @returns 分配给创意的分类列表
   */
  async categorizeIdea(idea: Idea, availableCategories: Category[]): Promise<Category[]> {
    // 构建提示
    const categoryNames = availableCategories.map(c => c.name.toLowerCase());
    const prompt = `
      Please categorize the following idea into one or more of these categories: ${categoryNames.join(', ')}.
      
      Idea Title: ${idea.title}
      Idea Content: ${idea.content.toString()}
      
      Return your response as a JSON object with the following format:
      {
        "categories": ["category1", "category2"],
        "explanation": "Brief explanation of why these categories were chosen"
      }
    `;

    try {
      // 调用LLM服务
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      // 解析响应
      const result = JSON.parse(response);
      const categoryNames = result.categories.map((c: string) => c.toLowerCase());

      // 查找匹配的分类
      return availableCategories.filter(category => 
        categoryNames.includes(category.name.toLowerCase())
      );
    } catch (error) {
      console.error('Error categorizing idea:', error);
      return [];
    }
  }

  /**
   * 为创意推荐标签
   * 
   * @param idea - 要标记的创意
   * @param maxTags - 最大标签数量，默认为5
   * @returns 推荐的标签列表
   */
  async suggestTags(idea: Idea, maxTags = 5): Promise<Tag[]> {
    const prompt = `
      Please suggest up to ${maxTags} relevant tags for the following idea.
      For each tag, provide a relevance score between 0 and 100.
      
      Idea Title: ${idea.title}
      Idea Content: ${idea.content.toString()}
      
      Return your response as a JSON object with the following format:
      {
        "tags": [
          {"name": "tag1", "relevance": 95},
          {"name": "tag2", "relevance": 85}
        ]
      }
    `;

    try {
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      const result = JSON.parse(response);
      
      return result.tags.map((tag: { name: string; relevance: number }) => 
        new Tag(tag.name, tag.relevance)
      );
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return [];
    }
  }

  /**
   * 分析创意内容并提取关键概念
   * 
   * @param idea - 要分析的创意
   * @returns 关键概念列表
   */
  async extractKeyConcepts(idea: Idea): Promise<string[]> {
    const prompt = `
      Please extract the key concepts from the following idea.
      
      Idea Title: ${idea.title}
      Idea Content: ${idea.content.toString()}
      
      Return your response as a JSON object with the following format:
      {
        "concepts": ["concept1", "concept2", "concept3"]
      }
    `;

    try {
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      const result = JSON.parse(response);
      return result.concepts;
    } catch (error) {
      console.error('Error extracting key concepts:', error);
      return [];
    }
  }

  /**
   * 计算两个创意之间的相似度
   * 
   * @param ideaA - 第一个创意
   * @param ideaB - 第二个创意
   * @returns 相似度分数（0-100）
   */
  async calculateSimilarity(ideaA: Idea, ideaB: Idea): Promise<number> {
    const prompt = `
      Please calculate the similarity between the following two ideas on a scale of 0 to 100,
      where 0 means completely different and 100 means identical.
      
      Idea 1 Title: ${ideaA.title}
      Idea 1 Content: ${ideaA.content.toString()}
      
      Idea 2 Title: ${ideaB.title}
      Idea 2 Content: ${ideaB.content.toString()}
      
      Return your response as a JSON object with the following format:
      {
        "similarity_score": 75,
        "common_themes": ["theme1", "theme2"]
      }
    `;

    try {
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      const result = JSON.parse(response);
      return result.similarity_score;
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return 0;
    }
  }

  /**
   * 为创意推荐相关创意
   * 
   * @param idea - 源创意
   * @param candidateIdeas - 候选创意列表
   * @param maxRecommendations - 最大推荐数量，默认为5
   * @returns 推荐的相关创意列表
   */
  async recommendRelatedIdeas(
    idea: Idea,
    candidateIdeas: Idea[],
    maxRecommendations = 5
  ): Promise<Idea[]> {
    // 计算每个候选创意与源创意的相似度
    const similarityPromises = candidateIdeas.map(async candidateIdea => {
      const similarity = await this.calculateSimilarity(idea, candidateIdea);
      return { idea: candidateIdea, similarity };
    });

    const similarities = await Promise.all(similarityPromises);

    // 按相似度排序并选择前N个
    return similarities
      .filter(item => item.similarity > 50) // 只推荐相似度大于50的创意
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxRecommendations)
      .map(item => item.idea);
  }
}

