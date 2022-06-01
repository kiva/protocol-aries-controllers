namespace tro.Models
{
    public class CitizenSetupRequest
    {
        public string agentId { get; set; }
        public string walletId { get; set; }
        public string walletKey { get; set; }
        public string adminApiKey { get; set; }
        public string seed { get; set; }
        public string did { get; set; }
    }
}