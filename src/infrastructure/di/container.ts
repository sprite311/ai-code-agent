import { container } from 'tsyringe';

// 领域服务
import { ILLMService } from '../../domain/services/ILLMService';
import { IIdeaCategorizationService } from '../../domain/services/IdeaCategorizationService';
import { IDomainEventDispatcher } from '../../domain/events/IDomainEventDispatcher';

// 仓储接口
import { IIdeaRepository } from '../../domain/idea/IIdeaRepository';

// 实现
import { OpenAIService } from '../llm/OpenAIService';
import { LLMIdeaCategorizationService } from '../../domain/services/LLMIdeaCategorizationService';
import { InMemoryEventDispatcher } from '../messaging/InMemoryEventDispatcher';
import { InMemoryIdeaRepository } from '../persistence/InMemoryIdeaRepository';

// 应用服务
import { IdeaGenerationService } from '../../application/idea/IdeaGenerationService';

/**
 * 配置依赖注入容器
 */
export function configureContainer(): void {
  // 注册LLM服务
  container.register<ILLMService>('ILLMService', {
    useFactory: () => {
      const apiKey = process.env.OPENAI_API_KEY || '';
      const model = process.env.LLM_MODEL || 'gpt-4';
      return new OpenAIService(apiKey, model);
    }
  });

  // 注册事件分发器
  container.register<IDomainEventDispatcher>('IDomainEventDispatcher', {
    useClass: InMemoryEventDispatcher
  });

  // 注册仓储
  container.register<IIdeaRepository>('IIdeaRepository', {
    useClass: InMemoryIdeaRepository
  });

  // 注册领域服务
  container.register<IIdeaCategorizationService>('IIdeaCategorizationService', {
    useFactory: (dependencyContainer) => {
      const llmService = dependencyContainer.resolve<ILLMService>('ILLMService');
      return new LLMIdeaCategorizationService(llmService);
    }
  });

  // 注册应用服务
  container.register<IdeaGenerationService>('IdeaGenerationService', {
    useFactory: (dependencyContainer) => {
      const llmService = dependencyContainer.resolve<ILLMService>('ILLMService');
      const ideaRepository = dependencyContainer.resolve<IIdeaRepository>('IIdeaRepository');
      const categorizationService = dependencyContainer.resolve<IIdeaCategorizationService>('IIdeaCategorizationService');
      const eventDispatcher = dependencyContainer.resolve<IDomainEventDispatcher>('IDomainEventDispatcher');
      
      return new IdeaGenerationService(
        llmService,
        ideaRepository,
        categorizationService,
        eventDispatcher
      );
    }
  });
}

/**
 * 获取容器实例
 */
export { container };

