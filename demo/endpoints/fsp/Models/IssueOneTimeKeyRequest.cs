namespace fsp.Models
{
    // TODO: if this app becomes production, use Json attributes to make field names style compatible with
    // the rest of the application
    public class IssueOneTimeKeyRequest
    {
        public string connectionId { get; set; }
        public string tdcEndpoint { get; set; }
        public string oneTimeKey { get; set; }
    }
}