import { Idea } from '../../../../domain/idea/Idea';
import { IdeaId } from '../../../../domain/idea/IdeaId';
import { IdeaContent } from '../../../../domain/idea/IdeaContent';
import { IdeaSource } from '../../../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../../../domain/idea/IdeaSourceType';
import { Category } from '../../../../domain/category/Category';
import { CategoryId } from '../../../../domain/category/CategoryId';
import { Tag } from '../../../../domain/idea/Tag';

describe('Idea Entity', () => {
  const validId = new IdeaId('idea-123');
  const validTitle = 'Test Idea';
  const validContent = new IdeaContent('This is a test idea content');
  const validSource = new IdeaSource(IdeaSourceType.GENERATED, 'test-prompt-123');
  const validCreationDate = new Date();

  it('should create a valid idea', () => {
    // Arrange & Act
    const idea = Idea.create(validTitle, validContent, validSource);

    // Assert
    expect(idea).toBeDefined();
    expect(idea.id).toBeDefined();
    expect(idea.title).toBe(validTitle);
    expect(idea.content).toBe(validContent);
    expect(idea.source).toBe(validSource);
    expect(idea.creationDate).toBeInstanceOf(Date);
    expect(idea.categories).toEqual([]);
    expect(idea.tags).toEqual([]);
    expect(idea.popularity).toBe(0);
  });

  it('should create an idea with all properties', () => {
    // Arrange & Act
    const idea = new Idea(
      validId,
      validTitle,
      validContent,
      validSource,
      validCreationDate,
      [],
      [],
      10
    );

    // Assert
    expect(idea.id).toBe(validId);
    expect(idea.title).toBe(validTitle);
    expect(idea.content).toBe(validContent);
    expect(idea.source).toBe(validSource);
    expect(idea.creationDate).toBe(validCreationDate);
    expect(idea.categories).toEqual([]);
    expect(idea.tags).toEqual([]);
    expect(idea.popularity).toBe(10);
  });

  it('should throw error when title is empty', () => {
    // Arrange & Act & Assert
    expect(() => {
      Idea.create('', validContent, validSource);
    }).toThrow('Idea title cannot be empty');
  });

  it('should add a category to the idea', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const category = new Category(new CategoryId('category-123'), 'Test Category', 'Test description');

    // Act
    idea.addCategory(category);

    // Assert
    expect(idea.categories).toHaveLength(1);
    expect(idea.categories[0]).toBe(category);
  });

  it('should not add duplicate category', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const categoryId = new CategoryId('category-123');
    const category = new Category(categoryId, 'Test Category', 'Test description');
    
    // Act
    idea.addCategory(category);
    idea.addCategory(category);

    // Assert
    expect(idea.categories).toHaveLength(1);
  });

  it('should remove a category from the idea', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const categoryId = new CategoryId('category-123');
    const category = new Category(categoryId, 'Test Category', 'Test description');
    idea.addCategory(category);

    // Act
    idea.removeCategory(categoryId);

    // Assert
    expect(idea.categories).toHaveLength(0);
  });

  it('should add a tag to the idea', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const tag = new Tag('innovation');

    // Act
    idea.addTag(tag);

    // Assert
    expect(idea.tags).toHaveLength(1);
    expect(idea.tags[0]).toBe(tag);
  });

  it('should not add duplicate tag', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const tag = new Tag('innovation');
    
    // Act
    idea.addTag(tag);
    idea.addTag(tag);

    // Assert
    expect(idea.tags).toHaveLength(1);
  });

  it('should remove a tag from the idea', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const tag = new Tag('innovation');
    idea.addTag(tag);

    // Act
    idea.removeTag('innovation');

    // Assert
    expect(idea.tags).toHaveLength(0);
  });

  it('should increase popularity', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const initialPopularity = idea.popularity;

    // Act
    idea.increasePopularity();

    // Assert
    expect(idea.popularity).toBe(initialPopularity + 1);
  });

  it('should update title', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const newTitle = 'Updated Title';

    // Act
    idea.updateTitle(newTitle);

    // Assert
    expect(idea.title).toBe(newTitle);
  });

  it('should throw error when updating to empty title', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);

    // Act & Assert
    expect(() => {
      idea.updateTitle('');
    }).toThrow('Idea title cannot be empty');
  });

  it('should update content', () => {
    // Arrange
    const idea = Idea.create(validTitle, validContent, validSource);
    const newContent = new IdeaContent('Updated content');

    // Act
    idea.updateContent(newContent);

    // Assert
    expect(idea.content).toBe(newContent);
  });
});

