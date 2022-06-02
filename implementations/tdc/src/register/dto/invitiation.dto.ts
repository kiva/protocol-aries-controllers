import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * This DTO is the same structure as the connection invite returned from starting
 * an acapy agent.  Please see Aireas RFC 160 for details on the fields themselves.
 */
export class InvitationDto
{
    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsString() readonly '@type': string;

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsString() readonly '@id': string;

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsArray() readonly recipientKeys: string[];

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsString() readonly label: string;

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsString() readonly serviceEndpoint: string;

    @ApiProperty({
        description: 'defined by aries RFC 160'
    })
    @IsOptional() @IsString() readonly imageUrl: string;
}
