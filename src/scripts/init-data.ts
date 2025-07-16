import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JsonStorageService } from '../shared/services/json-storage.service';
import { LoggerService } from '../shared/services/logger.service';
import * as fs from 'fs/promises';
import * as path from 'path';

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

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

async function readJsonFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeJsonFile(filePath: string, data: any) {
  const jsonContent = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonContent, 'utf8');
}

async function initializeData() {
  try {
    // Usar path.join para manejar rutas en cualquier SO
    const dataDir = path.join(process.cwd(), 'data');
    const itemsFile = path.join(dataDir, 'items.json');

    // Asegurar que existe el directorio
    await ensureDirectoryExists(dataDir);

    // Leer el archivo si existe
    const existingData = await readJsonFile(itemsFile);

    // Verificar si necesitamos inicializar los datos
    if (!existingData || !Array.isArray(existingData) || existingData.length === 0) {
      console.log('Inicializando datos de ejemplo...');
      await writeJsonFile(itemsFile, sampleItems);
      console.log(`Se han inicializado ${sampleItems.length} items de ejemplo`);
    } else {
      console.log(`El archivo ya existe y contiene ${existingData.length} items`);
    }

    return true;
  } catch (error) {
    console.error('Error al inicializar los datos:', error);
    return false;
  }
}

// Solo crear la aplicación NestJS si se necesita el JsonStorageService
async function bootstrap() {
  // Primero intentar inicializar directamente
  const success = await initializeData();
  if (success) {
    return;
  }

  // Si falla, intentar con el JsonStorageService
  console.log('Intentando inicializar usando JsonStorageService...');
  const app = await NestFactory.create(AppModule, {
    logger: false // Desactivar logs innecesarios
  });
  
  const jsonStorage = app.get(JsonStorageService);
  const logger = app.get(LoggerService);

  try {
    await jsonStorage.initializeJsonIfNotExists('items', sampleItems);
    logger.log('Datos inicializados correctamente usando JsonStorageService');
  } catch (error) {
    logger.error(`Error al inicializar datos: ${error.message}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error: Error) => {
  console.error('Error no manejado:', error);
  process.exit(1);
});

// Ejecutar el script
bootstrap(); 