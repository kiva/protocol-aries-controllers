using System;
using Avalonia.Markup.Xaml;

namespace fsp.Models
{
    public class GetReportResult<T>
    {
        public int id { get; set; }
        public string tdcFspId { get; set; }
        public string reportId { get; set; }
        public string requestDate { get; set; } // there is a serialization error when this is DateTime.  Fix prob on the service however.
        public T content { get; set; }
        public string state { get; set; }
    }
}