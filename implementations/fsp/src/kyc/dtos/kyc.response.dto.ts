import { ApiPropertyOptional } from '@nestjs/swagger';


export class KycResponseDto {

    @ApiPropertyOptional({ example: '2000-01-01T00:00:00.000Z' })
    readonly birthDate: string;

    @ApiPropertyOptional({ example: 'Village, Chiefdom, District' })
    readonly birthPlace: string;

    @ApiPropertyOptional({ example: 'NAME' })
    readonly fatherFirstName: string;

    @ApiPropertyOptional({ example: 'NAME' })
    readonly fatherLastName: string;

    @ApiPropertyOptional({ example: 'MALE' })
    readonly gender: string;

    @ApiPropertyOptional({ example: 'NAME' })
    readonly lastName: string;

    @ApiPropertyOptional({ example: 'Single' })
    readonly maritalStatus: string;

    @ApiPropertyOptional({ example: 'NAME' })
    readonly middleName: string;

    @ApiPropertyOptional({ example: 'NAME' })
    readonly motherFirstName: string;

    @ApiPropertyOptional({ example: 'NAME' })
    readonly motherLastName: string;

    @ApiPropertyOptional({ example: 'ABCD1234' })
    readonly nationalId: string;

    @ApiPropertyOptional({ example: '2017-01-01T01:01:01.111Z' })
    readonly nationalIssueDate: string;

    @ApiPropertyOptional({ example: 'WORKER' })
    readonly occupation: string;

    @ApiPropertyOptional({ example: 'Address, Village, Chiefdom, District' })
    readonly permanentAddress: string;

    @ApiPropertyOptional({ example: '11111111' })
    readonly phoneNumber: string;

    @ApiPropertyOptional({ example: 'BASE64_ENCODED_PNG' })
    readonly 'photo~attach': string;

    @ApiPropertyOptional({ example: 'Address, Village, Chiefdom, District' })
    readonly residentialAddress: string;

    @ApiPropertyOptional({ example: 'BASE64_ENCODED_PNG' })
    readonly 'signature~attach': string;

    @ApiPropertyOptional({ example: '1111111' })
    readonly voterId: string;

    @ApiPropertyOptional({ example: '2017-01-01T01:01:01.111Z' })
    readonly voterIssueDate: string;
}
