import { IsString, IsNotEmpty, IsArray, IsOptional, IsInt, Min, Max, Length, IsNumberString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchDto } from './search.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for a KYC request
 */
export class KycDto {

    @ApiProperty({
        minimum: 1, maximum: 10, example: 1,
        description: `Positions 1-5 correspond to right thumb through right little finger, 6-10 correspond to left thumb to left little finger.`})
    @IsInt() @Min(1) @Max(10) readonly position: number;

    @ApiProperty({
        example: `BASE64_ENCODED_PNG`,
        description: `Image in PNG/JPEG format that has been base64 encoded.`
    })
    @IsOptional() @IsString() readonly image: string;

    @ApiProperty({
        example: `BASE64_ENCODED_TXT`,
        description: `Template of a fingerprint image that has been base64 encoded.`
    })
    @IsOptional() @IsString() readonly template: string;

    @ApiProperty({
        example: { FingerprintSensorSerialNumber: 'xyz123', TellerComputerUsername: 'TestUser'},
        description: `Device details as a JSON object, must include at least 'FingerprintSensorSerialNumber' and 'TellerComputerUsername'.`
    })
    @IsNotEmpty() readonly device: any; // Device details are passed through and validated by the auth service

    @ApiPropertyOptional({
        example: { externalIds: { sl_voter_d: 1111111 } },
        description: `Must use either 'filters' or 'search' (but not both). Filters must include an externalIds map. Each key in the map (e.g. 'sl_national_id') will always correspond to exactly 1 citizen.`
    })
    @IsOptional() filters: any; // Some filters are checked by Filters are passed through and validated by the identity service

    @ApiPropertyOptional({
        readOnly: true,
        description: `Must use either 'filters' or 'search' (but not both). Search params my find multiple citizens and the one with the best fingerprint match will be returned.`
    })
    @ValidateNested() @Type(() => SearchDto) search: SearchDto;

    @ApiPropertyOptional({
        readOnly: true,
        description: `By default don't set, and it will return all attributes. Optionally set specifically which attributes are needed.`
    })
    @IsOptional() @IsArray() requestedAttributes: Array<string>;

    @ApiPropertyOptional({
        readOnly: true,
        minLength: 22, maxLength: 64,
        description: `By default don't set and an issuerDid will be assigned based on context. Optionally set which issuerDid to verify against.`
    })
    @IsOptional() @IsString() @Length(22, 64) issuerDid: string;

    @ApiPropertyOptional({
        readOnly: true,
        minLength: 20, maxLength: 32,
        description: `By default don't set and a nonce will be auto generated. Optionally set your own nonce and you will receive an indy proof back along with the identity data.`
    })
    @IsOptional() @IsNumberString() @Length(20, 32) readonly nonce: string;

}
