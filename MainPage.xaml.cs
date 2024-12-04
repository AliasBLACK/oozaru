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
using System.Runtime.InteropServices;

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
            Environment.SetEnvironmentVariable(
                variable: "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                value: "--autoplay-policy=no-user-gesture-required"
            );
            InitializeComponent();

            #pragma warning disable 4014
            InitWebView();
        }

        private async Task InitWebView()
        {
            await WebView2.EnsureCoreWebView2Async();
            WebView2.CoreWebView2.SetVirtualHostNameToFolderMapping(
                hostName: "oozaru",
                folderPath: "Assets\\oozaru",
                accessKind: CoreWebView2HostResourceAccessKind.Allow
            );
            WebView2.CoreWebView2.WebMessageReceived += (s, e) =>
            {
                var msg = e.TryGetWebMessageAsString()
                    .Replace("http://oozaru", "Assets/oozaru")
                    .Split("<br>");
                foreach (var item in msg)
                    Debug.WriteLine(item);
            };
            WebView2.CoreWebView2.Navigate("http://oozaru/index.html");
        }
    }
}
