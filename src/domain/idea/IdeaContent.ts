/**
 * 创意内容值对象
 * 
 * 表示创意的详细内容
 */
export class IdeaContent {
  private readonly value: string;

  /**
   * 创建创意内容
   * 
   * @param content - 创意内容文本
   * @throws Error 如果内容为空
   */
  constructor(content: string) {
    if (!content || content.trim() === '') {
      throw new Error('Idea content cannot be empty');
    }
    this.value = content.trim();
  }

  /**
   * 获取内容值
   * 
   * @returns 内容字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * 比较两个内容是否相等
   * 
   * @param other - 要比较的另一个内容
   * @returns 如果两个内容相等则返回true，否则返回false
   */
  equals(other: IdeaContent): boolean {
    if (!(other instanceof IdeaContent)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * 获取内容摘要
   * 
   * @param maxLength - 摘要最大长度，默认为100
   * @returns 内容摘要
   */
  getSummary(maxLength = 100): string {
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return `${this.value.substring(0, maxLength - 3)}...`;
  }
}

