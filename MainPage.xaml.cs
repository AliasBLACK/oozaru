using Microsoft.Web.WebView2.Core;
using System;
using System.Diagnostics;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

// The Blank Page item template is documented at https://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x409

namespace OozaruXbox
{
    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            InitializeComponent();
            InitWebView();
        }

        protected async Task InitWebView()
        {
            await WebView2.EnsureCoreWebView2Async();
            WebView2.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "oozaru",
                "Assets\\oozaru",
                CoreWebView2HostResourceAccessKind.Allow
            );
            WebView2.CoreWebView2.Navigate("http://oozaru/index.html");
        }
    }
}
