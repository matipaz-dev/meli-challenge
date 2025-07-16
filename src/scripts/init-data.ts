import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JsonStorageService } from '../shared/services/json-storage.service';
import { LoggerService } from '../shared/services/logger.service';

const sampleItems = [
  {
    id: "MLA1234567",
    title: "iPhone 13 Pro Max 256GB - Graphite",
    price: {
      amount: 999.99,
      currency: "USD"
    },
    pictures: [
      "https://example.com/iphone13-1.jpg",
      "https://example.com/iphone13-2.jpg",
      "https://example.com/iphone13-3.jpg"
    ],
    condition: "new",
    free_shipping: true,
    available_quantity: 50,
    seller: {
      id: 1,
      name: "Apple Store Official",
      rating: 4.8
    },
    description: "Latest iPhone model with A15 Bionic chip, Pro camera system, and ProMotion display"
  },
  {
    id: "MLA1234568",
    title: "MacBook Pro 14-inch M1 Pro",
    price: {
      amount: 1999.99,
      currency: "USD"
    },
    pictures: [
      "https://example.com/macbook14-1.jpg",
      "https://example.com/macbook14-2.jpg"
    ],
    condition: "new",
    free_shipping: true,
    available_quantity: 25,
    seller: {
      id: 1,
      name: "Apple Store Official",
      rating: 4.8
    },
    description: "14-inch MacBook Pro with M1 Pro chip, 16GB RAM, and 512GB SSD"
  },
  {
    id: "MLA1234569",
    title: "Samsung Galaxy S21 Ultra 5G",
    price: {
      amount: 899.99,
      currency: "USD"
    },
    pictures: [
      "https://example.com/s21ultra-1.jpg",
      "https://example.com/s21ultra-2.jpg"
    ],
    condition: "new",
    free_shipping: true,
    available_quantity: 30,
    seller: {
      id: 2,
      name: "Samsung Official Store",
      rating: 4.7
    },
    description: "Samsung Galaxy S21 Ultra 5G with 108MP camera and 5000mAh battery"
  },
  {
    id: "MLA1234570",
    title: "iPad Air 4th Generation",
    price: {
      amount: 599.99,
      currency: "USD"
    },
    pictures: [
      "https://example.com/ipadair-1.jpg",
      "https://example.com/ipadair-2.jpg"
    ],
    condition: "new",
    free_shipping: true,
    available_quantity: 40,
    seller: {
      id: 1,
      name: "Apple Store Official",
      rating: 4.8
    },
    description: "iPad Air with A14 Bionic chip, 10.9-inch Liquid Retina display"
  },
  {
    id: "MLA1234571",
    title: "Samsung Galaxy Watch 4",
    price: {
      amount: 249.99,
      currency: "USD"
    },
    pictures: [
      "https://example.com/watch4-1.jpg",
      "https://example.com/watch4-2.jpg"
    ],
    condition: "new",
    free_shipping: true,
    available_quantity: 60,
    seller: {
      id: 2,
      name: "Samsung Official Store",
      rating: 4.7
    },
    description: "Galaxy Watch 4 with advanced health monitoring and Wear OS"
  }
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const jsonStorage = app.get(JsonStorageService);
  const logger = app.get(LoggerService);

  try {
    logger.log('Initializing data files...');
    await jsonStorage.initializeJsonIfNotExists('items', sampleItems);
    logger.log('Data initialization completed successfully');
  } catch (error) {
    logger.error(`Error initializing data: ${error.message}`);
  } finally {
    await app.close();
  }
}

bootstrap(); 