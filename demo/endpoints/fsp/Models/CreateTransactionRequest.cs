namespace fsp.Models
{
    // TODO: if this app becomes production, we should replace eventDate type as Date, and
    // maybe eventJson with concrete types.
    //
    // AND use Json attributes to make field names style compatible with
    // the rest of the application
    public class CreateTransactionRequest
    {
        public string fspId { get; set; }
        public string tdcEndpoint { get; set; }
        public string typeId { get; set; }
        public string subjectId { get; set; }
        public string fspHash { get; set; }
        public string date { get; set; }
        public string amount { get; set; }
        public string eventJson { get; set; }
        
    }
}