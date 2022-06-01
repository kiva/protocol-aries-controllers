import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTransactionDto {
    @ApiProperty({
        example: `TDC-FSP-1232132132`,
        description: `fspId as found in the credit grant credential and message sent to the FSP from the TDC`
    })
    @IsString() readonly fspId: string;

    @ApiProperty({
        example: ``,
        description: `url to the TDC`
    })
    @IsString() readonly tdcEndpoint: string;

    @ApiProperty({
        example: `query, payment, late fee`,
        description: `keyword that will help processing determine the body of transactionEventJson`
    })
    @IsString() readonly typeId: string;

    @ApiProperty({
        example: `car loan, cash aid`,
        description: `keyword that will help processing determine the body of transactionEventJson`
    })
    @IsString() readonly subjectId: string;

    @ApiProperty({
        example: ``,
        description: `hash of eventJson computed by fsp`
    })
    @IsString() readonly fspHash: string;

    @ApiProperty({
        example: ``,
        description: `hash of eventJson computed by fsp, used by TDC and TRO to validate`
    })
    @IsString() readonly date: string;

    @ApiProperty({
        example: `15.99`,
        description: `amount or value of the transaction in local currency, no symbols`
    })
    @IsString() readonly amount: string;

    @ApiProperty({
        example: ``,
        description: `body of the transaction.  expected to be stringified json which can be serialized into a type`
    })
    @IsString() readonly eventJson: string;
}
