import { IdeaId } from './IdeaId';
import { IdeaContent } from './IdeaContent';
import { IdeaSource } from './IdeaSource';
import { Category } from '../category/Category';
import { CategoryId } from '../category/CategoryId';
import { Tag } from './Tag';

/**
 * 创意实体
 * 
 * 表示系统中的创意，可以是生成的或爬取的
 */
export class Idea {
  /**
   * 创建创意实例
   * 
   * @param id - 创意ID
   * @param title - 创意标题
   * @param content - 创意内容
   * @param source - 创意来源
   * @param creationDate - 创建日期
   * @param categories - 分类列表
   * @param tags - 标签列表
   * @param popularity - 热门度
   */
  constructor(
    private readonly _id: IdeaId,
    private _title: string,
    private _content: IdeaContent,
    private readonly _source: IdeaSource,
    private readonly _creationDate: Date,
    private _categories: Category[] = [],
    private _tags: Tag[] = [],
    private _popularity: number = 0
  ) {
    if (!_title || _title.trim() === '') {
      throw new Error('Idea title cannot be empty');
    }
    this._title = _title.trim();
  }

  /**
   * 创建新创意
   * 
   * @param title - 创意标题
   * @param content - 创意内容
   * @param source - 创意来源
   * @returns 新的创意实例
   */
  static create(title: string, content: IdeaContent, source: IdeaSource): Idea {
    return new Idea(
      IdeaId.generate(),
      title,
      content,
      source,
      new Date()
    );
  }

  /**
   * 获取创意ID
   */
  get id(): IdeaId {
    return this._id;
  }

  /**
   * 获取创意标题
   */
  get title(): string {
    return this._title;
  }

  /**
   * 更新创意标题
   * 
   * @param title - 新标题
   * @throws Error 如果标题为空
   */
  updateTitle(title: string): void {
    if (!title || title.trim() === '') {
      throw new Error('Idea title cannot be empty');
    }
    this._title = title.trim();
  }

  /**
   * 获取创意内容
   */
  get content(): IdeaContent {
    return this._content;
  }

  /**
   * 更新创意内容
   * 
   * @param content - 新内容
   */
  updateContent(content: IdeaContent): void {
    this._content = content;
  }

  /**
   * 获取创意来源
   */
  get source(): IdeaSource {
    return this._source;
  }

  /**
   * 获取创建日期
   */
  get creationDate(): Date {
    return new Date(this._creationDate.getTime());
  }

  /**
   * 获取分类列表
   */
  get categories(): Category[] {
    return [...this._categories];
  }

  /**
   * 添加分类
   * 
   * @param category - 要添加的分类
   */
  addCategory(category: Category): void {
    if (!this._categories.some(c => c.id.equals(category.id))) {
      this._categories.push(category);
    }
  }

  /**
   * 移除分类
   * 
   * @param categoryId - 要移除的分类ID
   */
  removeCategory(categoryId: CategoryId): void {
    this._categories = this._categories.filter(c => !c.id.equals(categoryId));
  }

  /**
   * 获取标签列表
   */
  get tags(): Tag[] {
    return [...this._tags];
  }

  /**
   * 添加标签
   * 
   * @param tag - 要添加的标签
   */
  addTag(tag: Tag): void {
    if (!this._tags.some(t => t.getName() === tag.getName())) {
      this._tags.push(tag);
    }
  }

  /**
   * 移除标签
   * 
   * @param tagName - 要移除的标签名称
   */
  removeTag(tagName: string): void {
    this._tags = this._tags.filter(t => t.getName() !== tagName.toLowerCase());
  }

  /**
   * 获取热门度
   */
  get popularity(): number {
    return this._popularity;
  }

  /**
   * 增加热门度
   * 
   * @param amount - 增加的数量，默认为1
   */
  increasePopularity(amount = 1): void {
    this._popularity += amount;
  }

  /**
   * 检查创意是否包含指定标签
   * 
   * @param tagName - 标签名称
   * @returns 如果包含该标签则返回true，否则返回false
   */
  hasTag(tagName: string): boolean {
    return this._tags.some(t => t.getName() === tagName.toLowerCase());
  }

  /**
   * 检查创意是否属于指定分类
   * 
   * @param categoryId - 分类ID
   * @returns 如果属于该分类则返回true，否则返回false
   */
  belongsToCategory(categoryId: CategoryId): boolean {
    return this._categories.some(c => c.id.equals(categoryId));
  }

  /**
   * 获取创意的年龄（天数）
   * 
   * @returns 创意的年龄（天数）
   */
  getAge(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._creationDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 检查创意是否为新创意（7天内）
   * 
   * @returns 如果是新创意则返回true，否则返回false
   */
  isNew(): boolean {
    return this.getAge() <= 7;
  }
}

