namespace tro.Models
{
    public class AgencyConnectToTdcRequest
    {
        public string tdcPrefix { get; set; } = "tdc";
        public string tdcEndpoint { get; set; } = "http://tdc-controller:3015";
    }
}