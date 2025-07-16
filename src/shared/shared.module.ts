import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { JsonStorageService } from './services/json-storage.service';

@Global()
@Module({
  providers: [LoggerService, JsonStorageService],
  exports: [LoggerService, JsonStorageService],
})
export class SharedModule {} 