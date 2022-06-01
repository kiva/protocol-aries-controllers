using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace fsp.Views
{
    public class SendTransactions : UserControl
    {
        public SendTransactions()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}