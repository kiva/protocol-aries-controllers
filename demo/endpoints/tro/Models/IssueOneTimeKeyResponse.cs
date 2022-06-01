namespace tro.Models
{
    public class IssueOneTimeKeyResponse
    {
        public string key { get; set; }
        public string tdcTroId { get; set; }
        public string tdcFspId { get; set; }
        // TODO: we could make this enum
        public string state { get; set; }
        public string id { get; set; }
        public string source { get; set; }
    }
}