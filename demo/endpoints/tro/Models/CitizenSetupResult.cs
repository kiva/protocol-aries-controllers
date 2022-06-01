using System.Collections.Generic;
using Newtonsoft.Json;

namespace tro.Models
{
    public class CitizenConnectionData
    {
        [JsonProperty("@type")]
        public string Type { get; set; }

        [JsonProperty("@id")]
        public string Id { get; set; }
        public List<string> recipientKeys { get; set; }
        public string serviceEndpoint { get; set; }
        public string label { get; set; }
    }

    public class CitizenSetupResult
    {
        public string agentId { get; set; }
        public CitizenConnectionData connectionData { get; set; }
    }

}