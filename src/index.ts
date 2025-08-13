import 'reflect-metadata';
import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './interfaces/api/app';
import { configureContainer } from './infrastructure/di/container';

// 加载环境变量
dotenv.config();

// 应用入口点
async function bootstrap(): Promise<void> {
  try {
    console.log('创意想法生成应用启动中...');
    
    // 配置依赖注入容器
    configureContainer();
    
    // 创建Express应用
    const app = createApp();
    
    // 创建HTTP服务器
    const server = http.createServer(app);
    
    // 启动服务器
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`应用已启动，监听端口: ${port}`);
    });
    
    // 保存服务器引用，用于优雅关闭
    global.server = server;
  } catch (error) {
    console.error('应用启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
bootstrap().catch(err => {
  console.error('未捕获的错误:', err);
  process.exit(1);
});

// 处理进程终止信号
process.on('SIGINT', () => {
  console.log('接收到SIGINT信号，正在优雅关闭...');
  if (global.server) {
    global.server.close(() => {
      console.log('HTTP服务器已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log('接收到SIGTERM信号，正在优雅关闭...');
  if (global.server) {
    global.server.close(() => {
      console.log('HTTP服务器已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// 处理未捕获的异常和拒绝
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的拒绝:', reason);
});

