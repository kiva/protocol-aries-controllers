import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { Logger } from 'protocol-common/logger';


export class ExceptionHandler {
    /**
     * Evaluate e and determine which exception we want to throw instead.  We evaluate e because it os most likely
     * an acapy error and the UI needs a better way of determining the error.
     * @param e
     */
    public static evaluateAndThrow(e: any) {
        if (e.details && e.details.ex) {
            if (e.details.ex.connection_id && e.details.ex.connection_id[0].includes('UUID')) {
                throw new ProtocolException(ProtocolErrorCode.CONNECTION_NOT_READY, 'invalid connection id');
            }
            if (e.details.ex.startsWith('400: connection record not found')) {
                throw new ProtocolException(ProtocolErrorCode.PROOF_FAILED_VERIFICATION, 'connection not established or missing');
            }
        }
        Logger.warn(`unrecognized error ${e.message}`, e);
        throw new ProtocolException(ProtocolErrorCode.INTERNAL_SERVER_ERROR, e.message);
    }
}
