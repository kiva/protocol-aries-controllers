namespace fsp.Models
{
    // TODO: if this app becomes production, use Json attributes to make field names style compatible with
    // the rest of the application
    public class RefreshIdResult
    {
        public int id { get; set; }
        public string tdc_id { get; set; }
        public string fsp_id { get; set; }
        public string tdc_tro_id { get; set; }
        public string one_time_key { get; set; }
    }
}