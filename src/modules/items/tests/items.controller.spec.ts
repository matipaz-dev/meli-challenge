import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from '../items.controller';
import { ItemsService } from '../items.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CreateItemDto, ItemDto } from '../dto/item.dto';

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;
  let logger: LoggerService;

  const mockCreateItemDto: CreateItemDto = {
    title: 'Test Item',
    price: {
      amount: 100,
      currency: 'USD',
    },
    pictures: ['test.jpg'],
    condition: 'new',
    free_shipping: true,
    available_quantity: 10,
    seller: {
      id: 1,
      name: 'Test Seller',
      rating: 4.5,
    },
  };

  const mockItem: ItemDto = {
    ...mockCreateItemDto,
    id: '123',
  };

  const mockService = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: mockService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    service = module.get<ItemsService>(ItemsService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getItem', () => {
    it('should return an item', async () => {
      mockService.findById.mockResolvedValue({ item: mockItem });

      const result = await controller.getItem('123');

      expect(result).toEqual({ item: mockItem });
      expect(service.findById).toHaveBeenCalledWith('123');
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockService.findById.mockRejectedValue(error);

      await expect(controller.getItem('123')).rejects.toThrow(error);
      expect(logger.debug).toHaveBeenCalled();
    });
  });

  describe('getAllItems', () => {
    it('should return all items', async () => {
      const items = [mockItem];
      mockService.findAll.mockResolvedValue({ items });

      const result = await controller.getAllItems();

      expect(result).toEqual({ items });
      expect(service.findAll).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockService.findAll.mockRejectedValue(error);

      await expect(controller.getAllItems()).rejects.toThrow(error);
      expect(logger.debug).toHaveBeenCalled();
    });
  });

  describe('createItem', () => {
    it('should create an item', async () => {
      const expectedResponse = { item: mockItem };
      mockService.create.mockResolvedValue(expectedResponse);

      const result = await controller.createItem(mockCreateItemDto);

      expect(result).toEqual(expectedResponse);
      expect(service.create).toHaveBeenCalledWith(mockCreateItemDto);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockService.create.mockRejectedValue(error);

      await expect(controller.createItem(mockCreateItemDto)).rejects.toThrow(error);
      expect(logger.debug).toHaveBeenCalled();
    });
  });
}); 