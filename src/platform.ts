import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { DivoomPlatformAccessory } from './platformAccessory';

import bsp from 'bluetooth-serial-port';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class DivoomHomebridgePlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    // This is used to track restored cached accessories
    public readonly cachedAccessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.log.info('Finished initializing platform:', this.config.name);

        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.info('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.cachedAccessories.push(accessory);
    }

    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {
        this.log.info('Discovering devices');

        // MAC addresses of all Divoom accessories declared in config
        const deviceAddresses = this.config.devices as string[];
        this.log.info('device addresses: ', deviceAddresses);

        deviceAddresses.forEach(deviceAddress => {
            const btSerial = new bsp.BluetoothSerialPort();
            btSerial.findSerialPortChannel(deviceAddress, channel => {
                btSerial.connect(deviceAddress, channel, () => {
                    this.log.info('connected to', deviceAddress);

                    const uuid = this.api.hap.uuid.generate(deviceAddress);
                    const existingAccessory = this.cachedAccessories.find(accessory => accessory.UUID === uuid);

                    if (existingAccessory) {
                        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                        new DivoomPlatformAccessory(this, existingAccessory, btSerial);
                    } else {
                        const accessory = new this.api.platformAccessory('Divoom Accessory', uuid);
                        // create the accessory handler for the newly create accessory
                        // this is imported from `platformAccessory.ts`
                        new DivoomPlatformAccessory(this, accessory, btSerial);
                        // link the accessory to your platform
                        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                    }
                });
            });
        });
    }
}
