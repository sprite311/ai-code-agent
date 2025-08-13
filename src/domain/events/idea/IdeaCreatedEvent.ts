import { DomainEvent } from '../DomainEvent';
import { IdeaId } from '../../idea/IdeaId';
import { IdeaSourceType } from '../../idea/IdeaSourceType';

/**
 * 创意创建事件
 * 
 * 当新创意被创建时触发
 */
export class IdeaCreatedEvent extends DomainEvent {
  readonly eventType = 'idea.created';

  /**
   * 创建创意创建事件
   * 
   * @param ideaId - 创意ID
   * @param title - 创意标题
   * @param sourceType - 创意来源类型
   */
  constructor(
    readonly ideaId: IdeaId,
    readonly title: string,
    readonly sourceType: IdeaSourceType
  ) {
    super();
  }
}

