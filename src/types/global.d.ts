import { Server } from 'http';

declare global {
  var server: Server;
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      API_PREFIX?: string;
      MONGODB_URI?: string;
      ELASTICSEARCH_URL?: string;
      REDIS_URL?: string;
      RABBITMQ_URL?: string;
      OPENAI_API_KEY?: string;
      LLM_MODEL?: string;
      LLM_TEMPERATURE?: string;
      LLM_MAX_TOKENS?: string;
      CRAWLER_USER_AGENT?: string;
      CRAWLER_CONCURRENCY?: string;
      CRAWLER_DELAY?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      LOG_LEVEL?: string;
    }
  }
}

