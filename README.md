# Homebridge Divoom Plugin

This [Homebridge](https://github.com/homebridge/homebridge) allows you to control your [Divoom](https://www.divoom.com/) devices from Apple's HomeKit.

**Note:** only tested on a single Divoom Ditoo, other types of Divoom devices or multiple devices might not be supported currently.

Credit to [node-divoom-timebox-evo](https://github.com/RomRider/node-divoom-timebox-evo) for doing the majority of the legwork to properly reverse-engineer the protocol and exposing it in a nice API.

## Prerequisites

**Only supports up to Node v12.x currently. Later versions will not work.**

On Linux, install the Bluetooth development packages in order to build [node-bluetooth-serial-port](https://github.com/eelcocramer/node-bluetooth-serial-port).

`apt-get install build-essential libbluetooth-dev`

## Installing the plugin

`npm install -g homebridge-divoom`

## Configuration

1. Ensure the Divoom device is paired with the device running the Homebridge server.
2. Find out the Divoom device's MAC address.
   * I recommend using BlueZ, run `apt-get install bluez` then `bluetoothctl` to retrieve the MAC addresses of all paired devices.

### Homebridge config

After installing the plugin, add the following to the `platforms` array of your `config.json` or through the Config menu in the Homebridge UI. Replace `DIVOOM_MAC_ADDRESS` by the MAC address of the Divoom device.

```json
"platforms": [
    {
        "platform": "DivoomPlatform",
        "devices": [
            "DIVOOM_MAC_ADDRESS"
        ]
    }
]
```

## Capabilities

Current features:

* Changing display brightness
* Changing display color
   * Note: changing the display color wil automatically switch the device to the "time" channel.
* Changing volume

Planned features:

* TBD
