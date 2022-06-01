using System;
using Newtonsoft.Json;

namespace fsp.Behaviors
{
    public static class Serialization
    {
        public static string ToJson(this object instance)
        {
            return JsonConvert.SerializeObject(instance);
        }
    }
}