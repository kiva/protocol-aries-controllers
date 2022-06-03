import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsOptional,
    IsInt,
    Min,
    Max,
    Length,
    IsNumberString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for a KYC request
 */
export class KycDto {

    @ApiProperty({
        minimum: 1,
        maximum: 10,
        example: 1,
        description: '1-5 map to right thumb through right little finger, 6-10 map to left thumb to left little finger.'
    })
    @IsInt() @Min(1) @Max(10) readonly position: number;

    @ApiProperty({
        example: 'BASE64_ENCODED_PNG',
        description: 'Image in PNG/JPEG format that has been base64 encoded.'
    })
    @IsOptional() @IsString() readonly image: string;

    @ApiProperty({
        example: 'BASE64_ENCODED_TXT',
        description: 'Template of a fingerprint image that has been base64 encoded.'
    })
    @IsOptional() @IsString() readonly template: string;

    @ApiProperty({
        example: { FingerprintSensorSerialNumber: 'xyz123', TellerComputerUsername: 'TestUser'},
        description: 'Device details. Must include \'FingerprintSensorSerialNumber\' and \'TellerComputerUsername\'.'
    })
    @IsNotEmpty() readonly device: any; // Device details are passed through and validated by the auth service

    @ApiPropertyOptional({
        example: { externalIds: { national_id: 1111111 } },
        description: 'Filters must include externalIds map. Each key in the map (e.g. \'national_id\') will always correspond to exactly 1 citizen.'
    })
    @IsOptional() filters: any; // Some filters are checked by Filters are passed through and validated by the identity service

    @ApiPropertyOptional({
        readOnly: true,
        description: 'Optionally specify which attributes are needed. If not set, all attributes will be returned.'
    })
    @IsOptional() @IsArray() requestedAttributes: Array<string>;

    @ApiPropertyOptional({
        readOnly: true,
        minLength: 22,
        maxLength: 64,
        description: 'Optionally set an issuerDid to verify against. If not set, issuerDid will be set from context.'
    })
    @IsOptional() @IsString() @Length(22, 64) issuerDid: string;

    @ApiPropertyOptional({
        readOnly: true,
        minLength: 20,
        maxLength: 32,
        description: 'Optionally specify nonce and you will receive an indy proof back along with the identity data. ' +
          'If not set, a nonce will be auto generated.'
    })
    @IsOptional() @IsNumberString() @Length(20, 32) readonly nonce: string;

}
