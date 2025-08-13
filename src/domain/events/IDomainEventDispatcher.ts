import { DomainEvent } from './DomainEvent';

/**
 * 领域事件处理器
 */
export type DomainEventHandler<T extends DomainEvent> = (event: T) => Promise<void>;

/**
 * 领域事件分发器接口
 * 
 * 负责分发和处理领域事件
 */
export interface IDomainEventDispatcher {
  /**
   * 注册事件处理器
   * 
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  register<T extends DomainEvent>(eventType: string, handler: DomainEventHandler<T>): void;

  /**
   * 分发事件
   * 
   * @param event - 要分发的事件
   */
  dispatch<T extends DomainEvent>(event: T): Promise<void>;
}

