import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InvitationDto } from './invitiation.dto';

export class RegisterIssueDto {
    @ApiProperty({
        example: `bank 1`,
        description: `something meaningful to the caller that identifies this connection`
    })
    @IsString() readonly alias: string;

    @ApiProperty({
        example: `see acapy documentation`,
        description: `invitation object returned from acapy start up`
    })
    @ValidateNested() @Type(() => InvitationDto) readonly invitation: InvitationDto;
}
