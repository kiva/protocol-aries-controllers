using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace fsp.Views
{
    public class TDCConnection : UserControl
    {
        public TDCConnection()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}