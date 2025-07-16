import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CreateItemDto } from '../../src/modules/items/dto/item.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Items E2E Tests', () => {
  let app: INestApplication;
  const TEST_DATA_DIR = path.join(process.cwd(), 'data');

  beforeAll(async () => {
    // Asegurar que el directorio de datos existe
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  });

  beforeEach(async () => {
    // Limpiar el archivo de items antes de cada test
    try {
      await fs.writeFile(path.join(TEST_DATA_DIR, 'items.json'), '[]');
    } catch (error) {
      console.error('Error al inicializar items.json:', error);
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api'); // Agregar prefijo global
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('API Endpoints', () => {
    describe('GET /api/items', () => {
      it('should return empty array when no items exist', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/items')
          .expect(200);

        expect(response.body.items).toEqual([]);
      });
    });

    describe('POST /api/items', () => {
      it('should create a new item', async () => {
        const newItem: CreateItemDto = {
          title: 'Test Item',
          price: {
            amount: 100,
            currency: 'USD'
          },
          pictures: ['test.jpg'],
          condition: 'new',
          free_shipping: true,
          available_quantity: 10,
          seller: {
            id: 1,
            name: 'Test Seller',
            rating: 4.5
          }
        };

        const response = await request(app.getHttpServer())
          .post('/api/items')
          .send(newItem)
          .expect(201);

        expect(response.body.item).toMatchObject(newItem);
        expect(response.body.item.id).toMatch(/^MLA\d{7}$/);
      });

      it('should return 400 for invalid item data', async () => {
        const invalidItem = {
          title: 'Te', // título muy corto
          price: {
            amount: -100, // precio negativo
            currency: 'INVALID' // moneda inválida
          }
        };

        await request(app.getHttpServer())
          .post('/api/items')
          .send(invalidItem)
          .expect(400);
      });
    });

    describe('GET /api/items/:id', () => {
      it('should return 404 for non-existent item', async () => {
        await request(app.getHttpServer())
          .get('/api/items/MLA999999999')
          .expect(404);
      });

      it('should return 400 for invalid ID format', async () => {
        await request(app.getHttpServer())
          .get('/api/items/999')
          .expect(400)
          .expect(res => {
            expect(res.body.message).toBe('Invalid item ID format. Must start with MLA followed by numbers.');
          });
      });

      it('should return item when it exists', async () => {
        // Crear un item primero
        const newItem: CreateItemDto = {
          title: 'Test Item',
          price: {
            amount: 100,
            currency: 'USD'
          },
          pictures: ['test.jpg'],
          condition: 'new',
          free_shipping: true,
          available_quantity: 10,
          seller: {
            id: 1,
            name: 'Test Seller',
            rating: 4.5
          }
        };

        const createResponse = await request(app.getHttpServer())
          .post('/api/items')
          .send(newItem);

        const createdItem = createResponse.body.item;
        expect(createdItem.id).toMatch(/^MLA\d{7}$/);

        // Intentar obtener el item creado
        await request(app.getHttpServer())
          .get(`/api/items/${createdItem.id}`)
          .expect(200)
          .expect({ item: createdItem });
      });
    });
  });

  describe('GET /items/seller/:sellerId', () => {
    it('should return items for a specific seller', async () => {
      // Create test items
      const seller1Items = [
        {
          title: 'Test Item 1',
          price: { amount: 100, currency: 'USD' },
          pictures: ['http://test1.jpg'],
          condition: 'new',
          free_shipping: true,
          available_quantity: 10,
          seller: { id: 1, name: 'Seller One', rating: 4.5 }
        },
        {
          title: 'Test Item 2',
          price: { amount: 200, currency: 'USD' },
          pictures: ['http://test2.jpg'],
          condition: 'used',
          free_shipping: false,
          available_quantity: 5,
          seller: { id: 1, name: 'Seller One', rating: 4.5 }
        }
      ];

      const seller2Item = {
        title: 'Test Item 3',
        price: { amount: 300, currency: 'USD' },
        pictures: ['http://test3.jpg'],
        condition: 'new',
        free_shipping: true,
        available_quantity: 15,
        seller: { id: 2, name: 'Seller Two', rating: 4.0 }
      };

      // Create items in the system
      for (const item of [...seller1Items, seller2Item]) {
        await request(app.getHttpServer())
          .post('/items')
          .send(item)
          .expect(201);
      }

      // Test getting items for seller 1
      const response = await request(app.getHttpServer())
        .get('/items/seller/1')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every(item => item.seller.id === 1)).toBe(true);
      expect(response.body.items[0].title).toBe('Test Item 1');
      expect(response.body.items[1].title).toBe('Test Item 2');
    });

    it('should return 404 when no items found for seller', async () => {
      await request(app.getHttpServer())
        .get('/items/seller/999')
        .expect(404)
        .expect(res => {
          expect(res.body.message).toBe('No items found for seller');
        });
    });

    it('should return 400 for invalid seller ID format', async () => {
      await request(app.getHttpServer())
        .get('/items/seller/abc')
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('Validation failed');
        });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent item creation without data loss', async () => {
      const numberOfItems = 10;
      const items = Array.from({ length: numberOfItems }, (_, i) => ({
        title: `Test Item ${i + 1}`,
        price: {
          amount: 100,
          currency: 'USD'
        },
        pictures: ['test.jpg'],
        condition: 'new',
        free_shipping: true,
        available_quantity: 10,
        seller: {
          id: 1,
          name: 'Test Seller',
          rating: 4.5
        }
      }));

      // Crear todos los items de una vez
      await request(app.getHttpServer())
        .post('/api/items/batch')
        .send(items)
        .expect(201);

      // Obtener todos los items
      const response = await request(app.getHttpServer())
        .get('/api/items')
        .expect(200);

      const allItems = response.body.items;

      // Verificar cantidad de items
      expect(allItems).toHaveLength(numberOfItems);

      // Verificar que todos los IDs son únicos y tienen el formato correcto
      const ids = new Set(allItems.map(item => item.id));
      expect(ids.size).toBe(numberOfItems);
      allItems.forEach(item => {
        expect(item.id).toMatch(/^MLA\d{7}$/);
      });
    });

    it('should handle concurrent read/write operations', async () => {
      // Crear un item inicial
      const initialItem = {
        title: 'Initial Item',
        price: {
          amount: 100,
          currency: 'USD'
        },
        pictures: ['test.jpg'],
        condition: 'new',
        free_shipping: true,
        available_quantity: 10,
        seller: {
          id: 1,
          name: 'Test Seller',
          rating: 4.5
        }
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/items')
        .send(initialItem);

      const createdItem = createResponse.body.item;

      // Realizar operaciones concurrentes
      const operations = [
        request(app.getHttpServer()).get(`/api/items/${createdItem.id}`), // Lectura
        request(app.getHttpServer()).post('/api/items').send(initialItem), // Escritura
        request(app.getHttpServer()).get('/api/items'), // Lectura de lista
      ];

      const results = await Promise.all(operations);

      // Verificar que todas las operaciones fueron exitosas
      expect(results[0].status).toBe(200); // Primera lectura
      expect(results[0].body.item.id).toBe(createdItem.id);

      expect(results[1].status).toBe(201); // Primera escritura
      expect(results[2].status).toBe(200); // Segunda lectura
    });
  });
}); 