import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for search params in a KYC request
 */
export class SearchDto {

    @ApiProperty({
        minLength: 1, maxLength: 50,
        description: `Fuzzy match against first name`,
    })
    @IsString() @Length(1, 50) readonly firstName: string;

    @ApiProperty({
        minLength: 1, maxLength: 50,
        description: `Fuzzy match against last name`,
    })
    @IsString() @Length(1, 50) readonly lastName: string;

    @ApiPropertyOptional({
        minLength: 1, maxLength: 50,
        description: `Fuzzy match against mother's first name`,
    })
    @IsOptional() @IsString() @Length(1, 50) readonly mothersFirstName: string;

    @ApiPropertyOptional({
        minLength: 1, maxLength: 50,
        description: `Fuzzy match against father's first name`,
    })
    @IsOptional() @IsString() @Length(1, 50) readonly fathersFirstName: string;

    @ApiPropertyOptional({
        description: `Date of birth in format 'YYYY-MM-DD'`
    })
    @IsOptional() readonly birthDate: string; // TODO figure out IsPostgresDate

}
