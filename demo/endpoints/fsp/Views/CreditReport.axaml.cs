using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace fsp.Views
{
    public class CreditReport : UserControl
    {
        public CreditReport()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}