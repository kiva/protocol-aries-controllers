using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;

namespace tro.Views
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