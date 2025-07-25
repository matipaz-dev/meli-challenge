import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemsRepository } from './items.repository';
import { LoggerService } from '../../shared/services/logger.service';
import { CreateItemDto, ItemDto, ItemResponseDto, ItemsResponseDto } from './dto/item.dto';

@Injectable()
export class ItemsService {
  private lastId = 0;

  constructor(
    private readonly itemsRepository: ItemsRepository,
    private readonly logger: LoggerService,
  ) {}

  private generateItemId(): string {
    this.lastId += 1;
    return `MLA${String(this.lastId).padStart(7, '0')}`;
  }

  async findById(id: string): Promise<ItemResponseDto> {
    try {
      const item = await this.itemsRepository.findById(id);
      this.logger.debug(`Found item with ID ${id}`);
      return { item };
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Item with ID ${id} not found`);
        throw error;
      }
      this.logger.error(`Error finding item with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    try {
      const newItem: ItemDto = {
        ...createItemDto,
        id: this.generateItemId(),
      };
      
      await this.itemsRepository.save(newItem);
      this.logger.debug(`Created new item with ID ${newItem.id}`);
      return { item: newItem };
    } catch (error) {
      this.logger.error(`Error creating item: ${error.message}`);
      throw error;
    }
  }

  async findBySellerId(sellerId: number): Promise<ItemsResponseDto> {
    try {
      const items = await this.itemsRepository.findBySellerId(sellerId);
      if (!items.length) {
        throw new NotFoundException('No items found for seller');
      }
      this.logger.debug(`Found ${items.length} items for seller ${sellerId}`);
      return { items };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding items for seller ${sellerId}: ${error.message}`);
      throw error;
    }
  }
} 