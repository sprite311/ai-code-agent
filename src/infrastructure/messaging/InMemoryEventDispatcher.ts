import { IDomainEventDispatcher, DomainEventHandler } from '../../domain/events/IDomainEventDispatcher';
import { DomainEvent } from '../../domain/events/DomainEvent';

/**
 * 内存事件分发器
 * 
 * 基于内存的领域事件分发器实现
 */
export class InMemoryEventDispatcher implements IDomainEventDispatcher {
  private handlers: Map<string, DomainEventHandler<any>[]> = new Map();

  /**
   * 注册事件处理器
   * 
   * @param eventType - 事件类型
   * @param handler - 事件处理器
   */
  register<T extends DomainEvent>(eventType: string, handler: DomainEventHandler<T>): void {
    const eventHandlers = this.handlers.get(eventType) || [];
    eventHandlers.push(handler);
    this.handlers.set(eventType, eventHandlers);
  }

  /**
   * 分发事件
   * 
   * @param event - 要分发的事件
   */
  async dispatch<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    console.log(`Dispatching event: ${eventType}`, event);

    const promises = handlers.map(handler => {
      try {
        return handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }
}

