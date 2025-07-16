import { Controller, Get, Param, Post, Body, HttpCode, HttpStatus, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto, ItemDto, ItemResponseDto, ItemsResponseDto } from './dto/item.dto';
import { LoggerService } from '../../shared/services/logger.service';
import { ItemIdPipe } from './pipes/item-id.pipe';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly logger: LoggerService,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get item by ID',
    description: `Retrieves a specific item by its unique identifier.

Validation rules:
- ID must follow the format MLA followed by numbers (e.g., MLA1234567)
- ID must exist in the database

Example valid IDs:
- MLA1234567
- MLA9876543
- MLA1111111

Example invalid IDs:
- MLB1234567 (wrong prefix)
- MLA12345A7 (contains letters)
- MLA-123456 (contains special characters)
- 1234567 (missing MLA prefix)`
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the item. Must start with MLA followed by numbers.',
    example: 'MLA1234567',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Item found successfully',
    type: ItemResponseDto,
    content: {
      'application/json': {
        example: {
          item: {
            id: 'MLA1234567',
            title: 'iPhone 12 Pro Max 256GB',
            price: {
              amount: 999.99,
              currency: 'USD'
            },
            pictures: ['https://example.com/iphone12-1.jpg'],
            condition: 'new',
            free_shipping: true,
            available_quantity: 10,
            seller: {
              id: 1,
              name: 'Apple Store Official',
              rating: 4.8
            },
            description: 'Latest iPhone model with A14 Bionic chip'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid ID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid item ID format. Must start with MLA followed by numbers.',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Item not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Item not found',
        error: 'Not Found'
      }
    }
  })
  async getItem(@Param('id', ItemIdPipe) id: string): Promise<ItemResponseDto> {
    this.logger.debug(`Received request to get item with ID ${id}`);
    return this.itemsService.findById(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all items',
    description: 'Retrieves a list of all available items. Results can be paginated using limit and offset parameters.'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of items to return (1-50)',
    type: Number,
    example: 10
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of items to skip (0 or more)',
    type: Number,
    example: 0
  })
  @ApiResponse({
    status: 200,
    description: 'List of items retrieved successfully',
    type: ItemsResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: ['limit must be between 1 and 50', 'offset must be a positive number'],
        error: 'Bad Request'
      }
    }
  })
  async getAllItems(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<ItemsResponseDto> {
    this.logger.debug('Received request to get all items');
    return this.itemsService.findAll();
  }

  @Get('seller/:sellerId')
  @ApiOperation({
    summary: 'Get items by seller ID',
    description: `Retrieves all items from a specific seller.

Validation rules:
- Seller ID must be a positive number
- At least one item must exist for the seller

Example valid seller IDs:
- 1
- 42
- 123

Example invalid seller IDs:
- 0 (must be positive)
- -1 (negative numbers not allowed)
- abc (must be a number)`
  })
  @ApiParam({
    name: 'sellerId',
    description: 'ID of the seller to find items for',
    example: 1,
    required: true,
    type: 'number'
  })
  @ApiResponse({
    status: 200,
    description: 'Items found successfully',
    type: ItemsResponseDto,
    content: {
      'application/json': {
        example: {
          items: [{
            id: 'MLA1234567',
            title: 'iPhone 12 Pro Max 256GB',
            price: {
              amount: 999.99,
              currency: 'USD'
            },
            pictures: ['https://example.com/iphone12-1.jpg'],
            condition: 'new',
            free_shipping: true,
            available_quantity: 10,
            seller: {
              id: 1,
              name: 'Apple Store Official',
              rating: 4.8
            },
            description: 'Latest iPhone model with A14 Bionic chip'
          }]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid seller ID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Seller ID must be a positive number',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No items found for seller',
    schema: {
      example: {
        statusCode: 404,
        message: 'No items found for seller',
        error: 'Not Found'
      }
    }
  })
  async getItemsBySeller(@Param('sellerId', ParseIntPipe) sellerId: number): Promise<ItemsResponseDto> {
    this.logger.debug(`Received request to get items for seller ${sellerId}`);
    return this.itemsService.findBySellerId(sellerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new item',
    description: `Creates a new item with the provided details. All fields must meet the following criteria:
    
    - Title: 5-100 characters
    - Price: Amount between 0.01 and 999999.99, Currency must be USD, EUR, or ARS
    - Pictures: 1-10 valid URLs
    - Condition: Must be 'new', 'used', or 'refurbished'
    - Available Quantity: 1-1000
    - Seller: 
      - Name: 3-50 characters
      - Rating: 0-5 (one decimal place)
      - ID: Positive number
    - Description: Optional, 10-2000 characters if provided`
  })
  @ApiBody({
    type: CreateItemDto,
    description: 'Item data to create',
    examples: {
      valid: {
        summary: 'Valid Item',
        value: {
          title: 'iPhone 12 Pro Max 256GB',
          price: {
            amount: 999.99,
            currency: 'USD'
          },
          pictures: ['https://example.com/iphone12-1.jpg'],
          condition: 'new',
          free_shipping: true,
          available_quantity: 10,
          seller: {
            id: 1,
            name: 'Apple Store Official',
            rating: 4.8
          },
          description: 'Latest iPhone model with A14 Bionic chip'
        }
      },
      invalidTitle: {
        summary: 'Invalid Title',
        value: {
          title: 'iPh',  // Too short
          price: {
            amount: 999.99,
            currency: 'USD'
          }
        }
      },
      invalidPrice: {
        summary: 'Invalid Price',
        value: {
          title: 'iPhone 12 Pro Max',
          price: {
            amount: -100,  // Negative price
            currency: 'GBP'  // Invalid currency
          }
        }
      },
      invalidPictures: {
        summary: 'Invalid Pictures',
        value: {
          title: 'iPhone 12 Pro Max',
          price: {
            amount: 999.99,
            currency: 'USD'
          },
          pictures: []  // Empty array
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'title must be between 5 and 100 characters',
          'price.amount must be between 0.01 and 999999.99',
          'price.currency must be one of the following values: USD, EUR, ARS',
          'pictures must contain at least 1 items',
          'pictures must contain valid URLs',
          'condition must be one of the following values: new, used, refurbished',
          'available_quantity must be between 1 and 1000',
          'seller.name must be between 3 and 50 characters',
          'seller.rating must be between 0 and 5'
        ],
        error: 'Bad Request'
      }
    }
  })
  async createItem(@Body() createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    this.logger.debug('Received request to create new item');
    return this.itemsService.create(createItemDto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create multiple items',
    description: 'Creates multiple items in a single operation. All items must be valid.'
  })
  @ApiBody({
    type: [CreateItemDto],
    description: 'Array of items to create'
  })
  @ApiResponse({
    status: 201,
    description: 'Items created successfully',
    schema: {
      example: {
        items: [
          {
            id: 'MLA0000001',
            title: 'iPhone 12 Pro Max 256GB',
            price: {
              amount: 999.99,
              currency: 'USD'
            },
            pictures: ['https://example.com/iphone12-1.jpg'],
            condition: 'new',
            free_shipping: true,
            available_quantity: 10,
            seller: {
              id: 1,
              name: 'Apple Store Official',
              rating: 4.8
            }
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['One or more items have invalid data'],
        error: 'Bad Request'
      }
    }
  })
  async createMany(@Body() createItemDtos: CreateItemDto[]): Promise<{ items: ItemDto[] }> {
    this.logger.debug(`Received request to create ${createItemDtos.length} items`);
    const responses = await this.itemsService.createMany(createItemDtos);
    return { items: responses.map(response => response.item) };
  }
} 