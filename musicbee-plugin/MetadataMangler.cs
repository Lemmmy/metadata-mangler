using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Diagnostics;
using System.IO;

namespace MusicBeePlugin
{
    public partial class Plugin
    {
        private MusicBeeApiInterface mbApiInterface;
        private PluginInfo about = new PluginInfo();
        private const string SETTING_MANGLER_URL = "ManglerUrl";
        private const string SETTING_MUSIC_ROOT = "ManglerMusicRoot";
        private const string HOTKEY_DESCRIPTION = "Open selected tracks in Metadata Mangler";
        private const string MENU_PATH = "context.Main/Open in Metadata Mangler";
        private string settingsFolder;

        public PluginInfo Initialise(IntPtr apiInterfacePtr)
        {
            mbApiInterface = new MusicBeeApiInterface();
            mbApiInterface.Initialise(apiInterfacePtr);
            about.PluginInfoVersion = PluginInfoVersion;
            about.Name = "Metadata Mangler";
            about.Description = "Adds shortcuts to open tracks in Metadata Mangler";
            about.Author = "Lemmmy";
            about.TargetApplication = "";
            about.Type = PluginType.General;
            about.VersionMajor = 1;
            about.VersionMinor = 0;
            about.Revision = 1;
            about.MinInterfaceVersion = MinInterfaceVersion;
            about.MinApiRevision = MinApiRevision;
            about.ReceiveNotifications = (ReceiveNotificationFlags.PlayerEvents | ReceiveNotificationFlags.TagEvents);
            about.ConfigurationPanelHeight = 100;

            // Initialize settings folder
            settingsFolder = mbApiInterface.Setting_GetPersistentStoragePath();
            Directory.CreateDirectory(settingsFolder);

            // Register the command and add context menu item
            // https://getmusicbee.com/forum/index.php?topic=17136.msg101442#msg101442
            mbApiInterface.MB_AddMenuItem(MENU_PATH, HOTKEY_DESCRIPTION, new EventHandler(OnOpenInMetadataMangler));

            return about;
        }

        // Helper method to get a setting value from a file
        private string GetSettingValue(string settingName, string defaultValue)
        {
            string filePath = Path.Combine(settingsFolder, settingName + ".txt");
            if (File.Exists(filePath))
            {
                try
                {
                    return File.ReadAllText(filePath);
                }
                catch (Exception)
                {
                    return defaultValue;
                }
            }
            return defaultValue;
        }

        // Helper method to save a setting value to a file
        private void SetSettingValue(string settingName, string value)
        {
            string filePath = Path.Combine(settingsFolder, settingName + ".txt");
            try
            {
                File.WriteAllText(filePath, value);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to save setting {settingName}: {ex.Message}", "Metadata Mangler",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public bool Configure(IntPtr panelHandle)
        {
            if (panelHandle != IntPtr.Zero)
            {
                Panel configPanel = (Panel)Panel.FromHandle(panelHandle);
                configPanel.Controls.Clear();

                // Mangler URL setting
                Label urlLabel = new Label { AutoSize = true, Location = new Point(0, 0), Text = "Metadata Mangler URL:" };
                TextBox urlBox = new TextBox {
                    Bounds = new Rectangle(150, 0, 200, 20),
                    Text = GetSettingValue(SETTING_MANGLER_URL, "http://localhost:5173")
                };

                // Music root setting
                Label rootLabel = new Label { AutoSize = true, Location = new Point(0, 30), Text = "Music Library Root:" };
                TextBox rootBox = new TextBox {
                    Bounds = new Rectangle(150, 30, 200, 20),
                    Text = GetSettingValue(SETTING_MUSIC_ROOT, Environment.ExpandEnvironmentVariables("%USERPROFILE%\\Music"))
                };

                configPanel.Controls.AddRange(new Control[] { urlLabel, urlBox, rootLabel, rootBox });

                // Save settings when they change
                urlBox.TextChanged += (s, e) => SetSettingValue(SETTING_MANGLER_URL, urlBox.Text);
                rootBox.TextChanged += (s, e) => SetSettingValue(SETTING_MUSIC_ROOT, rootBox.Text);
            }
            return true;
        }

        private void OnOpenInMetadataMangler(object sender, EventArgs e)
        {
            OpenInMetadataMangler();
        }

        private void OpenInMetadataMangler()
        {
            // Get selected files
            string[] files = new string[512];
            int count = 0;
            mbApiInterface.Library_QueryFiles("domain=SelectedFiles");
            string file;
            while ((file = mbApiInterface.Library_QueryGetNextFile()) != null && count < 512)
            {
                files[count++] = file;
            }

            if (count == 0) return;
            if (count > 512)
            {
                MessageBox.Show("Too many files selected (max 512)", "Metadata Mangler", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Get the common root directory
            string[] paths = files.Take(count).Select(f => System.IO.Path.GetDirectoryName(f)).ToArray();
            string commonRoot = paths[0];
            for (int i = 1; i < paths.Length; i++)
            {
                while (!paths[i].StartsWith(commonRoot, StringComparison.OrdinalIgnoreCase))
                {
                    commonRoot = System.IO.Path.GetDirectoryName(commonRoot);
                    if (string.IsNullOrEmpty(commonRoot)) break;
                }
                if (string.IsNullOrEmpty(commonRoot)) break;
            }

            if (string.IsNullOrEmpty(commonRoot))
            {
                MessageBox.Show("No common root directory found", "Metadata Mangler", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Get the music root from settings
            string musicRoot = GetSettingValue(SETTING_MUSIC_ROOT,
                Environment.ExpandEnvironmentVariables("%USERPROFILE%\\Music"));

            // Ensure the common root is under the music root
            if (!commonRoot.StartsWith(musicRoot, StringComparison.OrdinalIgnoreCase))
            {
                MessageBox.Show("Selected files are not under the music root directory", "Metadata Mangler",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Get the relative path and URL encode it
            string relativePath = commonRoot.Substring(musicRoot.Length).TrimStart('\\', '/');

            // Split the path by slashes and encode each component separately
            string[] pathComponents = relativePath.Split(new[] { '\\', '/' }, StringSplitOptions.RemoveEmptyEntries);
            string encodedPath = string.Join("/", pathComponents.Select(component => Uri.EscapeDataString(component)));

            // Get the Mangler URL from settings
            string manglerUrl = GetSettingValue(SETTING_MANGLER_URL, "http://localhost:5173");
            string url = $"{manglerUrl.TrimEnd('/')}/album/{encodedPath}";

            // Open in browser
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open browser: {ex.Message}", "Metadata Mangler",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // called by MusicBee when the user clicks Apply or Save in the MusicBee Preferences screen.
        // its up to you to figure out whether anything has changed and needs updating
        public void SaveSettings()
        {
            // Settings are already saved when they change in the Configure method
        }

        // MusicBee is closing the plugin (plugin is being disabled by user or MusicBee is shutting down)
        public void Close(PluginCloseReason reason)
        {
        }

        // uninstall this plugin - clean up any persisted files
        public void Uninstall()
        {
            // Clean up settings files
            try
            {
                if (Directory.Exists(settingsFolder))
                {
                    string[] settingFiles = Directory.GetFiles(settingsFolder, "*.txt");
                    foreach (string file in settingFiles)
                    {
                        File.Delete(file);
                    }
                }
            }
            catch (Exception)
            {
                // Ignore errors during uninstall
            }
        }

        // receive event notifications from MusicBee
        // you need to set about.ReceiveNotificationFlags = PlayerEvents to receive all notifications, and not just the startup event
        public void ReceiveNotification(string sourceFileUrl, NotificationType type)
        {
            // perform some action depending on the notification type
            switch (type)
            {
                case NotificationType.PluginStartup:
                    // perform startup initialisation
                    switch (mbApiInterface.Player_GetPlayState())
                    {
                        case PlayState.Playing:
                        case PlayState.Paused:
                            // ...
                            break;
                    }
                    break;
                case NotificationType.TrackChanged:
                    string artist = mbApiInterface.NowPlaying_GetFileTag(MetaDataType.Artist);
                    // ...
                    break;
            }
        }
    }
}
