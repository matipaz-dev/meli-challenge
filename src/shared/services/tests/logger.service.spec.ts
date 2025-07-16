import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger.service';
import * as winston from 'winston';

jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    format: {
      timestamp: jest.fn(),
      json: jest.fn(),
      combine: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: any;

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'logging.level':
          return 'debug';
        case 'logging.file':
          return 'app.log';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    mockWinstonLogger = (winston.createLogger as jest.Mock)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create winston logger with correct configuration', () => {
    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.transports.Console).toHaveBeenCalled();
    expect(winston.transports.File).toHaveBeenCalledWith({
      filename: 'app.log',
    });
  });

  describe('logging methods', () => {
    it('should call winston info for log method', () => {
      const message = 'test log message';
      service.log(message);
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message);
    });

    it('should call winston error for error method', () => {
      const message = 'test error message';
      const trace = 'error trace';
      service.error(message, trace);
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, { trace });
    });

    it('should call winston warn for warn method', () => {
      const message = 'test warn message';
      service.warn(message);
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message);
    });

    it('should call winston debug for debug method', () => {
      const message = 'test debug message';
      service.debug(message);
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message);
    });

    it('should call winston verbose for verbose method', () => {
      const message = 'test verbose message';
      service.verbose(message);
      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message);
    });
  });
}); 