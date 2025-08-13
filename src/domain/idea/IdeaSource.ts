import { IdeaSourceType } from './IdeaSourceType';

/**
 * 创意来源值对象
 * 
 * 表示创意的来源信息
 */
export class IdeaSource {
  /**
   * 创建创意来源
   * 
   * @param type - 来源类型
   * @param reference - 来源引用（如提示ID、URL等）
   */
  constructor(
    private readonly type: IdeaSourceType,
    private readonly reference: string
  ) {}

  /**
   * 获取来源类型
   * 
   * @returns 来源类型
   */
  getType(): IdeaSourceType {
    return this.type;
  }

  /**
   * 获取来源引用
   * 
   * @returns 来源引用
   */
  getReference(): string {
    return this.reference;
  }

  /**
   * 检查是否为生成的创意
   * 
   * @returns 如果是生成的创意则返回true，否则返回false
   */
  isGenerated(): boolean {
    return this.type === IdeaSourceType.GENERATED;
  }

  /**
   * 检查是否为爬取的创意
   * 
   * @returns 如果是爬取的创意则返回true，否则返回false
   */
  isCrawled(): boolean {
    return this.type === IdeaSourceType.CRAWLED;
  }

  /**
   * 检查是否为用户输入的创意
   * 
   * @returns 如果是用户输入的创意则返回true，否则返回false
   */
  isUserInput(): boolean {
    return this.type === IdeaSourceType.USER_INPUT;
  }

  /**
   * 比较两个来源是否相等
   * 
   * @param other - 要比较的另一个来源
   * @returns 如果两个来源相等则返回true，否则返回false
   */
  equals(other: IdeaSource): boolean {
    if (!(other instanceof IdeaSource)) {
      return false;
    }
    return this.type === other.type && this.reference === other.reference;
  }

  /**
   * 获取来源描述
   * 
   * @returns 来源描述字符串
   */
  toString(): string {
    switch (this.type) {
      case IdeaSourceType.GENERATED:
        return `Generated from prompt: ${this.reference}`;
      case IdeaSourceType.CRAWLED:
        return `Crawled from: ${this.reference}`;
      case IdeaSourceType.USER_INPUT:
        return `Created by user: ${this.reference}`;
      default:
        return `Source: ${this.reference}`;
    }
  }
}

