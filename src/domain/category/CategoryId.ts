import { v4 as uuidv4 } from 'uuid';

/**
 * 分类ID值对象
 * 
 * 表示分类的唯一标识符
 */
export class CategoryId {
  private readonly value: string;

  /**
   * 创建分类ID
   * 
   * @param id - 分类ID值，如果不提供则自动生成
   */
  constructor(id?: string) {
    this.value = id || `category-${uuidv4()}`;
  }

  /**
   * 生成新的分类ID
   * 
   * @returns 新的分类ID实例
   */
  static generate(): CategoryId {
    return new CategoryId();
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
  equals(other: CategoryId): boolean {
    if (!(other instanceof CategoryId)) {
      return false;
    }
    return this.value === other.value;
  }
}

