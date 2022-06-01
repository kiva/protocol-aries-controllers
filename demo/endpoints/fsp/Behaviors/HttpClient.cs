using System;
using System.Net.Http;
using System.Threading.Tasks;
using Flurl;
using Flurl.Http;

namespace fsp.Behaviors
{
    public class HttpClient
    {
        static HttpClient()
        {
            FlurlHttp.Configure(settings =>
            {
                settings.OnErrorAsync = HttpClient.HandleFlurlErrorAsync;
                settings.BeforeCallAsync = HttpClient.HandleBeforeCallAsync;
                settings.AfterCallAsync = HttpClient.HandleAfterCallAsync;
            });    
        }
        
        private static async Task HandleAfterCallAsync(FlurlCall call)
        {
            // please note: enabling AfterCallAsync handler can cause callers to get null references 
            // workaround is calling call.Response.ResponseMessage.Content.ReadAsStringAsync  
            // see https://github.com/tmenier/Flurl/issues/571
            if (null == call.Response || null == call.Response.ResponseMessage ||
                null == call.Response.ResponseMessage.Content)
            {
                System.Diagnostics.Debug.Write("nothing returned that makes any sense");
                return;
            }

            System.Diagnostics.Trace.WriteLine($"HttpClient.HandleAfterCallAsync() => {call.Response.ResponseMessage.Content.ReadAsStringAsync().Result}");
        }
        
        private static async Task HandleBeforeCallAsync(FlurlCall call)
        {
            System.Diagnostics.Trace.WriteLine($"HttpClient.HandleBeforeCallAsync() body sent => {call.RequestBody}");
        }

        private static async Task HandleFlurlErrorAsync(FlurlCall call)
        {
            System.Diagnostics.Trace.WriteLine($"HttpClient.HandleFlurlErrorAsync() => {call.Exception.Message}");
        }

        public static R MakePostRequest<T, R>(string url, T data)
        {
            Url site = new Url(url);
            Task<R> result = site.PostJsonAsync(data).ReceiveJson<R>();

            return result.Result;
        }

        public static string MakePostRequest<T>(string url, T data)
        {
            Url site = new Url(url);
            Task<string> result = site.PostJsonAsync(data).ReceiveString();

            return result.Result;
        }
        
        public static string MakeGetRequest(string url)
        {
            Url site = new Url(url);
            Task<string> result = site.GetStringAsync();

            return result.Result;
        }
        
        public static T MakeGetRequest<T>(string url)
        {
            Url site = new Url(url);
            Task<T> result = site.GetJsonAsync<T>();
            return result.Result;
        }
        
        public static string MakeDeleteRequest<T>(string url, T data)
        {
            Url site = new Url(url);
            Task<string> result = site.SendJsonAsync(HttpMethod.Delete, data).ReceiveString();

            return result.Result;
        }
    }
}