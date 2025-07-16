import configuration from './configuration';

describe('Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use default values when environment variables are not set', () => {
    const config = configuration();

    expect(config).toEqual({
      port: 3000,
      environment: 'development',
      logging: {
        level: 'debug',
        file: './logs/app.log',
      },
      data: {
        path: './data',
      },
    });
  });

  it('should use environment variables when set', () => {
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'info';
    process.env.LOG_FILE = 'custom/logs/app.log';
    process.env.DATA_PATH = 'custom/data/';

    const config = configuration();

    expect(config).toEqual({
      port: 4000,
      environment: 'production',
      logging: {
        level: 'info',
        file: 'custom/logs/app.log',
      },
      data: {
        path: 'custom/data/',
      },
    });
  });

  it('should handle invalid port number', () => {
    process.env.PORT = 'invalid';

    const config = configuration();

    expect(config.port).toBe(3000);
  });
}); 