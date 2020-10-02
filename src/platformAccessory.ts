import {
    PlatformAccessory,
    CharacteristicValue,
    CharacteristicSetCallback,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
} from 'homebridge';

import { DivoomHomebridgePlatform } from './platform';

import bsp from 'bluetooth-serial-port';
import * as divoom from 'node-divoom-timebox-evo';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class DivoomPlatformAccessory {
    private readonly ditoo = new divoom.TimeboxEvo();

    private isOn = true;
    private hue = 0;
    private saturation = 100;

    constructor(
        private readonly platform: DivoomHomebridgePlatform,
        private readonly accessory: PlatformAccessory,
        private readonly btSerialPort: bsp.BluetoothSerialPort,
    ) {
        const lightbulbService = this.accessory.getService(this.platform.Service.Lightbulb) ||
            this.accessory.addService(this.platform.Service.Lightbulb);

        lightbulbService.setCharacteristic(this.platform.Characteristic.Name, 'Divoom accessory');

        lightbulbService.getCharacteristic(this.platform.Characteristic.On)
            .on(CharacteristicEventTypes.SET, this.setOn.bind(this))
            .on(CharacteristicEventTypes.GET, this.getOn.bind(this));
        lightbulbService.getCharacteristic(this.platform.Characteristic.Brightness)
            .on(CharacteristicEventTypes.SET, this.setBrightness.bind(this));
        lightbulbService.getCharacteristic(this.platform.Characteristic.Hue)
            .on(CharacteristicEventTypes.SET, this.setHue.bind(this));
        lightbulbService.getCharacteristic(this.platform.Characteristic.Saturation)
            .on(CharacteristicEventTypes.SET, this.setSaturation.bind(this));

        const speakerService = this.accessory.getService(this.platform.Service.Speaker) ||
            this.accessory.addService(this.platform.Service.Speaker);
        speakerService.setCharacteristic(this.platform.Characteristic.Name, 'Divoom speaker');
        speakerService.getCharacteristic(this.platform.Characteristic.Volume)
            .on(CharacteristicEventTypes.SET, this.setVolume.bind(this));
    }

    setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.platform.log.debug('Set Characteristic On -> ', value);

        this.isOn = value as boolean;
        this.setBrightness(this.isOn ? 100 : 0, callback);
    }

    getOn(callback: CharacteristicGetCallback) {
        callback(null, this.isOn);
    }

    setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.platform.log.debug('Set Characteristic Brightness -> ', value);

        const req = this.ditoo.createRequest('brightness');
        req.brightness = value as number;
        this.sendDitooRequest(req, callback);
    }

    setHue(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.platform.log.debug('Set Characteristic Hue -> ', value);

        this.hue = value as number;
        this.updateColorAndShowTime(callback);
    }

    setSaturation(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.platform.log.debug('Set Characteristic Saturation -> ', value);

        this.saturation = value as number;
        this.updateColorAndShowTime(callback);
    }

    setVolume(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        this.platform.log.warn('Set Characteristic Volume -> ', value);

        const volume = Math.round((value as number) / 100 * 16);
        const req = this.ditoo.createRequest('volume');
        req.volume = volume;
        this.sendDitooRequest(req, callback);
    }

    private updateColorAndShowTime(callback: CharacteristicSetCallback) {
        const req = this.ditoo.createRequest('time');
        req.color = { h: this.hue, s: this.saturation, v: 100 };
        this.sendDitooRequest(req, callback);
    }

    private sendDitooRequest(request: divoom.TimeboxEvoRequest, callback: CharacteristicSetCallback) {
        request.messages.asBinaryBuffer().forEach(buffer => {
            this.btSerialPort.write(buffer, err => {
                if (err) {
                    callback(err);
                    return;
                }
            });
        });

        callback(null);
    }
}
