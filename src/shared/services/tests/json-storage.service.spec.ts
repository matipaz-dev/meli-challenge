import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger.service';
import { JsonStorageService } from '../json-storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('path');

describe('JsonStorageService', () => {
  let service: JsonStorageService;
  let config: ConfigService;
  let logger: LoggerService;
  const TEST_DATA_PATH = 'test/data/';

  const mockConfig = {
    get: jest.fn().mockReturnValue(TEST_DATA_PATH),
  };

  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonStorageService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<JsonStorageService>(JsonStorageService);
    config = module.get<ConfigService>(ConfigService);
    logger = module.get<LoggerService>(LoggerService);

    // Reset all mocks
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  describe('readJson', () => {
    it('should read and parse JSON file', async () => {
      const mockData = { test: 'data' };
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await service.readJson('test-file');

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(fs.readFile).toHaveBeenCalledWith('test/data/test-file.json', 'utf8');
      expect(result).toEqual(mockData);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return null when file does not exist', async () => {
      const error = { code: 'ENOENT' };
      (fs.readFile as jest.Mock).mockRejectedValue(error);

      const result = await service.readJson('non-existent');

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle read error', async () => {
      const error = new Error('Read error');
      (fs.readFile as jest.Mock).mockRejectedValue(error);

      await expect(service.readJson('test-file')).rejects.toThrow('Read error');
      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('writeJson', () => {
    it('should write data to JSON file using temporary file', async () => {
      const mockData = { test: 'data' };
      (fs.rename as jest.Mock).mockResolvedValue(undefined);

      await service.writeJson('test-file', mockData);

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        'test/data/test-file.json.tmp',
        JSON.stringify(mockData, null, 2),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalledWith(
        'test/data/test-file.json.tmp',
        'test/data/test-file.json'
      );
      expect(logger.debug).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle write error', async () => {
      const error = new Error('Write error');
      const mockData = { test: 'data' };
      (fs.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(service.writeJson('test-file', mockData)).rejects.toThrow('Write error');
      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle rename error', async () => {
      const error = new Error('Rename error');
      const mockData = { test: 'data' };
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.rename as jest.Mock).mockRejectedValue(error);

      await expect(service.writeJson('test-file', mockData)).rejects.toThrow('Rename error');
      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('listFiles', () => {
    it('should list all JSON files', async () => {
      const mockFiles = ['file1.json', 'file2.json', 'file3.txt'];
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const result = await service.listFiles();

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(result).toEqual(['file1.json', 'file2.json']);
      expect(fs.readdir).toHaveBeenCalledWith(TEST_DATA_PATH);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle readdir error', async () => {
      const error = new Error('Readdir error');
      (fs.readdir as jest.Mock).mockRejectedValue(error);

      await expect(service.listFiles()).rejects.toThrow('Readdir error');
      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('ensureDataDirectory', () => {
    it('should handle directory creation error', async () => {
      const error = new Error('Failed to create directory');
      (fs.mkdir as jest.Mock).mockRejectedValue(error);

      await expect(service.readJson('test-file')).rejects.toThrow('Failed to create directory');
      expect(logger.error).toHaveBeenCalled();
    });
  });
}); 