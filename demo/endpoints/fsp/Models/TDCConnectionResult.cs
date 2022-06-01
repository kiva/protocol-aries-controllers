namespace fsp.Models
{
    public class ConnectionData
    {
        public string invitation_key { get; set; }
        public string invitation_mode { get; set; }
        public string alias { get; set; }
        public string updated_at { get; set; }
        public string their_role { get; set; }
        public string their_label { get; set; }
        public string rfc23_state { get; set; }
        public string accept { get; set; }
        public string state { get; set; }
        public string routing_state { get; set; }
        public string connection_id { get; set; }
        public string created_at { get; set; }
    }
    
    public class TDCConnectionResult
    {
        public ConnectionData connectionData { get; set; }
    }
}