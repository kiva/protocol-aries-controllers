import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { KycService } from './kyc.service.js';
import { KycDto } from './dtos/kyc.dto.js';
import { KycResponseDto } from './dtos/kyc.response.dto.js';
import { KycSmsDto } from './dtos/kyc.sms.dto.js';
import { ProtocolValidationPipe } from 'protocol-common/validation';

@ApiTags('kyc')
@Controller('v2/kyc')
export class KycController {

    constructor(private readonly kycService: KycService) {}

    // -- TODO These 3 endpoints are what we exposed in the old flow so we need to ensure that they work the same -- //

    /**
     * Main KYC endpoint
     */
    @ApiHeader({ name: 'authorization', required: false})
    @ApiHeader({ name: 'x-session-id', required: false})
    @ApiResponse({ status: 201, type: KycResponseDto })
    @Post()
    async kyc(
        @Body(new ProtocolValidationPipe()) body: KycDto,
        @Headers('authorization') authHeader: string,
        @Headers('x-session-id') sessionId: string,
    ): Promise<KycResponseDto> {
        return await this.kycService.kyc(body, authHeader, sessionId);
    }

    /**
     * KYC endpoint for SMS OTP
     */
    @ApiHeader({ name: 'authorization', required: false})
    @ApiHeader({ name: 'x-session-id', required: false})
    @ApiResponse({ status: 201, type: KycResponseDto })
    @Post('sms')
    async kycSms(
        @Body(new ProtocolValidationPipe()) body: KycSmsDto,
        @Headers('authorization') authHeader: string,
        @Headers('x-session-id') sessionId: string,
    ): Promise<KycResponseDto> {
        return await this.kycService.kycSms(body, authHeader, sessionId);
    }

    /**
     * Returns all potential kyc attributes, also serves as a ping endpoint for developers
     */
    @Get('attributes')
    getRequestedAttributes(): Array<string> {
        return KycService.getAllKycAttributes();
    }
}
