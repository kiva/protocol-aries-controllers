using System;
using Avalonia.Markup.Xaml;

namespace fsp.Models.UI
{
/*
     https://stackoverflow.com/questions/10005187/how-to-reference-a-generic-type-in-the-datatype-attribute-of-a-datatemplate
         <local:GenericType 
         BaseType="{x:Type local:ReportContent`2}"
         InnerTypes="{x:Type string}"
        />
    */
    public class GenericType : MarkupExtension
    {
        public GenericType() { }

        public GenericType(Type baseType, params Type[] innerTypes)
        {
            BaseType = baseType;
            InnerTypes = innerTypes;
        }

        public Type BaseType { get; set; }

        public Type[] InnerTypes { get; set; }

        public override object ProvideValue(IServiceProvider serviceProvider)
        {
            Type result = BaseType.MakeGenericType(InnerTypes);
            return result;
        }
    }
}