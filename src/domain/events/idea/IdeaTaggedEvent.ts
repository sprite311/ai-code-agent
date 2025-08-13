import { DomainEvent } from '../DomainEvent';
import { IdeaId } from '../../idea/IdeaId';

/**
 * 创意标记事件
 * 
 * 当创意被添加标签时触发
 */
export class IdeaTaggedEvent extends DomainEvent {
  readonly eventType = 'idea.tagged';

  /**
   * 创建创意标记事件
   * 
   * @param ideaId - 创意ID
   * @param tags - 标签列表
   */
  constructor(
    readonly ideaId: IdeaId,
    readonly tags: string[]
  ) {
    super();
  }
}

