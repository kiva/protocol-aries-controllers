// This is duplicate of https://github.com/kiva/aries-guardianship-agency/blob/main/src/transactions/dtos/tx.report.response.dto.ts
// and should be converted into common shared type in aries-controller
export class TxReportResponseDto {
    public order: number;
    public transactionId: string;
    public typeId: string;
    public subjectId: string;
    public txDate: Date;
    public amount: string;
    public credentialId: string;
    public hash: string;
    public details: string;
}
