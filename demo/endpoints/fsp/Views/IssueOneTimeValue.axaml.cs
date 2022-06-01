using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace fsp.Views
{
    public class IssueOneTimeValue : UserControl
    {
        public IssueOneTimeValue()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            AvaloniaXamlLoader.Load(this);
        }
    }
}