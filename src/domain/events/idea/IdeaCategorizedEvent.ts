import { DomainEvent } from '../DomainEvent';
import { IdeaId } from '../../idea/IdeaId';
import { CategoryId } from '../../category/CategoryId';

/**
 * 创意分类事件
 * 
 * 当创意被分类时触发
 */
export class IdeaCategorizedEvent extends DomainEvent {
  readonly eventType = 'idea.categorized';

  /**
   * 创建创意分类事件
   * 
   * @param ideaId - 创意ID
   * @param categoryIds - 分类ID列表
   */
  constructor(
    readonly ideaId: IdeaId,
    readonly categoryIds: CategoryId[]
  ) {
    super();
  }
}

