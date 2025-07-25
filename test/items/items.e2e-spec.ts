import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CreateItemDto } from '../../src/modules/items/dto/item.dto';
import { JsonStorageService } from '../../src/shared/services/json-storage.service';

describe('Items E2E Tests', () => {
  let app: INestApplication;
  let mockItems = [];

  const mockJsonStorage = {
    readJson: jest.fn().mockImplementation(() => Promise.resolve(mockItems)),
    writeJson: jest.fn().mockImplementation((_, data) => {
      mockItems = data;
      return Promise.resolve();
    }),
    initializeJsonIfNotExists: jest.fn(),
  };

  beforeEach(async () => {
    mockItems = [];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(JsonStorageService)
    .useValue(mockJsonStorage)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    // Limpiar archivos de test
    try {
      // No hay archivos reales para limpiar con mock
    } catch (error) {
      console.error('Error limpiando archivos de test:', error);
    }
  });

  describe('API Endpoints', () => {
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

    describe('GET /api/items/seller/:sellerId', () => {
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
            .post('/api/items')
            .send(item)
            .expect(201);
        }

        // Test getting items for seller 1
        const response = await request(app.getHttpServer())
          .get('/api/items/seller/1')
          .expect(200);

        expect(response.body.items).toHaveLength(2);
        expect(response.body.items.every(item => item.seller.id === 1)).toBe(true);
        expect(response.body.items[0].title).toBe('Test Item 1');
        expect(response.body.items[1].title).toBe('Test Item 2');
      });

      it('should return 404 when no items found for seller', async () => {
        await request(app.getHttpServer())
          .get('/api/items/seller/999')
          .expect(404)
          .expect(res => {
            expect(res.body.message).toBe('No items found for seller');
          });
      });

      it('should return 400 for invalid seller ID format', async () => {
        await request(app.getHttpServer())
          .get('/api/items/seller/abc')
          .expect(400)
          .expect(res => {
            expect(res.body.message).toContain('Validation failed');
          });
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent item creation without data loss', async () => {
      const numberOfItems = 5;
      const createPromises = Array.from({ length: numberOfItems }, (_, i) => 
        request(app.getHttpServer())
          .post('/api/items')
          .send({
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
          })
      );

      const responses = await Promise.all(createPromises);

      // Verificar que todas las creaciones fueron exitosas
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.item.id).toMatch(/^MLA\d{7}$/);
      });

      // Verificar que todos los IDs son únicos
      const ids = new Set(responses.map(response => response.body.item.id));
      expect(ids.size).toBe(numberOfItems);
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
        request(app.getHttpServer()).get(`/api/items/seller/${initialItem.seller.id}`), // Lectura por vendedor
      ];

      const results = await Promise.all(operations);

      // Verificar que todas las operaciones fueron exitosas
      expect(results[0].status).toBe(200); // Lectura por ID
      expect(results[0].body.item.id).toBe(createdItem.id);

      expect(results[1].status).toBe(201); // Escritura
      expect(results[2].status).toBe(200); // Lectura por vendedor
    });
  });
}); 