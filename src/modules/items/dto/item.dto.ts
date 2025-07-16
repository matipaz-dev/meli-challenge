import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
  Max,
  IsUrl,
  Length,
  IsEnum,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
  IsPositive
} from 'class-validator';
import { Type } from 'class-transformer';

export class PriceDto {
  @ApiProperty({ 
    example: 999.99,
    description: 'Price amount in the specified currency',
    minimum: 0.01,
    maximum: 999999.99
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0.01)
  @Max(999999.99)
  amount: number;

  @ApiProperty({ 
    example: 'USD',
    description: 'Currency code (USD, EUR, ARS)',
    enum: ['USD', 'EUR', 'ARS']
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['USD', 'EUR', 'ARS'], {
    message: 'currency must be one of the following values: USD, EUR, ARS'
  })
  currency: string;
}

export class SellerDto {
  @ApiProperty({ 
    example: 1,
    description: 'Unique seller ID',
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  id: number;

  @ApiProperty({ 
    example: 'John Doe Store',
    description: 'Seller name (3-50 characters)',
    minLength: 3,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  name: string;

  @ApiProperty({ 
    example: 4.5,
    description: 'Seller rating (0.0 to 5.0)',
    minimum: 0,
    maximum: 5
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsNotEmpty()
  @Min(0)
  @Max(5)
  rating: number;
}

export class CreateItemDto {
  @ApiProperty({ 
    example: 'iPhone 12 Pro Max 256GB',
    description: 'Product title (5-100 characters)',
    minLength: 5,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 100)
  title: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PriceDto)
  @IsNotEmpty()
  price: PriceDto;

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg'],
    description: 'Array of product images URLs (1-10 images)',
    minItems: 1,
    maxItems: 10
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  @IsNotEmpty()
  pictures: string[];

  @ApiProperty({ 
    example: 'new',
    description: 'Product condition (new, used, refurbished)',
    enum: ['new', 'used', 'refurbished']
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['new', 'used', 'refurbished'], {
    message: 'condition must be one of the following values: new, used, refurbished'
  })
  condition: string;

  @ApiProperty({ 
    example: true,
    description: 'Whether the item has free shipping'
  })
  @IsBoolean()
  @IsNotEmpty()
  free_shipping: boolean;

  @ApiProperty({ 
    example: 10,
    description: 'Available quantity (1-1000)',
    minimum: 1,
    maximum: 1000
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(1000)
  available_quantity: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SellerDto)
  @IsNotEmpty()
  seller: SellerDto;

  @ApiProperty({ 
    example: 'Latest iPhone model with A14 Bionic chip...',
    description: 'Product description (10-2000 characters)',
    minLength: 10,
    maxLength: 2000,
    required: false
  })
  @IsString()
  @IsOptional()
  @Length(10, 2000)
  description?: string;
}

export class ItemDto extends CreateItemDto {
  @ApiProperty({ 
    example: 'MLA1234567',
    description: 'Unique item identifier (format: MLA followed by numbers)',
    pattern: '^MLA\\d+$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^MLA\d+$/, {
    message: 'id must be in format MLA followed by numbers (e.g., MLA1234567)'
  })
  id: string;
}

export class ItemResponseDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => ItemDto)
  item: ItemDto;
}

export class ItemsResponseDto {
  @ApiProperty({ type: [ItemDto] })
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
} 