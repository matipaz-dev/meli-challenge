import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonStorageService } from '../../shared/services/json-storage.service';
import { LoggerService } from '../../shared/services/logger.service';
import { ItemDto } from './dto/item.dto';

@Injectable()
export class ItemsRepository {
  private readonly ITEMS_FILE = 'items';

  constructor(
    private readonly jsonStorage: JsonStorageService,
    private readonly logger: LoggerService,
  ) {}

  private async getItems(): Promise<ItemDto[]> {
    try {
      const items = await this.jsonStorage.readJson<ItemDto[]>(this.ITEMS_FILE);
      return items || [];
    } catch (error) {
      this.logger.error(`Error reading items file: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<ItemDto> {
    try {
      const items = await this.getItems();
      const item = items.find(i => i.id === id);
      if (!item) {
        throw new NotFoundException('Item not found');
      }
      return item;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding item with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<ItemDto[]> {
    try {
      return await this.getItems();
    } catch (error) {
      this.logger.error(`Error finding all items: ${error.message}`);
      throw error;
    }
  }

  async save(item: ItemDto): Promise<void> {
    try {
      const items = await this.getItems();
      const existingIndex = items.findIndex(i => i.id === item.id);

      if (existingIndex >= 0) {
        items[existingIndex] = item;
      } else {
        items.push(item);
      }

      await this.jsonStorage.writeJson(this.ITEMS_FILE, items);
      this.logger.debug(`Saved item with ID ${item.id}`);
    } catch (error) {
      this.logger.error(`Error saving item: ${error.message}`);
      throw error;
    }
  }

  async saveMany(newItems: ItemDto[]): Promise<void> {
    try {
      const items = await this.getItems();
      
      for (const item of newItems) {
        const existingIndex = items.findIndex(i => i.id === item.id);
        if (existingIndex >= 0) {
          items[existingIndex] = item;
        } else {
          items.push(item);
        }
      }

      await this.jsonStorage.writeJson(this.ITEMS_FILE, items);
      this.logger.debug(`Saved ${newItems.length} items`);
    } catch (error) {
      this.logger.error(`Error saving multiple items: ${error.message}`);
      throw error;
    }
  }

  async findBySellerId(sellerId: number): Promise<ItemDto[]> {
    try {
      const items = await this.getItems();
      const sellerItems = items.filter(item => item.seller.id === sellerId);
      this.logger.debug(`Found ${sellerItems.length} items for seller ${sellerId}`);
      return sellerItems;
    } catch (error) {
      this.logger.error(`Error finding items for seller ${sellerId}: ${error.message}`);
      throw error;
    }
  }
} 