import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtocolValidationPipe } from 'protocol-common/validation/protocol.validation.pipe';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dtos/create.transaction.dto';
import { TransactionReportDto } from './dtos/transaction.report.dto';

/*
    TODO: describe purpose of end point
*/
@ApiTags('transactions')
@Controller('v2/transactions')
export class TransactionsController {

    constructor(private readonly transactionService: TransactionsService) {}

    @Post('issueGrantCreds')
    async register(@Body() body: any): Promise<any> {
        await this.transactionService.issueGrantCredentials(body.key);
        return { success: true };
    }

    /*
        This API call can be moved to FSP.  The FSP implementation can send the credit report request as a basic
        message to TDC.   Why?  This ensures the TDC the message comes from a source the TDC already has a connection
        to, thereby adding another level of security/validation.
    */
    @Post('report')
    async report(@Body(new ProtocolValidationPipe()) body: TransactionReportDto): Promise<any> {
        return await this.transactionService.createTransactionReport(body);
    }

    @Post('create')
    async createTransaction(@Body(new ProtocolValidationPipe()) body: CreateTransactionDto): Promise<any> {
        return await this.transactionService.createTransaction(body);
    }


    /*
        helper method that probably should be replaced somehow
        if we keep it around it should only return either FSP or the TRO id for the key inputted
    */
    @Get('ids/:key/:source?')
    async getConnectionIds(
        @Param('key') key: string,
        @Param('source') source?: string
        ): Promise<any> {
        return await this.transactionService.getConnectionIds(key, source);
    }
}
