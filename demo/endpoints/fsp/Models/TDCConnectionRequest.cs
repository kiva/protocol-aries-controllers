using Flurl;
using Flurl.Http;

namespace fsp.Models
{
    /**
     * please note the field names match
     * https://github.com/kiva/protocol-aries/tree/master/implementations/fsp/src/transactions/dtos
     */
    public class TDCConnectionRequest
    {
        public string tdcPrefix { get; set; }
        public string tdcEndpoint { get; set; }
    }
}