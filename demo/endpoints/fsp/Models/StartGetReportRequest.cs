namespace fsp.Models
{

    // TODO: if this app becomes production, use Json attributes to make field names style compatible with
    // the rest of the application
    public class StartGetReportRequest
    {
        public string troTdcId { get; set; }
        public string fspTdcId { get; set; }
        public string tdcEndpoint { get; set; }
    }
}