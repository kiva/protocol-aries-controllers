import { VerifierService } from 'aries-controller/verifier/verifier.service';

export class Proofs {
    public static async proveIdentity(verifierService: VerifierService, identityProfile: string, connectionId: string): Promise<any> {
        const proof = await verifierService.verify(identityProfile, connectionId);
        const results = await verifierService.getVerifyResult(proof.presentation_exchange_id);
        return results;
    }
}
