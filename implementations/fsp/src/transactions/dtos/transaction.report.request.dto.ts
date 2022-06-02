import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class TransactionReportRequestDto {
    @ApiProperty({
        example: 'http://localhost:3015',
        description: 'url for the TDC restful apis'
    })
    @IsString() readonly tdcEndpoint: string;

    @ApiProperty({
        example: '',
        description: 'unique id shared with TRO'
    })
    @IsString() readonly fspTdcId: string;

    @ApiProperty({
        example: '',
        description: 'unique id shared with TRO'
    })
    @IsString() readonly troTdcId: string;

    @ApiProperty({
        example: 'true',
        description: 'when true, report includes completeness proof.  defaults to false'
    })
    @IsOptional() @IsBoolean() readonly validated: boolean = false;
}
