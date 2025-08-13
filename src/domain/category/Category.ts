import { CategoryId } from './CategoryId';

/**
 * 分类实体
 * 
 * 表示创意的分类
 */
export class Category {
  private readonly _id: CategoryId;
  private _name: string;
  private _description: string;
  private _parentCategory?: Category;
  private _subCategories: Category[] = [];

  /**
   * 创建分类
   * 
   * @param id - 分类ID
   * @param name - 分类名称
   * @param description - 分类描述
   * @param parentCategory - 父分类（可选）
   * @throws Error 如果名称为空
   */
  constructor(
    id: CategoryId,
    name: string,
    description: string,
    parentCategory?: Category
  ) {
    if (!name || name.trim() === '') {
      throw new Error('Category name cannot be empty');
    }

    this._id = id;
    this._name = name.trim();
    this._description = description || '';
    this._parentCategory = parentCategory;

    // 如果有父分类，将此分类添加为其子分类
    if (parentCategory) {
      parentCategory.addSubCategory(this);
    }
  }

  /**
   * 创建新分类
   * 
   * @param name - 分类名称
   * @param description - 分类描述
   * @param parentCategory - 父分类（可选）
   * @returns 新的分类实例
   */
  static create(name: string, description: string, parentCategory?: Category): Category {
    return new Category(CategoryId.generate(), name, description, parentCategory);
  }

  /**
   * 获取分类ID
   */
  get id(): CategoryId {
    return this._id;
  }

  /**
   * 获取分类名称
   */
  get name(): string {
    return this._name;
  }

  /**
   * 设置分类名称
   * 
   * @param name - 新的分类名称
   * @throws Error 如果名称为空
   */
  set name(name: string) {
    if (!name || name.trim() === '') {
      throw new Error('Category name cannot be empty');
    }
    this._name = name.trim();
  }

  /**
   * 获取分类描述
   */
  get description(): string {
    return this._description;
  }

  /**
   * 设置分类描述
   * 
   * @param description - 新的分类描述
   */
  set description(description: string) {
    this._description = description || '';
  }

  /**
   * 获取父分类
   */
  get parentCategory(): Category | undefined {
    return this._parentCategory;
  }

  /**
   * 设置父分类
   * 
   * @param category - 新的父分类
   */
  set parentCategory(category: Category | undefined) {
    // 如果已有父分类，从其子分类中移除此分类
    if (this._parentCategory) {
      this._parentCategory.removeSubCategory(this);
    }

    this._parentCategory = category;

    // 如果设置了新的父分类，将此分类添加为其子分类
    if (category) {
      category.addSubCategory(this);
    }
  }

  /**
   * 获取子分类
   */
  get subCategories(): Category[] {
    return [...this._subCategories];
  }

  /**
   * 添加子分类
   * 
   * @param category - 要添加的子分类
   */
  addSubCategory(category: Category): void {
    // 防止循环引用
    if (this.isDescendantOf(category)) {
      throw new Error('Cannot add a category as a subcategory of its own descendant');
    }

    // 防止重复添加
    if (!this._subCategories.some(c => c.id.equals(category.id))) {
      this._subCategories.push(category);
      
      // 确保子分类的父分类指向此分类
      if (!category.parentCategory || !category.parentCategory.id.equals(this.id)) {
        // 使用内部字段避免触发setter的循环调用
        category._parentCategory = this;
      }
    }
  }

  /**
   * 移除子分类
   * 
   * @param category - 要移除的子分类
   */
  removeSubCategory(category: Category): void {
    this._subCategories = this._subCategories.filter(c => !c.id.equals(category.id));
    
    // 如果子分类的父分类是此分类，清除其父分类引用
    if (category.parentCategory && category.parentCategory.id.equals(this.id)) {
      // 使用内部字段避免触发setter的循环调用
      category._parentCategory = undefined;
    }
  }

  /**
   * 检查此分类是否为指定分类的后代
   * 
   * @param category - 要检查的潜在祖先分类
   * @returns 如果此分类是指定分类的后代则返回true，否则返回false
   */
  isDescendantOf(category: Category): boolean {
    let current = this.parentCategory;
    while (current) {
      if (current.id.equals(category.id)) {
        return true;
      }
      current = current.parentCategory;
    }
    return false;
  }

  /**
   * 获取分类的完整路径（从根分类到此分类）
   * 
   * @returns 分类路径数组
   */
  getPath(): Category[] {
    const path: Category[] = [];
    let current: Category | undefined = this;
    
    while (current) {
      path.unshift(current);
      current = current.parentCategory;
    }
    
    return path;
  }

  /**
   * 获取分类的完整路径名称
   * 
   * @param separator - 路径分隔符，默认为" > "
   * @returns 分类路径名称字符串
   */
  getPathName(separator = ' > '): string {
    return this.getPath().map(c => c.name).join(separator);
  }
}

