import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { ServiceCatalogService } from './services.service';
import { ServiceCatalogController } from './services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  providers: [ServiceCatalogService],
  controllers: [ServiceCatalogController],
  exports: [ServiceCatalogService],
})
export class ServiceCatalogModule {}
