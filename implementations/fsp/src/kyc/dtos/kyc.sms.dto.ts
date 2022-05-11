import { IsString, IsArray, IsOptional, Length, IsNumberString, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

/**
 * DTO for a KYC SMS request
 */
export class KycSmsDto {

    @ApiPropertyOptional({
        example: +2327654321,
        description: `Phone number that the citizen has stored on record to send an SMS. Must include the country code.`
    })
    @IsOptional() @IsPhoneNumber('ZZ') phoneNumber: string;

    @ApiPropertyOptional({
        example: 123456,
        description: `6-digit one time password sent via SMS.`
    })
    @IsOptional() otp: number;

    @ApiProperty({
        example: { externalIds: { sl_voter_d: 1111111 } },
        description: `Filters must include an externalIds map. Each key in the map (e.g. 'sl_national_id') will always correspond to exactly 1 citizen.`
    })
    @IsOptional() filters: any; // Some filters are checked by Filters are passed through and validated by the identity service

    @ApiProperty({
        example: { OperatorLocation: 'Some Place', TellerComputerUsername: 'TestUser'},
        description: `Device details as a JSON object to be saved with the KYC data.`
    })
    @IsNotEmpty() readonly device: any; // Device details are passed through and validated by the auth service

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
