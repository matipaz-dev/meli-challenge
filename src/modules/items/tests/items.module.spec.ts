import { Test, TestingModule } from '@nestjs/testing';
import { ItemsModule } from '../items.module';
import { ItemsController } from '../items.controller';
import { ItemsService } from '../items.service';
import { ItemsRepository } from '../items.repository';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '../../../shared/shared.module';
import configuration from '../../../config/configuration';

describe('ItemsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        SharedModule,
        ItemsModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ItemsController', () => {
    const controller = module.get(ItemsController);
    expect(controller).toBeDefined();
  });

  it('should provide ItemsService', () => {
    const service = module.get(ItemsService);
    expect(service).toBeDefined();
  });

  it('should provide ItemsRepository', () => {
    const repository = module.get(ItemsRepository);
    expect(repository).toBeDefined();
  });
}); 