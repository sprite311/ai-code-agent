import dotenv from 'dotenv';
import { app } from './interfaces/api/app';
import { Container } from './infrastructure/di/container';
import { CrawlerSchedulerService } from './application/crawler/CrawlerSchedulerService';

// 加载环境变量
dotenv.config();

// 获取端口
const PORT = process.env.PORT || 3000;

// 初始化依赖注入容器
const container = Container.getInstance();

// 启动应用
async function bootstrap() {
  try {
    // 初始化容器
    const useMongoDb = process.env.MONGODB_URI !== undefined;
    const useElasticsearch = process.env.ELASTICSEARCH_URI !== undefined;
    
    await container.initialize(useMongoDb, useElasticsearch);
    console.log('Container initialized');
    
    // 启动定时爬虫（如果配置了）
    if (process.env.CRAWLER_INTERVAL_MINUTES) {
      const crawlerSchedulerService = container.resolve<CrawlerSchedulerService>('crawlerSchedulerService');
      const intervalMinutes = parseInt(process.env.CRAWLER_INTERVAL_MINUTES);
      const targetsPerRun = parseInt(process.env.CRAWLER_TARGETS_PER_RUN || '5');
      
      crawlerSchedulerService.startScheduledCrawling(intervalMinutes, targetsPerRun);
      console.log(`Scheduled crawler started with interval of ${intervalMinutes} minutes`);
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// 启动应用
bootstrap();

