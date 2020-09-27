import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { DivoomHomebridgePlatform } from './platform';

import bsp from 'bluetooth-serial-port';
import * as divoom from 'node-divoom-timebox-evo';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
    private service: Service;
    private readonly ditoo = new divoom.TimeboxEvo();

    constructor(
        private readonly platform: DivoomHomebridgePlatform,
        private readonly accessory: PlatformAccessory,
        private readonly btSerialPort: bsp.BluetoothSerialPort,
    ) {

        // this.btSerialPort = new bsp.BluetoothSerialPort();
        // TODO get this from the accessory
        // const DITOO_ADDRESS = '11:75:58:98:BA:A6';


        // set accessory information
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
            .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

        // get the LightBulb service if it exists, otherwise create a new LightBulb service
        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.Lightbulb) ||
            this.accessory.addService(this.platform.Service.Lightbulb);

        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, 'Divoom accessory');

        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Lightbulb

        // register handlers for the Brightness Characteristic
        this.service.getCharacteristic(this.platform.Characteristic.Brightness)
            .on('set', this.setBrightness.bind(this));       // SET - bind to the 'setBrightness` method below


        /**
         * Creating multiple services of the same type.
         * 
         * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
         * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
         * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
         * 
         * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
         * can use the same sub type id.)
         */

        // Example: add two "motion sensor" services to the accessory
        // const motionSensorOneService = this.accessory.getService('Motion Sensor One Name') ||
        // this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');

        // const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name') ||
        // this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');

        /**
         * Updating characteristics values asynchronously.
         * 
         * Example showing how to update the state of a Characteristic asynchronously instead
         * of using the `on('get')` handlers.
         * Here we change update the motion sensor trigger states on and off every 10 seconds
         * the `updateCharacteristic` method.
         * 
         */
        // let motionDetected = false;
        // setInterval(() => {
        //     // EXAMPLE - inverse the trigger
        //     motionDetected = !motionDetected;

        //     // push the new value to HomeKit
        //     motionSensorOneService.updateCharacteristic(this.platform.Characteristic.MotionDetected, motionDetected);
        //     motionSensorTwoService.updateCharacteristic(this.platform.Characteristic.MotionDetected, !motionDetected);

        //     this.platform.log.debug('Triggering motionSensorOneService:', motionDetected);
        //     this.platform.log.debug('Triggering motionSensorTwoService:', !motionDetected);
        // }, 10000);
    }

    /**
     * Handle "SET" requests from HomeKit
     * These are sent when the user changes the state of an accessory, for example, changing the Brightness
     */
    setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {

        // implement your own code to set the brightness
        this.platform.log.debug('Set Characteristic Brightness -> ', value);

        const req = this.ditoo.createRequest('brightness');
        req.brightness = value as number;
        req.messages.asBinaryBuffer().forEach(buffer => {
            this.platform.log.info('writing buffer', buffer);
            this.btSerialPort.write(buffer, err => {
                if (err) {
                    console.log(err);
                }
            });
        });


        // you must call the callback function
        callback(null);
    }

}
