import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class RegisterOnetimeKeyDto {
    @ApiProperty({
        description: 'connection id created when two entities connect via the aries connection protocol.'
    })
    @IsString() readonly connectionId: string;

    @ApiProperty({
        description: 'a unique ID agreed upon between FSP and TRO.  It should never be reused by FSP'
    })
    @IsString() readonly oneTimeKey: string;
}
