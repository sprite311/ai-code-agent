import { v4 as uuidv4 } from 'uuid';

/**
 * 创意ID值对象
 * 
 * 表示创意的唯一标识符
 */
export class IdeaId {
  private readonly value: string;

  /**
   * 创建创意ID
   * 
   * @param id - 创意ID值，如果不提供则自动生成
   */
  constructor(id?: string) {
    this.value = id || `idea-${uuidv4()}`;
  }

  /**
   * 生成新的创意ID
   * 
   * @returns 新的创意ID实例
   */
  static generate(): IdeaId {
    return new IdeaId();
  }

  /**
   * 获取ID值
   * 
   * @returns ID字符串值
   */
  toString(): string {
    return this.value;
  }

  /**
   * 比较两个ID是否相等
   * 
   * @param other - 要比较的另一个ID
   * @returns 如果两个ID相等则返回true，否则返回false
   */
  equals(other: IdeaId): boolean {
    if (!(other instanceof IdeaId)) {
      return false;
    }
    return this.value === other.value;
  }
}

