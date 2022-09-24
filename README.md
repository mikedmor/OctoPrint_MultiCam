# OctoPrint MultiCam
Extends the Control tab to include a webcam section with buttons that you can configure in the settings to switch between multiple webcam feeds.

Future updates will include more options to show different types of streams, as well as the abilitly to show more than one stream at a time.

## Setup
Install via the bundled [Plugin Manager](https://github.com/foosel/OctoPrint/wiki/Plugin:-Plugin-Manager)
or manually using this URL:

    https://github.com/mikedmor/OctoPrint_MultiCam/archive/master.zip

It is recommended to setup a second RPi (potentially with [MotionEyeOS](https://github.com/ccrisan/motioneyeos)) to setup webcams from. Attaching more than one webcam to your octoprint device could result in high proccess use causing issues with your prints. You may also have to invest in a usb hub to power your webcams as RPi's tend to have low voltage issues when they are plugged in directly to the RPi. [This Link](https://elinux.org/RPi_Powered_USB_Hubs) has a good list of USB hubs that are supported by Raspberry.

## Known Incompatible Plugins
As new plugins are discovered that cause issues with MultiCam, they will be listed below. Please disable, or uninstall these plugins or you may experience some issues. Thank you

 * WebcamTab - MultiCam bind to the Control Tab, WebcamTab moves your webcam to another tab, breaking a few things. This may be fixed in the future if there seems to be enough support to warrent it.

## Screenshots

![Control Preview](Octoprint_MultiCam_Control.png)

![Setting Preview](Octoprint_MultiCam_Settings.png)

## Developers note

Other plugin developers could read the camera profiles with the [OctoPrint-Helper](https://docs.octoprint.org/en/master/plugins/helpers.html#helpers) functionality like this:
```python
helpers = self._plugin_manager.get_helpers("multicam")
if helpers and "get_webcam_profiles" in helpers:
    self.camProfiles = helpers["get_webcam_profiles"]()
```
But keep in mind that you will receive a copy of the current camera profiles!
## Support my work
Programming is not only my job, but also something I enjoy doing in my spare time. If you enjoy my work, or received support from me, please consider dropping a donation to my paypal, alternative i also accept Cryptocurrency!

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=K3LCC3QY2LSE8)

UnstoppableDomain: **mikedmor.crypto**

BTC: **bc1q567uzwg03he35m58tljzr30cy6mg9z52d899t4**

ETH: **0xf3Af4e5889ac3D5f605FC42C90476996051De2Fe**

LTC: **LgWgxnwLbmi7nuvn5Lt4g7KKZLpPHjxdZL**
