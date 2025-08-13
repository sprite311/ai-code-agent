/**
 * 创意来源类型枚举
 * 
 * 定义创意的来源类型
 */
export enum IdeaSourceType {
  /**
   * 由LLM生成的创意
   */
  GENERATED = 'generated',
  
  /**
   * 从网络爬取的创意
   */
  CRAWLED = 'crawled',
  
  /**
   * 用户手动输入的创意
   */
  USER_INPUT = 'user_input',
  
  /**
   * 其他来源的创意
   */
  OTHER = 'other'
}

