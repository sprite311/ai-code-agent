import express, { Express, Request, Response, NextFunction } from 'express';
import routes from './routes';

/**
 * 创建Express应用
 * 
 * @returns Express应用实例
 */
export function createApp(): Express {
  const app = express();
  
  // 中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // API路由
  const apiPrefix = process.env.API_PREFIX || '/api';
  app.use(apiPrefix, routes);
  
  // 404处理
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
  
  // 错误处理
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
  
  return app;
}

