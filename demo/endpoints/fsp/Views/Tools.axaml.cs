using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace fsp.Views
{
    public class Tools : UserControl
    {
        public Tools()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}