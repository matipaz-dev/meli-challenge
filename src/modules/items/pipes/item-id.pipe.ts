import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ItemIdPipe implements PipeTransform {
  private readonly ID_REGEX = /^MLA\d+$/;

  transform(value: string): string {
    if (!this.ID_REGEX.test(value)) {
      throw new BadRequestException('Invalid item ID format. Must start with MLA followed by numbers.');
    }
    return value;
  }
} 