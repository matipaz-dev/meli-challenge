import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ItemsService } from '../items.service';
import { ItemsRepository } from '../items.repository';
import { LoggerService } from '../../../shared/services/logger.service';
import { CreateItemDto, ItemDto } from '../dto/item.dto';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

describe('ItemsService', () => {
  let service: ItemsService;
  let repository: ItemsRepository;
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

  const mockRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    findBySellerId: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: ItemsRepository,
          useValue: mockRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    repository = module.get<ItemsRepository>(ItemsRepository);
    logger = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('123');
  });

  describe('findById', () => {
    it('should return item by id', async () => {
      mockRepository.findById.mockResolvedValue(mockItem);

      const result = await service.findById('123');

      expect(result).toEqual({ item: mockItem });
      expect(repository.findById).toHaveBeenCalledWith('123');
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      mockRepository.findById.mockRejectedValue(new NotFoundException());

      await expect(service.findById('123')).rejects.toThrow(NotFoundException);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle and rethrow other errors', async () => {
      const error = new Error('Database error');
      mockRepository.findById.mockRejectedValue(error);

      await expect(service.findById('123')).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all items', async () => {
      const items = [mockItem];
      mockRepository.findAll.mockResolvedValue(items);

      const result = await service.findAll();

      expect(result).toEqual({ items });
      expect(repository.findAll).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should return empty array when no items exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual({ items: [] });
      expect(repository.findAll).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle and rethrow errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findAll.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create item with generated id', async () => {
      const mockCreateItemDto = {
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

      const expectedItem = {
        ...mockCreateItemDto,
        id: 'MLA0000001',
      };

      mockRepository.save.mockResolvedValue(undefined);

      const result = await service.create(mockCreateItemDto);

      expect(result).toEqual({ item: expectedItem });
      expect(repository.save).toHaveBeenCalledWith(expectedItem);
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle creation error', async () => {
      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      await expect(service.create(mockCreateItemDto)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findBySellerId', () => {
    it('should return items for a specific seller', async () => {
      const sellerId = 1;
      const mockItems = [
        { ...mockItem, seller: { ...mockItem.seller, id: sellerId } },
        { ...mockItem, id: 'MLA456', seller: { ...mockItem.seller, id: sellerId } }
      ];
      mockRepository.findBySellerId.mockResolvedValue(mockItems);

      const result = await service.findBySellerId(sellerId);

      expect(result).toEqual({ items: mockItems });
      expect(mockRepository.findBySellerId).toHaveBeenCalledWith(sellerId);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Found ${mockItems.length} items for seller ${sellerId}`);
    });

    it('should throw NotFoundException when no items found for seller', async () => {
      const sellerId = 999;
      mockRepository.findBySellerId.mockResolvedValue([]);

      await expect(service.findBySellerId(sellerId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findBySellerId).toHaveBeenCalledWith(sellerId);
    });

    it('should propagate repository errors', async () => {
      const sellerId = 1;
      const error = new Error('Database error');
      mockRepository.findBySellerId.mockRejectedValue(error);

      await expect(service.findBySellerId(sellerId)).rejects.toThrow(error);
      expect(mockRepository.findBySellerId).toHaveBeenCalledWith(sellerId);
      expect(mockLogger.error).toHaveBeenCalledWith(`Error finding items for seller ${sellerId}: ${error.message}`);
    });
  });
}); 