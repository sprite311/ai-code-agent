/**
 * 标签值对象
 * 
 * 表示与创意相关的标签
 */
export class Tag {
  private readonly name: string;
  private readonly relevance: number;

  /**
   * 创建标签
   * 
   * @param name - 标签名称
   * @param relevance - 相关性分数（0-100），默认为100
   * @throws Error 如果标签名为空或相关性分数无效
   */
  constructor(name: string, relevance = 100) {
    if (!name || name.trim() === '') {
      throw new Error('Tag name cannot be empty');
    }
    
    if (relevance < 0 || relevance > 100) {
      throw new Error('Tag relevance must be between 0 and 100');
    }
    
    this.name = name.trim().toLowerCase();
    this.relevance = relevance;
  }

  /**
   * 获取标签名称
   * 
   * @returns 标签名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 获取相关性分数
   * 
   * @returns 相关性分数
   */
  getRelevance(): number {
    return this.relevance;
  }

  /**
   * 比较两个标签是否相等（仅比较名称）
   * 
   * @param other - 要比较的另一个标签
   * @returns 如果两个标签名称相等则返回true，否则返回false
   */
  equals(other: Tag): boolean {
    if (!(other instanceof Tag)) {
      return false;
    }
    return this.name === other.name;
  }

  /**
   * 创建具有新相关性的标签副本
   * 
   * @param newRelevance - 新的相关性分数
   * @returns 新的标签实例
   */
  withRelevance(newRelevance: number): Tag {
    return new Tag(this.name, newRelevance);
  }
}

