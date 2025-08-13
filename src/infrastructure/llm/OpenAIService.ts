import { ILLMService, LLMGenerationOptions } from '../../domain/services/ILLMService';
import OpenAI from 'openai';

/**
 * OpenAI服务实现
 * 
 * 使用OpenAI API实现LLM服务
 */
export class OpenAIService implements ILLMService {
  private readonly openai: OpenAI;
  private readonly defaultModel: string;

  /**
   * 创建OpenAI服务
   * 
   * @param apiKey - OpenAI API密钥
   * @param defaultModel - 默认模型名称
   */
  constructor(apiKey: string, defaultModel = 'gpt-4') {
    this.openai = new OpenAI({
      apiKey: apiKey
    });
    this.defaultModel = defaultModel;
  }

  /**
   * 生成文本补全
   * 
   * @param prompt - 提示文本
   * @param options - 生成选项
   * @returns 生成的文本
   */
  async generateCompletion(prompt: string, options?: LLMGenerationOptions): Promise<string> {
    try {
      const model = options?.model || this.defaultModel;
      const temperature = options?.temperature ?? 0.7;
      const maxTokens = options?.maxTokens ?? 1000;
      const systemPrompt = options?.systemPrompt ?? 'You are a creative assistant that generates innovative ideas.';

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate completion: ${(error as Error).message}`);
    }
  }
}

