import { Test, TestingModule } from '@nestjs/testing';
import { SharedModule } from '../shared.module';
import { LoggerService } from '../services/logger.service';
import { JsonStorageService } from '../services/json-storage.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../../config/configuration';

describe('SharedModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        SharedModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide LoggerService', () => {
    const service = module.get(LoggerService);
    expect(service).toBeDefined();
  });

  it('should provide JsonStorageService', () => {
    const service = module.get(JsonStorageService);
    expect(service).toBeDefined();
  });

  it('should export LoggerService', () => {
    const service = module.get(LoggerService);
    expect(service).toBeInstanceOf(LoggerService);
  });

  it('should export JsonStorageService', () => {
    const service = module.get(JsonStorageService);
    expect(service).toBeInstanceOf(JsonStorageService);
  });
}); 