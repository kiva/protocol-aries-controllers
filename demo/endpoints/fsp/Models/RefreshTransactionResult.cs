using System;

namespace fsp.Models
{
    public class RefreshTransactionResult
    {
        public int id { get; set; }
        public string tdcFspId { get; set; }
        public string transactionId { get; set; }
        public DateTime transactionDate { get; set; }
        public string hash { get; set; }
        public string state { get; set; }
    }
}