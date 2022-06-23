import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegisterService } from './register.service.js';
import { RegisterIssueDto } from './dto/register.issue.dto.js';
import { RegisterOnetimeKeyDto } from './dto/register.onetimeKey.dto.js';
import { ProtocolValidationPipe } from 'protocol-common/validation';

/**
 * toThink()
 * We should remove the restful api and replace it with basicmessages (or custom aries protocols) and
 * change workflow from originating in CRA to being driven by CRO (and FSP)
 *
 * To make it work:
 * 1 - change aries-common/basicmessage webhook to fire event when message is received,  that way there is a
 *     generic basic message handler that allows for custom responses without it all having to live in
 *     in aries-common.
 * 2 - workflow changes, which is different from how our workflows currently originate.
 *       a - CRO connects to CRA
 *       b - CRO sends message "i would like to be part of the system"
 *       c - CRA proves identity, issues credential
 */
@ApiTags('register')
@Controller('v2/register')
export class RegisterController {

    constructor(private readonly registerService: RegisterService) {}

    /**
     * Connect CRA to citizen once a connection is made and their identity can be proven
     */
    @Post()
    async register(@Body(new ProtocolValidationPipe()) body: RegisterIssueDto): Promise<any> {
        const connectionData = await this.registerService.registerAndIssue(body);
        return { success: true, connectionData };
    }

    @Post('/onetimekey')
    async registerOneTimeKey(@Body(new ProtocolValidationPipe()) body: RegisterOnetimeKeyDto): Promise<any> {
        return await this.registerService.registerOneTimeKey(body.connectionId, body.oneTimeKey);
    }
}
