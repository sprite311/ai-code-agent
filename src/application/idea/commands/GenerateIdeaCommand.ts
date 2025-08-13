/**
 * 生成创意命令
 * 
 * 用于请求生成创意
 */
export class GenerateIdeaCommand {
  /**
   * 创建生成创意命令
   * 
   * @param prompt - 提示文本
   * @param count - 要生成的创意数量，默认为1
   * @param userId - 用户ID（可选）
   */
  constructor(
    readonly prompt: string,
    readonly count: number = 1,
    readonly userId?: string
  ) {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt cannot be empty');
    }
    
    if (count < 1) {
      throw new Error('Count must be at least 1');
    }
  }
}

