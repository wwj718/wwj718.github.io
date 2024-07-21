console.log("MicroBlocks client");

class MicroBlocksClient {
    constructor(height, width) {
        this.MICROBLOCKS_SERVICE_UUID = "bb37a001-b922-4018-8e74-e14824b3a638"
        this.MICROBLOCKS_RX_CHAR_UUID = "bb37a002-b922-4018-8e74-e14824b3a638" // board receive characteristic
        this.MICROBLOCKS_TX_CHAR_UUID = "bb37a003-b922-4018-8e74-e14824b3a638" // board transmit characteristic
    }

    connect() {
        navigator.bluetooth.requestDevice({
            filters: [
                { services: [this.MICROBLOCKS_SERVICE_UUID] }
            ]
        }).then((device) => { window.bleDevice = device; return device.gatt.connect(); })
    }

    send(aString) {
        // console.log(aString);
        const data = new TextEncoder().encode(aString);
        let length = data.length + 1;
        let bytes = new Uint8Array([...(new Uint8Array([251, 27, 0, length % 256, parseInt((length / 256))])), ...data, ...(new Uint8Array([254]))])
        if (window.bleDevice) {
            window.bleDevice.gatt
                .getPrimaryService(this.MICROBLOCKS_SERVICE_UUID)
                .then((service) => service.getCharacteristic(this.MICROBLOCKS_RX_CHAR_UUID))
                .then((characteristic) => characteristic.writeValue(bytes))
                .catch((error) => {
                    console.log("error:" + error);
                });
        }
    }
}