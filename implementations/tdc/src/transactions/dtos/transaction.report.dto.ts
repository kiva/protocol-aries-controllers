import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * TransactionReportDto is the inputs from FSP when the FSP makes a transaction report request
 */
export class TransactionReportDto {

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsString() readonly fspTdcId: string;

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsString() readonly troTdcId: string;

    @ApiProperty({
        example: 'true',
        description: 'when true, report includes completeness proof.  defaults to false'
    })
    @IsOptional() @IsBoolean() readonly validated: boolean = false;
}
