import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { RegisterTdcDto } from './dtos/register.tdc.dto';
import { RegisterTdcResponseDto } from './dtos/register.tdc.response.dto';
import { RegisterOneTimeKeyDto } from './dtos/register.one.time.key.dto';
import { TransactionReportRequestDto } from './dtos/transaction.report.request.dto';
import { CreateTransactionDto } from './dtos/create.transaction.dto';
import { ProtocolValidationPipe } from 'protocol-common/validation';

/**
 * Exposing endpoints the FSP would call to interact with the TDC
 *
 * The FSP does not need to be in direct contact with the TDC.  These functions make it possible
 * for the FSP to contact the TDC indirectly
 */
@Controller('v2/transaction')
@ApiTags('transaction')
export class TransactionController {

    constructor(
        private readonly transactionService: TransactionService
    ) {}

    /**
     * For the FSP to make an aries compatible connection to the TDC
     * @param body
     */
    @Post('/register')
    public async registerWithTDC(
        @Body(new ProtocolValidationPipe()) body: RegisterTdcDto
    ): Promise<RegisterTdcResponseDto> {
        return await this.transactionService.registerWithTDC(body);
    }

    @Post('/nonce')
    public async registerOnetimeKey(@Body(new ProtocolValidationPipe()) body: RegisterOneTimeKeyDto): Promise<any> {
        return await this.transactionService.registerOnetimeKey(body);
    }

    @Post('/create')
    public async createTransaction(@Body(new ProtocolValidationPipe()) body: CreateTransactionDto): Promise<any> {
        return await this.transactionService.createTransaction(body);
    }

    @Post('/report')
    public async getTransactionReport(@Body(new ProtocolValidationPipe()) body: TransactionReportRequestDto): Promise<any> {
        return await this.transactionService.getTransactionReport(body);
    }

    /**
     *     helper method that probably should be replaced somehow
     *     if we keep it around it should only return either FSP or the TRO id for the key inputted
     * @param key
     */
    @Get('ids/:key')
    async getOneTimeKeyIds(@Param('key') key: string): Promise<any> {
        return await this.transactionService.getOneTimeKeyIds(key);
    }

    /**
     *
     * @param key
     */
    @Get(':key')
    async getTransactionStatus(@Param('key') key: string): Promise<any> {
        return await this.transactionService.getTransactionStatus(key);
    }

    /**
     *
     * @param key
     */
    @Get('/report/:key/status')
    public async getReportStatus(@Param('key') key: string): Promise<any> {
        return await this.transactionService.getReportStatus(key);
    }
}
