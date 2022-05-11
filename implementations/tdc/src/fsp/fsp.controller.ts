import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import cryptoRandomString from 'crypto-random-string';
import { ProtocolValidationPipe } from 'protocol-common/validation/protocol.validation.pipe';
import { FspService } from './fsp.service';
import { RegisterOnetimeKeyDto } from './dto/register.onetimeKey.dto';
import { RegisterIssueDto } from './dto/register.issue.dto';

/**
 * toThink()
 * We should remove the restful api and replace it with basicmessages (or custom aries protocols) and
 * change workflow from originating in CRA to being driven by CRO (and FSP)
 *
 * To make it work:
 * 1 - change (create new) aries-common/basicmessage webhook to fire event when message is received,  that way there is a
 *     generic basic message handler that allows for custom responses without it all having to live in
 *     in aries-common.
 * 2 - workflow changes, which is different from how our workflows currently originate.
 *       a - FSP connects to TDC
 *       b - FSP sends message "i would like to be part of the system"
 *       c - TDC proves identity, issues credential
 */
@ApiTags('fsp')
@Controller('v2/fsp')
export class FspController {

    constructor(private readonly fspService: FspService) {}

    /**
     * Connect FSP to TDC, which will result in credentials being generated that will
     * permit the FSP to work with the TDC
     * @param body
     */
    @Post('/register')
    async register(@Body(new ProtocolValidationPipe()) body: RegisterIssueDto): Promise<any> {
        const connectionData = await this.fspService.registerAndIssue(body);
        return { success: true, connectionData };
    }

    /**
     * FSP sends a value which should be unique and not used previously to the TDC.  The TDC
     * saves this value which the TDC will use to pair with a TRO.
     * @param body
     */
    @Post('/register/onetimekey')
    async registerOneTimeKey(@Body(new ProtocolValidationPipe()) body: RegisterOnetimeKeyDto): Promise<any> {
        return await this.fspService.registerOneTimeKey(body.connectionId, body.oneTimeKey);
    }

    /**
     * Fun helper function that will assist FSP in creating one time use values.
     */
    @Get('/register/onetimekey')
    async getOneTimeKey(): Promise<any> {
        return new Promise<any>((resolve) => {
            // @ts-ignore
            resolve(cryptoRandomString({length: 32, type: 'hex'}));
        });
    }
}
