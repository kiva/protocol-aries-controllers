namespace fsp.Models
{
    public class ReportContent<T>
    {
        public string tdcTroId { get; set; }
        public string tdcFspId { get; set; }
        public string id { get; set; }
        public string typeId { get; set; }
        public string subjectId { get; set; }
        public string amount { get; set; }
        public string date { get; set; }
        public T eventData { get; set; }
    }
}