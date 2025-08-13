import { ICrawlerService } from '../../domain/crawler/ICrawlerService';
import { CrawlerTarget } from '../../domain/crawler/CrawlerTarget';
import { CrawlerResult, CrawlerResultStatus, CrawledItem } from '../../domain/crawler/CrawlerResult';
import { IdeaSourceType } from '../../domain/idea/IdeaSourceType';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Puppeteer爬虫服务
 * 
 * 使用Puppeteer实现的爬虫服务
 */
export class PuppeteerCrawlerService implements ICrawlerService {
  private browser: Browser | null = null;
  private isRunning: boolean = false;
  private stopRequested: boolean = false;

  /**
   * 创建Puppeteer爬虫服务
   * 
   * @param userAgent - 用户代理字符串
   * @param timeout - 超时时间（毫秒）
   */
  constructor(
    private readonly userAgent: string = 'Mozilla/5.0 (compatible; CreativeIdeasBot/1.0; +https://example.com/bot)',
    private readonly timeout: number = 30000
  ) {}

  /**
   * 初始化浏览器
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * 关闭浏览器
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 爬取单个目标
   * 
   * @param target - 爬取目标
   * @returns 爬取结果
   */
  async crawlTarget(target: CrawlerTarget): Promise<CrawlerResult> {
    try {
      this.isRunning = true;
      this.stopRequested = false;

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.setDefaultNavigationTimeout(this.timeout);
      
      // 访问目标URL
      await page.goto(target.url, { waitUntil: 'networkidle2' });
      
      // 爬取内容
      const items = await this.extractItems(page, target);
      
      await page.close();
      
      this.isRunning = false;
      
      return new CrawlerResult(
        target.id,
        target.url,
        items.length > 0 ? CrawlerResultStatus.SUCCESS : CrawlerResultStatus.PARTIAL,
        items
      );
    } catch (error) {
      this.isRunning = false;
      console.error(`Error crawling ${target.url}:`, error);
      
      return new CrawlerResult(
        target.id,
        target.url,
        CrawlerResultStatus.FAILED,
        [],
        (error as Error).message
      );
    }
  }

  /**
   * 爬取多个目标
   * 
   * @param targets - 爬取目标列表
   * @param concurrency - 并发数量
   * @returns 爬取结果列表
   */
  async crawlTargets(targets: CrawlerTarget[], concurrency: number = 2): Promise<CrawlerResult[]> {
    this.isRunning = true;
    this.stopRequested = false;
    
    const results: CrawlerResult[] = [];
    const browser = await this.initBrowser();
    
    // 创建一个并发控制的爬取函数
    const crawlWithConcurrency = async () => {
      // 创建任务队列
      const queue = [...targets];
      const activePromises = new Set<Promise<void>>();
      
      while (queue.length > 0 && !this.stopRequested) {
        // 如果活跃任务数量小于并发数且队列不为空，则启动新任务
        while (activePromises.size < concurrency && queue.length > 0 && !this.stopRequested) {
          const target = queue.shift()!;
          
          // 创建爬取任务
          const promise = (async () => {
            try {
              // 创建新页面
              const page = await browser.newPage();
              await page.setUserAgent(this.userAgent);
              await page.setDefaultNavigationTimeout(this.timeout);
              
              // 添加随机延迟，避免请求过于频繁
              const delay = target.getCrawlDelay() + Math.floor(Math.random() * 1000);
              await new Promise(resolve => setTimeout(resolve, delay));
              
              // 访问目标URL
              await page.goto(target.url, { waitUntil: 'networkidle2' });
              
              // 爬取内容
              const items = await this.extractItems(page, target);
              
              // 关闭页面
              await page.close();
              
              // 保存结果
              results.push(new CrawlerResult(
                target.id,
                target.url,
                items.length > 0 ? CrawlerResultStatus.SUCCESS : CrawlerResultStatus.PARTIAL,
                items
              ));
            } catch (error) {
              console.error(`Error crawling ${target.url}:`, error);
              
              results.push(new CrawlerResult(
                target.id,
                target.url,
                CrawlerResultStatus.FAILED,
                [],
                (error as Error).message
              ));
            }
          })();
          
          // 添加到活跃任务集合
          activePromises.add(promise);
          
          // 任务完成后从活跃集合中移除
          promise.then(() => {
            activePromises.delete(promise);
          });
        }
        
        // 等待任意一个任务完成
        if (activePromises.size > 0) {
          await Promise.race(activePromises);
        }
      }
      
      // 等待所有活跃任务完成
      await Promise.all(activePromises);
    };
    
    await crawlWithConcurrency();
    
    this.isRunning = false;
    return results;
  }

  /**
   * 爬取URL
   * 
   * @param url - 要爬取的URL
   * @param selectors - CSS选择器配置
   * @returns 爬取结果
   */
  async crawlUrl(url: string, selectors: any): Promise<CrawlerResult> {
    try {
      this.isRunning = true;
      this.stopRequested = false;
      
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.setDefaultNavigationTimeout(this.timeout);
      
      // 访问URL
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // 创建临时目标
      const target = new CrawlerTarget(
        'temp-' + Date.now(),
        url,
        'Temporary Target',
        url.includes('blog') ? CrawlerTarget.BLOG : CrawlerTarget.WEBSITE,
        selectors
      );
      
      // 爬取内容
      const items = await this.extractItems(page, target);
      
      await page.close();
      
      this.isRunning = false;
      
      return new CrawlerResult(
        target.id,
        url,
        items.length > 0 ? CrawlerResultStatus.SUCCESS : CrawlerResultStatus.PARTIAL,
        items
      );
    } catch (error) {
      this.isRunning = false;
      console.error(`Error crawling ${url}:`, error);
      
      return new CrawlerResult(
        'temp-' + Date.now(),
        url,
        CrawlerResultStatus.FAILED,
        [],
        (error as Error).message
      );
    }
  }

  /**
   * 停止所有爬取任务
   */
  async stopAll(): Promise<void> {
    this.stopRequested = true;
    
    // 等待当前任务完成
    while (this.isRunning) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await this.closeBrowser();
  }

  /**
   * 从页面提取项目
   * 
   * @param page - Puppeteer页面
   * @param target - 爬取目标
   * @returns 爬取的项目列表
   */
  private async extractItems(page: Page, target: CrawlerTarget): Promise<CrawledItem[]> {
    const items: CrawledItem[] = [];
    const selectors = target.selectors;
    
    try {
      // 等待内容容器加载
      await page.waitForSelector(selectors.contentContainer, { timeout: this.timeout });
      
      // 获取所有内容容器
      const containers = await page.$$(selectors.contentContainer);
      
      for (const container of containers) {
        try {
          // 提取标题
          const titleElement = await container.$(selectors.title);
          const title = titleElement 
            ? await page.evaluate(el => el.textContent?.trim() || '', titleElement)
            : '';
          
          // 提取内容
          const contentElement = await container.$(selectors.content);
          const content = contentElement 
            ? await page.evaluate(el => el.textContent?.trim() || '', contentElement)
            : '';
          
          // 如果标题和内容都为空，则跳过
          if (!title && !content) {
            continue;
          }
          
          // 提取作者（如果有）
          let author = undefined;
          if (selectors.author) {
            const authorElement = await container.$(selectors.author);
            if (authorElement) {
              author = await page.evaluate(el => el.textContent?.trim() || '', authorElement);
            }
          }
          
          // 提取日期（如果有）
          let publishDate = undefined;
          if (selectors.date) {
            const dateElement = await container.$(selectors.date);
            if (dateElement) {
              const dateText = await page.evaluate(el => el.textContent?.trim() || '', dateElement);
              if (dateText) {
                try {
                  publishDate = new Date(dateText);
                } catch (e) {
                  // 日期解析失败，忽略
                }
              }
            }
          }
          
          // 提取标签（如果有）
          let tags = undefined;
          if (selectors.tags) {
            const tagElements = await container.$$(selectors.tags);
            if (tagElements.length > 0) {
              tags = await Promise.all(
                tagElements.map(async el => 
                  await page.evaluate(node => node.textContent?.trim() || '', el)
                )
              );
              // 过滤空标签
              tags = tags.filter(tag => tag.length > 0);
            }
          }
          
          // 创建爬取项目
          const item: CrawledItem = {
            title: title || 'Untitled',
            content,
            url: await page.url(),
            sourceType: IdeaSourceType.CRAWLED,
            sourceName: target.name,
            crawledAt: new Date(),
            author,
            publishDate,
            tags
          };
          
          items.push(item);
        } catch (error) {
          console.error('Error extracting item:', error);
          // 继续处理下一个容器
        }
      }
      
      // 如果有分页且有下一页，则递归爬取下一页
      if (selectors.pagination && selectors.nextPage) {
        const nextPageElement = await page.$(selectors.nextPage);
        if (nextPageElement) {
          const nextPageUrl = await page.evaluate(el => el.getAttribute('href'), nextPageElement);
          if (nextPageUrl) {
            // 构建完整URL
            const nextUrl = new URL(nextPageUrl, page.url()).toString();
            
            // 检查是否是不同的URL，避免无限循环
            if (nextUrl !== page.url()) {
              // 添加延迟，避免请求过于频繁
              await new Promise(resolve => setTimeout(resolve, target.getCrawlDelay()));
              
              // 访问下一页
              await page.goto(nextUrl, { waitUntil: 'networkidle2' });
              
              // 递归爬取下一页
              const nextPageItems = await this.extractItems(page, target);
              items.push(...nextPageItems);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during extraction:', error);
    }
    
    return items;
  }
}

