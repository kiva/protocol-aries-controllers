namespace tro.Models
{
    public class IssueOneTimeKeyRequest
    {
        public string connectionId { get; set; }
        public string tdcEndpoint { get; set; }
        public string oneTimeKey { get; set; }
    }
}