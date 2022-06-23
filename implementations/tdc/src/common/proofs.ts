import { VerifierService } from 'aries-controller';

export class Proofs {
    public static async proveIdentity(verifierService: VerifierService, identityProfile: string, connectionId: string): Promise<any> {
        const proof = await verifierService.verify(identityProfile, connectionId);
        return verifierService.getVerifyResult(proof.presentation_exchange_id);
    }
}
