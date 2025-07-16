import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { LoggerService } from './logger.service';
import { Mutex } from 'async-mutex';

// Mutex global para todas las instancias del servicio
const globalMutex = new Mutex();

@Injectable()
export class JsonStorageService {
  private readonly dataPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.dataPath = this.configService.get<string>('data.path');
  }

  private async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Error creating data directory: ${error.message}`);
      throw error;
    }
  }

  private getFilePath(filename: string): string {
    return path.join(this.dataPath.replace(/\/$/, ''), `${filename}.json`);
  }

  async initializeJsonIfNotExists<T>(filename: string, defaultData: T): Promise<void> {
    return globalMutex.runExclusive(async () => {
      try {
        await this.ensureDataDirectory();
        const filePath = this.getFilePath(filename);
        
        try {
          await fs.access(filePath);
          // Si el archivo existe, no hacemos nada
          this.logger.debug(`File ${filename}.json already exists, skipping initialization`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            // Si el archivo no existe, lo creamos con los datos por defecto
            this.logger.debug(`Initializing ${filename}.json with default data`);
            await this.writeJson(filename, defaultData);
          } else {
            throw error;
          }
        }
      } catch (error) {
        this.logger.error(`Error initializing JSON file: ${error.message}`);
        throw error;
      }
    });
  }

  async readJson<T>(filename: string): Promise<T> {
    return globalMutex.runExclusive(async () => {
      try {
        await this.ensureDataDirectory();
        const filePath = this.getFilePath(filename);
        
        try {
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data) as T;
        } catch (error) {
          if (error.code === 'ENOENT') {
            this.logger.warn(`File ${filename}.json not found`);
            return null;
          }
          throw error;
        }
      } catch (error) {
        this.logger.error(`Error reading JSON file: ${error.message}`);
        throw error;
      }
    });
  }

  async writeJson<T>(filename: string, data: T): Promise<void> {
    return globalMutex.runExclusive(async () => {
      try {
        await this.ensureDataDirectory();
        const filePath = this.getFilePath(filename);
        const jsonString = JSON.stringify(data, null, 2);
        
        // Escribir a un archivo temporal primero
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, jsonString, 'utf8');
        
        // Renombrar el archivo temporal al archivo final
        await fs.rename(tempPath, filePath);
        
        this.logger.debug(`Successfully wrote to ${filename}.json`);
      } catch (error) {
        this.logger.error(`Error writing JSON file: ${error.message}`);
        throw error;
      }
    });
  }

  async listFiles(): Promise<string[]> {
    try {
      await this.ensureDataDirectory();
      const files = await fs.readdir(this.dataPath);
      return files.filter(file => file.endsWith('.json') && !file.endsWith('.tmp'));
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`);
      throw error;
    }
  }
} 