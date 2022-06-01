using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace tro.Views
{
    public class CitizenSetup : UserControl
    {
        public CitizenSetup()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}