import { Controller, Get } from '@nestjs/common';
import { StatusService } from './status.service';

// Public by design: returns only app version and liveness — never owner or
// customer data. Consumed by the in-app Status page and external uptime
// monitors that have no JWT.
@Controller('public/status')
export class StatusController {
  constructor(private readonly service: StatusService) {}

  @Get()
  getStatus() {
    return this.service.getStatus();
  }
}
