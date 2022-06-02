/**
 * A single line item of a credit report, called a Credit Event
 */
export class CreditReportEventDto {
    /**
     * a hash of the credential that was created at the time the credit event was recorded
     * TODO: hash computation TBD but will be public, for now this will be the two fields below
     */
    hash: string;

    /**
     * date of the credit event
     */
    reportedDate: Date;

    /**
     * id of the credential
     */
    credentialId: string;
}
