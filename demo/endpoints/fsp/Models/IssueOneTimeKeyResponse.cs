namespace fsp.Models
{
    // TODO: if this app becomes production, use Json attributes to make field names style compatible with
    // the rest of the application and make state enum
    public class IssueOneTimeKeyResponse
    {
        public string key { get; set; }
        public string tdcTroId { get; set; }
        public string tdcFspId { get; set; }
        // TODO: we could make this enum
        public string state { get; set; }
    }
}