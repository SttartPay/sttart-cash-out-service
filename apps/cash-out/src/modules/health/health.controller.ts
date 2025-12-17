import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiExcludeController()
@Controller('health')
export class HealthController {
    constructor(private readonly config: ConfigService) {}

    @Get()
    getHealth() {
        return {
            status: 'ok',
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
            env: this.config.get('NODE_ENV') ?? 'development',
        };
    }
}
