using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace tro.Views
{
    public class Header : UserControl
    {
        public Header()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}