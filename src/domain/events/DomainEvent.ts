/**
 * 领域事件基类
 * 
 * 所有领域事件的基类
 */
export abstract class DomainEvent {
  /**
   * 事件发生时间
   */
  readonly occurredOn: Date;

  /**
   * 事件类型
   */
  abstract readonly eventType: string;

  /**
   * 创建领域事件
   */
  constructor() {
    this.occurredOn = new Date();
  }
}

