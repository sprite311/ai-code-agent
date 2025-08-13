/**
 * LLM服务接口
 * 
 * 定义与大型语言模型交互的服务
 */
export interface ILLMService {
  /**
   * 生成文本补全
   * 
   * @param prompt - 提示文本
   * @param options - 生成选项（可选）
   * @returns 生成的文本
   */
  generateCompletion(prompt: string, options?: LLMGenerationOptions): Promise<string>;
}

/**
 * LLM生成选项
 */
export interface LLMGenerationOptions {
  /**
   * 温度参数，控制生成的随机性（0-1）
   */
  temperature?: number;

  /**
   * 最大生成的标记数
   */
  maxTokens?: number;

  /**
   * 使用的模型名称
   */
  model?: string;

  /**
   * 系统提示
   */
  systemPrompt?: string;
}

