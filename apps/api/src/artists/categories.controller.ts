import { Controller, Get } from '@nestjs/common';
import type { ApiResponse, ArtistCategory } from '@vendorapp/shared';
import { ArtistsService } from './artists.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<ArtistCategory[]>> {
    return this.artistsService.findCategories();
  }
}
