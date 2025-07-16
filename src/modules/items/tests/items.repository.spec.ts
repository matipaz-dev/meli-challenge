import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ItemsRepository } from '../items.repository';
import { JsonStorageService } from '../../../shared/services/json-storage.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { ItemDto } from '../dto/item.dto';

describe('ItemsRepository', () => {
  let repository: ItemsRepository;
  let storage: JsonStorageService;
  let logger: LoggerService;

  const mockItem: ItemDto = {
    id: 'MLA1234567',
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

  const mockStorage = {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsRepository,
        {
          provide: JsonStorageService,
          useValue: mockStorage,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    repository = module.get<ItemsRepository>(ItemsRepository);
    storage = module.get<JsonStorageService>(JsonStorageService);
    logger = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return item when found', async () => {
      const items = [mockItem];
      mockStorage.readJson.mockResolvedValue(items);

      const result = await repository.findById(mockItem.id);

      expect(result).toEqual(mockItem);
      expect(mockStorage.readJson).toHaveBeenCalledWith('items');
    });

    it('should throw NotFoundException when item not found', async () => {
      mockStorage.readJson.mockResolvedValue([]);

      await expect(repository.findById('MLA9999999')).rejects.toThrow(NotFoundException);
      expect(mockStorage.readJson).toHaveBeenCalledWith('items');
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      mockStorage.readJson.mockRejectedValue(error);

      await expect(repository.findById('MLA1234567')).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(`Error finding item with ID MLA1234567: ${error.message}`);
    });
  });

  describe('save', () => {
    it('should add new item to existing items', async () => {
      const existingItem = {
        id: 'MLA0000001',
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

      const newItem = {
        id: 'MLA1234567',
        title: 'New Item',
        price: {
          amount: 200,
          currency: 'USD',
        },
        pictures: ['new.jpg'],
        condition: 'new',
        free_shipping: true,
        available_quantity: 5,
        seller: {
          id: 1,
          name: 'Test Seller',
          rating: 4.5,
        },
      };

      mockStorage.readJson.mockResolvedValue([existingItem]);
      await repository.save(newItem);

      expect(mockStorage.writeJson).toHaveBeenCalledWith('items', [existingItem, newItem]);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Saved item with ID ${newItem.id}`);
    });

    it('should update existing item', async () => {
      const existingItems = [mockItem];
      const updatedItem = { ...mockItem, title: 'Updated Title' };
      mockStorage.readJson.mockResolvedValue(existingItems);

      await repository.save(updatedItem);

      expect(mockStorage.writeJson).toHaveBeenCalledWith('items', [updatedItem]);
      expect(mockLogger.debug).toHaveBeenCalledWith(`Saved item with ID ${updatedItem.id}`);
    });

    it('should handle storage errors', async () => {
      const error = new Error('Storage error');
      mockStorage.readJson.mockRejectedValue(error);

      await expect(repository.save(mockItem)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(`Error saving item: ${error.message}`);
    });
  });

  describe('findBySellerId', () => {
    it('should return items for a specific seller', async () => {
      const sellerId = 1;
      const mockItems = [
        { ...mockItem, seller: { ...mockItem.seller, id: sellerId } },
        { ...mockItem, id: 'MLA1234568', seller: { ...mockItem.seller, id: sellerId } },
        { ...mockItem, id: 'MLA1234569', seller: { ...mockItem.seller, id: 2 } }
      ];
      mockStorage.readJson.mockResolvedValue(mockItems);

      const result = await repository.findBySellerId(sellerId);

      expect(result).toHaveLength(2);
      expect(result.every(item => item.seller.id === sellerId)).toBe(true);
      expect(mockStorage.readJson).toHaveBeenCalledWith('items');
    });

    it('should return empty array when no items found for seller', async () => {
      const sellerId = 999;
      const mockItems = [
        { ...mockItem, seller: { ...mockItem.seller, id: 1 } }
      ];
      mockStorage.readJson.mockResolvedValue(mockItems);

      const result = await repository.findBySellerId(sellerId);

      expect(result).toHaveLength(0);
      expect(mockStorage.readJson).toHaveBeenCalledWith('items');
    });

    it('should return empty array when items file is empty', async () => {
      const sellerId = 1;
      mockStorage.readJson.mockResolvedValue(null);

      const result = await repository.findBySellerId(sellerId);

      expect(result).toHaveLength(0);
      expect(mockStorage.readJson).toHaveBeenCalledWith('items');
    });

    it('should handle storage errors', async () => {
      const sellerId = 1;
      const error = new Error('Storage error');
      mockStorage.readJson.mockRejectedValue(error);

      await expect(repository.findBySellerId(sellerId)).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(`Error finding items for seller ${sellerId}: ${error.message}`);
    });
  });
}); 