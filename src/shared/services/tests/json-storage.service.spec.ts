import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JsonStorageService } from '../json-storage.service';
import { LoggerService } from '../logger.service';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('path');

interface FileSystemError extends Error {
  code?: string;
}

describe('JsonStorageService', () => {
  let service: JsonStorageService;
  let configService: ConfigService;
  let logger: LoggerService;
  let fs;

  const mockData = { test: 'data' };
  const TEST_DATA_PATH = 'data';
  const TEST_FILE_NAME = 'test-file';
  const TEST_FILE_PATH = path.join(TEST_DATA_PATH, `${TEST_FILE_NAME}.json`);
  const TEST_TEMP_FILE_PATH = `${TEST_FILE_PATH}.tmp`;

  beforeEach(async () => {
    fs = require('fs/promises');
    
    const mockConfigService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'data.path') return TEST_DATA_PATH;
        return null;
      }),
    };

    const mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JsonStorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<JsonStorageService>(JsonStorageService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
  });

  describe('readJson', () => {
    it('should read and parse JSON file', async () => {
      fs.readFile.mockResolvedValue(JSON.stringify(mockData));

      const result = await service.readJson(TEST_FILE_NAME);

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(fs.readFile).toHaveBeenCalledWith(TEST_FILE_PATH, 'utf8');
      expect(result).toEqual(mockData);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return null when file does not exist', async () => {
      const error: FileSystemError = new Error('File not found');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);

      const result = await service.readJson(TEST_FILE_NAME);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`File ${TEST_FILE_NAME}.json not found`);
    });

    it('should handle read errors', async () => {
      const error = new Error('Read error');
      fs.readFile.mockRejectedValue(error);

      await expect(service.readJson(TEST_FILE_NAME)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(`Error reading JSON file: ${error.message}`);
    });
  });

  describe('writeJson', () => {
    it('should write data to JSON file using temporary file', async () => {
      await service.writeJson(TEST_FILE_NAME, mockData);

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_PATH, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        TEST_TEMP_FILE_PATH,
        JSON.stringify(mockData, null, 2),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalledWith(TEST_TEMP_FILE_PATH, TEST_FILE_PATH);
      expect(logger.debug).toHaveBeenCalledWith(`Successfully wrote to ${TEST_FILE_NAME}.json`);
    });

    it('should handle write errors', async () => {
      const error = new Error('Write error');
      fs.writeFile.mockRejectedValue(error);

      await expect(service.writeJson(TEST_FILE_NAME, mockData)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(`Error writing JSON file: ${error.message}`);
    });
  });
}); 