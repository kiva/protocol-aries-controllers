import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentService, VerifierService } from 'aries-controller';

/**
 * The pattern here is interesting because we just want to expose some endpoints on this controller that point down services in the common
 * protocol code. Perhaps we could just move this entire controller/module into common (and then make DRY with the RegisterController)
 */
@Controller('v2/mobile')
@ApiTags('mobile')
export class MobileController {

    constructor(
        private readonly agentService: AgentService,
        private readonly verifierService: VerifierService,
    ) {}

    /**
     * Create connection for mobile agent to receive
     */
    @Post('connection')
    async createConnection(): Promise<any> {
        return await this.agentService.openConnection();
    }

    /**
     * Check status of connection
     */
    @Get('connection/:connectionId')
    async checkConnection(@Param('connectionId') connectionId: string): Promise<any> {
        return await this.agentService.checkConnection(connectionId);
    }

    /**
     * Initiate proof exchange
     */
    @Post('verify')
    public async verify(@Body() body: any) {
        return await this.verifierService.verify(body.proof_profile_path, body.connection_id);
    }

    /**
     * Check status of presentation exchange
     */
    @Get('verify/:presExId')
    async checkPresEx(@Param('presExId') presExId: string): Promise<any> {
        return await this.verifierService.checkPresEx(presExId);
    }
}
