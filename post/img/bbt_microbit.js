
/**
 * This extension is for use with a bbc micro:bit running firmware from
 * BirdBrain Technologies. Get the latest at
 * https://www.birdbraintechnologies.com/downloads/installers/BBTFirmware.hex
 */


var robots = [] //Robot array representing all currently known robots

/**
 * findAndConnect - Opens the chrome device chooser and connects to the chosen
 * device if it is of a recognized type.
 */
function findAndConnect(devLetter) {
  /*
  let bleFilters = [
    { namePrefix: "MB", services: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"] }
  ]*/
  let SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  // navigator.bluetooth.requestDevice({ filters: bleFilters }).then(device => {
   navigator.bluetooth.requestDevice({ 
    acceptAllDevices: true,
    optionalServices: [SERVICE_UUID]
    }).then(device => {
      //Note: If a robot changes name from one scan to the next, this
      // device.name property still remains the same. The app must be reloaded
      // to see the new name.
      console.log("Connecting to " + device.name)

      let robot = getRobotByName(device.name)
      if (robot == null) {
        robot = new Robot(device)
        robots.push(robot);
      }

      if (!robot.isConnected) {
        robot.devLetter = devLetter
        connectToRobot(robot)
      } else {
        const monitorCell = window.birdbrain.mbMonitor[robot.devLetter].cells[1];
        monitorCell.appendChild(robot.connectButton)

        window.birdbrain.handleMessage({
          robot: robot.devLetter,
          connectionLost: true
        });
        robot.devLetter = devLetter

        onConnectionComplete(robot)
      }

    }).catch(error => {
      console.error("Error requesting device: " + error.message)
    })
}

function connectToRobot(robot) {

  let device = robot.device

  //Get a notification if this device disconnects.
  device.addEventListener('gattserverdisconnected', onDisconnected);
  //Attempt to connect to remote GATT Server.
  device.gatt.connect().then(server => {
      // Get the Service
      return server.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");
    })
    .then(service => {
      // Get receiving Characteristic
      service.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca9e")
        .then(characteristic => characteristic.startNotifications())
        .then(characteristic => {
          characteristic.addEventListener('characteristicvaluechanged',
            onCharacteristicValueChanged);
          robot.RX = characteristic;
          if (robot.TX != null) {
            onConnectionComplete(robot);
          }
        })
        .catch(error => {
          console.error("Failed to get RX: " + error.message);
        });

      // Get sending Characteristic
      service.getCharacteristic("6e400002-b5a3-f393-e0a9-e50e24dcca9e")
        .then(characteristic => {
          robot.TX = characteristic;
          if (robot.RX != null) {
            onConnectionComplete(robot);
          }
        })
        .catch(error => {
          console.error("Failed to get TX: " + error.message);
        });

    })
    .catch(error => {
      console.error("Device request failed: " + error.message);
    });
}

/**
 * onConnectionComplete - Called when a device has been connected and its RX
 * and TX characteristics discovered. Starts polling for sensor data, adds the
 * device to the array of connected robots, and loads the snap iframe.
 */
function onConnectionComplete(robot) {
  if (robot == null || robot.RX == null || robot.TX == null) {
    console.error("onConnectionComplete: incomplete connection");
    robot = null
    return;
  }

  robot.initialize()

  if (!robots.includes(robot)) { robots.push(robot) }

  //Add this connection to the monitor
  const monitorCell = window.birdbrain.mbMonitor[robot.devLetter].cells[1];
  robot.connectButton = monitorCell.removeChild(monitorCell.firstChild);
  robot.calibrateButton.onclick = function() {
    SnapExtensions.primitives.get('bbt_calibrate(robot)').apply(
          this,
          [robot.devLetter]
    );
  }
  robot.disconnectButton.onclick = function() {
    SnapExtensions.primitives.get('bbt_disconnect(robot)').apply(
          this,
          [robot.devLetter]
    );
  }
  monitorCell.appendChild(robot.display);
}

/**
 * onDisconnected - Handles robot disconnection events.
 *
 * @param  {Object} event Disconnection event
 */
function onDisconnected(event) {
  let device = event.target;
  for (let i = 0; i < robots.length; i++) {
    if (robots[i].device.name == device.name && robots[i].isConnected) {
      robots[i].externalDisconnect();
    }
  }
}

/**
 * onCharacteristicValueChanged - Handles characteristic value changes. This is
 * called when there is a sensor notification. Passes the data to the snap
 * iframe if available, and updates the device's Robot object.
 *
 * @param  {Object} event Characteristic value change event
 */
function onCharacteristicValueChanged(event) {
  var dataArray = new Uint8Array(event.target.value.buffer);
  var deviceName = event.target.service.device.name;
  const robot = getRobotByName(deviceName)
  if (robot != null && dataArray != null) {
    robot.receiveSensorData(dataArray)
  }
}

/**
 * getRobotByName - Returns the Robot with the given device name or null if no
 * device with that name is found.
 *
 * @param  {string} name Robot's advertised name
 * @return {?Robot}      Robot found or null if not found
 */
function getRobotByName(name) {
  for (let i = 0; i < robots.length; i++) {
    if (robots[i].device.name === name) {
      return robots[i]
    }
  }
  return null
}

/**
 * getRobotByLetter - Returns the Robot associated with the given device letter
 * (A, B, or C), or null if there is none.
 *
 * @param  {string} letter Character id to look for (A, B, or C)
 * @return {?Robot}        Robot identified by the given letter, or null if none is found
 */
function getRobotByLetter(letter) {
  for (let i = 0; i < robots.length; i++) {
    if (robots[i].devLetter === letter) {
      return robots[i]
    }
  }
  return null
}

/**
 * getNextDevLetter - Returns the next available id letter starting with A and
 * ending with C. Max 3 connections.
 *
 * @return {?string}  Next available id letter of null if they are all taken
 */
function getNextDevLetter() {
  let letter = 'A';
  if (!devLetterUsed(letter)) {
    return letter;
  } else {
    letter = 'B'
    if (!devLetterUsed(letter)) {
      return letter;
    } else {
      letter = 'C'
      if (!devLetterUsed(letter)) {
        return letter;
      } else {
        return null
      }
    }
  }
}

/**
 * devLetterUsed - Checks to see if any of the currently connected robots are
 * using the given id letter.
 *
 * @param  {string} letter Letter to check for
 * @return {boolean}       True if the letter is currently being used.
 */
function devLetterUsed(letter) {
  let letterFound = false;
  for (let i = 0; i < robots.length; i++) {
    if (robots[i].devLetter == letter) { letterFound = true; }
  }
  return letterFound;
}

///////////////////////////////////


/**
 * An instantiation of the Robot class represents one connected micro:bit.
 */

const MIN_SET_ALL_INTERVAL = 10;
const MAX_LED_PRINT_WORD_LEN = 10;
const INITIAL_LED_DISPLAY_ARRAY = Array(MAX_LED_PRINT_WORD_LEN + 2).fill(0);

/**
 * Robot - Initializer called when a new robot is connected.
 *
 * @param  {Object} device    Device object from navigator.bluetooth
 */
function Robot(device) {
  this.device = device;
  this.devLetter = "X";
  this.fancyName = getDeviceFancyName(device.name);
  this.RX = null; //receiving
  this.TX = null; //sending
  this.writeMethod = null; //Once TX is set we can determine whether we can use writeValueWithoutResponse
  this.displayElement = null;
  this.writeInProgress = false;
  this.dataQueue = [];
  this.printTimer = null;
  this.isCalibrating = false;
  this.setAllTimeToAdd = 0;
  this.isConnected = false;
  this.userDisconnected = false;
  this.currentSensorData = [];
  this.hasStartedInitialization = false;
  this.isInitialized = false;
  this.hasV2Microbit = false;

  //micro:bit specific properties
  this.setAllLetter = 0x90;
  this.setAllLength = 8;
  this.triLedCount = 0;
  this.buzzerIndex = 1;
  this.buzzerBytes = 5;
  this.pinModeIndex = 4;
  this.stopCommand = new Uint8Array([0xCB, 0xFF, 0xFF, 0xFF]);
  this.calibrationCommand = new Uint8Array([0xCE, 0xFF, 0xFF, 0xFF]);
  this.calibrationIndex = 7;
  this.getFirmwareCommand = new Uint8Array([0xCF])

  //micro:bit monitor
  this.connectButton = null;
  this.calibrateButton = document.createElement('button');
  //this.calibrateButton.setAttribute("style", "background-color: #B691BB")
  this.calibrateButton.innerText = "calibrate";
  this.disconnectButton = document.createElement('button');
  //this.disconnectButton.setAttribute("style", "background-color: #F03602")
  this.disconnectButton.innerText = "✕";
  const nameDisplay = document.createElement('span');
  nameDisplay.innerText = this.fancyName;
  this.display = document.createElement('table');
  const cell0 = this.display.insertRow(0).insertCell(0);
  cell0.appendChild(nameDisplay);
  const cell1 = this.display.insertRow(1).insertCell(0);
  cell1.appendChild(this.calibrateButton);
  cell1.appendChild(this.disconnectButton);
}

Robot.prototype.initialize = function() {

  if (this.hasStartedInitialization) {
    console.log(this.fancyName + " initialization in progress or complete.")
    return;
  }
  this.hasStartedInitialization = true;

  if ("writeValueWithoutResponse" in this.TX) { //Available in Chrome 85+
    this.writeMethod = this.TX.writeValueWithoutResponse
    console.log("Using writeValueWithoutResponse")
  } else {
    this.writeMethod = this.TX.writeValue
    console.log("Using writeValue")
  }

  //Robot state arrays
  this.initializeDataArrays();
  this.isConnected = true;
  this.userDisconnected = false;

  //Read the current robot's firmware version to determine if it includes a V2 micro:bit
  this.write(this.getFirmwareCommand)
}

/**
 * Robot.prototype.initializeDataArrays - Set all data arrays to initial values.
 * States starting with 'old' represent the last state sent to the robot and
 * should not be modified. Other arrays represent the next state to be sent and
 * should be modified using updateData.
 */
Robot.prototype.initializeDataArrays = function() {
  var array = Array(this.setAllLength).fill(0);
  array[0] = this.setAllLetter;
  this.setAllData = new RobotData(array);
  this.ledDisplayData = new RobotData(INITIAL_LED_DISPLAY_ARRAY);
}

/**
 * Robot.prototype.startSetAll - Start the timer that periodically sends data
 * to the robot. Stops the current timer if one is running.
 */
Robot.prototype.startSetAll = function() {
  if (this.setAllInterval != null) {
    clearInterval(this.setAllInterval)
  }

  let interval = MIN_SET_ALL_INTERVAL + this.setAllTimeToAdd
  this.setAllInterval = setInterval( this.sendSetAll.bind(this), interval );
}

/**
 * Robot.prototype.increaseSetAllInterval - Increase the interval in which
 * data is sent to the robot and restart the timer.
 */
Robot.prototype.increaseSetAllInterval = function() {
  this.setAllTimeToAdd += 10;
  this.startSetAll();
}

/**
 * Robot.prototype.decreaseSetAllInterval - Decreases the interval in which
 * data is sent to the robot and restart the timer.
 */
Robot.prototype.decreaseSetAllInterval = function() {
  this.setAllTimeToAdd -= 5;
  this.startSetAll();
}

/**
 * Robot.prototype.setDisconnected - Set variables on disconnect.
 */
Robot.prototype.setDisconnected = function() {
  this.RX = null
  this.TX = null
  if (this.setAllInterval != null) {
    clearInterval(this.setAllInterval)
  }
  //remove the display and replace the connect button.
  console.log("set disconnected.")
  const monitorCell = window.birdbrain.mbMonitor[this.devLetter].cells[1];
  while (monitorCell.hasChildNodes()) {
    monitorCell.removeChild(monitorCell.firstChild);
  }
  monitorCell.appendChild(this.connectButton)
  this.connectButton = null;

  this.isConnected = false;
  this.hasStartedInitialization = false;
  this.isInitialized = false;

  window.birdbrain.handleMessage({
    robot: this.devLetter,
    connectionLost: true
  });
  this.devLetter = "X"
}

/**
 * Robot.prototype.disconnect - Disconnect this robot and remove it from the
 * list.
 */
Robot.prototype.userDisconnect = function() {
  this.userDisconnected = true;
  this.setDisconnected()
  this.device.gatt.disconnect();
}

/**
 * Robot.prototype.externalDisconnect - Called when the robot disconnects
 * (rather than the user disconnecting through the app)
 */
Robot.prototype.externalDisconnect = function() {
  this.setDisconnected()
}

/**
 * Robot.prototype.write - Send data to the physical robot over ble.
 *
 * @param  {Uint8Array} data The data to send
 */
Robot.prototype.write = function(data) {
  if (this.TX == null) {
    console.error("No TX set for " + this.fancyName);
    return;
  }

  if (this.writeInProgress) {
    //console.log("Write already in progress. data = " + data)
    if (data != null) {
      this.dataQueue.push(data);
    }
    setTimeout(function() {
      //console.log("Timeout. data queue length = " + this.dataQueue.length);
      this.write()
    }.bind(this), MIN_SET_ALL_INTERVAL);
    return;
  }

  this.writeInProgress = true;
  if (this.dataQueue.length != 0) {
    if (data != null) { this.dataQueue.push(data); }
    data = this.dataQueue.shift();
    if (this.dataQueue.length > 10) {
      this.increaseSetAllInterval();
    }
  }
  if((this.dataQueue.length < 7) && (this.setAllTimeToAdd > 0)) {
    this.decreaseSetAllInterval();
  }

  this.writeMethod.call(this.TX, data).then(_ => {
      console.log('Wrote to ' + this.fancyName + ": [" + (data.length == 1 ? data[0] : Array.apply([], data).join(",")) + "]")
      this.writeInProgress = false;
    }).catch(error => {
      console.error("Error writing to " + this.fancyName + ": " + error);
      this.writeInProgress = false;
    });

}

/**
 * Robot.prototype.sendSetAll - Send the next state to the robot if it differs
 * from the current state. Called periodically (ever SET_ALL_INTERVAL ms) with
 * a setInterval set up in the initializer (setAllInterval).
 */
Robot.prototype.sendSetAll = function() {
  if (this.setAllData.isNew) {
    const data = this.setAllData.getSendable();
    this.clearBuzzerBytes();
    this.write(data);
  }

  //in another half cycle, check to see if the other data needs to be sent
  setTimeout(function() {
    if (this.ledDisplayData.isNew) {
      const data = this.ledDisplayData.getSendable();
      if (data[1] != 0x80 && data[1] != 0) {
        this.ledDisplayData.reset(); //reset after flash command
      }
      this.write(data);
    }
  }.bind(this), MIN_SET_ALL_INTERVAL/2)
}

/**
 * Robot.prototype.setBuzzer - Set the buzzer.
 *
 * @param  {number} note     Midi note to play
 * @param  {number} duration Duration of the sound in ms
 */
Robot.prototype.setBuzzer = function(note, duration) {
  let frequency = 440 * Math.pow(2, (note - 69)/12)
  let period = (1/frequency) * 1000000

  let buzzerArray = [period >> 8, period & 0x00ff, duration >> 8, duration & 0x00ff]
  //micro:bit specific - add mode byte.
  //buzzerArray.splice(3, 0, 0x20)
  let mode = this.setAllData[this.pinModeIndex];
  buzzerArray.splice(3, 0, (mode & 0x0f) | 0x20)

  this.setAllData.update(this.buzzerIndex, buzzerArray)
}

/**
 * Robot.prototype.setPin - Set an individual pin output value.
 * Micro:bit I/O :
 * 0x90, FrequencyMSB, FrequencyLSB, Time MSB, Mode, Pad0_value, Pad1_value, Pad2_value
 * Frequency is valid for only pin 0
 *
 * Mode 8 bits:
 * NA, NA, P0_Mode_MSbit, P0_Mode_LSbit, P1_Mode_MSbit, P1_Mode_MSbit, P2_Mode_MSbit, P2_Mode_LSbit
 * Write mode: 00
 * Read mode: 01
 * Buzzer mode (pin 0 only): 10
 *
 * @param {number} pin      micro:bit pin to set (0, 1, or 2)
 * @param {number} percent  Value pin should be set to (0 - 100)
 */
Robot.prototype.setPin = function(pin, percent) {

  let array = this.setAllData.values.slice(this.pinModeIndex, this.pinModeIndex + 4)
  array[pin + 1] = percent * 255/100;
  let mode = array[0];

  //set the bits for the given pin to 00
  switch (pin) {
    case 0:
      mode = mode & 0x0f
      break;
    case 1:
      mode = mode & 0x33
      break;
    case 2:
      mode = mode & 0x3c
      break;
  }
  array[0] = mode;
  console.log("set pin " + pin + " to " + percent + " -> " + array);

  this.setAllData.update(this.pinModeIndex, array)
}

/**
 * Robot.prototype.setPinRead - Set an individual pin to read mode.
 *
 * @param {number} pin      micro:bit pin to set (0, 1, or 2)
 */
Robot.prototype.setPinRead = function(pin) {
  let mode = this.setAllData.values[this.pinModeIndex];

  //set the bits for the given pin to 01
  switch (pin) {
    case 0:
      mode = mode | 0x10
      break;
    case 1:
      mode = mode | 0x04
      break;
    case 2:
      mode = mode | 0x01
      break;
  }
  console.log("set pin " + pin + " to read mode -> " + mode);

  this.setAllData.update(this.pinModeIndex, [mode])
}

/**
 * Robot.prototype.clearBuzzerBytes - Clear the data bytes for the buzzer so
 * that a note is only sent to the robot once.
 */
Robot.prototype.clearBuzzerBytes = function() {
  if ((this.setAllData.values[this.pinModeIndex] & 0x20) == 0x20) { //micro:bit specific.
    this.setAllData.reset(this.buzzerIndex, this.buzzerIndex + this.buzzerBytes);
  }
}

/**
 * Robot.prototype.setSymbol - Set the led display to a symbol specified by a
 * string of true/false statements - one for each led in the display.
 *
 * @param  {string} symbolString String representation of the symbol to display
 */
Robot.prototype.setSymbol = function(symbolString) {
  //If a string of text is printing on the display, we must interupt it.
  if (this.printTimer !== null) { clearTimeout(this.printTimer); }

  let data = [];
  data[0] = 0xCC
  data[1] = 0x80 //set symbol
  const sa = symbolString.split("/")
  let iData = 2
  let shift = 0

  //Convert the true/false or bit string to bits. Requires 4 data bytes.
  for (let i = 24; i >= 0; i--) {
    let bit = false;
    bit = ( sa[i] == "true" )
    data[iData] = bit ? (data[iData] | (1 << shift)) : (data[iData] & ~(1 << shift));
    if (shift == 0) {
      shift = 7
      iData += 1
    } else {
      shift -= 1
    }
  }

  this.ledDisplayData.update(0, data);
}

/**
 * Robot.prototype.setPrint - Print out a string on the led display
 *
 * @param  {Array.string} printChars Array of single characters to print
 */
Robot.prototype.setPrint = function(printChars) {
  //If a string of text is printing on the display, we must interupt it.
  if (this.printTimer !== null) { clearTimeout(this.printTimer); }

  //Only MAX_LED_PRINT_WORD_LEN characters can be sent to the robot at once
  if (printChars.length > MAX_LED_PRINT_WORD_LEN) {
    let nextPrintChars = printChars.slice(MAX_LED_PRINT_WORD_LEN, printChars.length);
    this.printTimer = setTimeout (function () {
      this.setPrint(nextPrintChars);
    }.bind(this), MAX_LED_PRINT_WORD_LEN * 600);  // number of chars * 600ms per char

    printChars = printChars.slice(0, MAX_LED_PRINT_WORD_LEN);
  }

  let data = [];
  data[0] = 0xCC
  data[1] = printChars.length | 0x40;

  for (var i = 0; i < printChars.length; i++) {
    data[i+2] = printChars[i].charCodeAt(0);
  }

  this.ledDisplayData.update(0, data);
}

/**
 * Robot.prototype.stopAll - Stop all robot actions and reset states.
 */
Robot.prototype.stopAll = function() {
  if (this.printTimer !== null) { clearTimeout(this.printTimer); }
  this.write(this.stopCommand);
  this.initializeDataArrays();
}

/**
 * Robot.prototype.startCalibration - Send the robot a command to start
 * magnetometer calibration. (required for magnetometer and compass blocks)
 */
Robot.prototype.startCalibration = function() {
  this.write(this.calibrationCommand);
  //It takes a bit for the robot to start calibrating
  setTimeout(() => { this.isCalibrating = true; }, 500);
}

/**
 * Robot.prototype.receiveSensorData - Called when the robot updates its sensor
 * data. This function will update the battery value and check the calibration
 * state
 *
 * @param  {Uint8Array} data Incoming data
 */
Robot.prototype.receiveSensorData = function(data) {
  if (!this.isInitialized) {
    //This data is the response to the get firmware version command.
    this.hasV2Microbit = data[3] == 0x22

    //Start polling sensors
    var pollStart = Uint8Array.of(0x62, 0x67);
    if (this.hasV2Microbit) {
      console.log(this.fancyName + " is a V2 micro:bit")
      //trigger V2 specific notifications
      pollStart = Uint8Array.of(0x62, 0x70);
    } else {
      console.log(this.fancyName + " is not a V2 micro:bit")
    }
    var pollStop = Uint8Array.of(0x62, 0x73);
    this.write(pollStart);

    //Start the setAll timer
    this.startSetAll();
    this.isInitialized = true
    return
  }

  this.currentSensorData = data

  window.birdbrain.handleMessage({
    robot: this.devLetter,
    robotType: 3,
    sensorData: data,
    hasV2Microbit: this.hasV2Microbit
  });

  if (this.isCalibrating) {
    const calibrationByte = data[this.calibrationIndex];
    switch(calibrationByte & 0x0C) { //0x0C = 0000 1100
      case 4: //calibration success
        this.isCalibrating = false;
        break;
      case 8: //calibration failure
        this.isCalibrating = false;
    }
  }
}

///////////////////////////////////


/**
 * RobotData - Data set ready to send to a robot when changed.
 *
 * @param  {[number]} initialValues values to initialize the data set with
 */
function RobotData(initialValues) {
  this.values = new Uint8Array(initialValues);
  this.oldValues = this.values.slice();
  this.originalValues = this.values.slice();
  this.isNew = true;
  this.length = initialValues.length;
  this.pendingChanges = [];
}

/**
 * RobotData - Compare two value arrays
 *
 * @param  {Uint8Array} data1 first array to compare
 * @param  {Uint8Array} data2 second array to compare
 * @return {boolean}          true if data is same in both arrays
 */
RobotData.isEqual = function(data1, data2) {

  if (data1.length != data2.length) { return false; }

  var equal = true;
  for (var i = 0; i < data1.length; i++) {
    if (data1[i] != data2[i]) { equal = false; }
  }

  return equal;
}


/**
 * RobotData.prototype.segmentHasChanged - Determines whether a specified
 * portion of the data has changed.
 *
 * @param  {number} startIndex position to start the check
 * @param  {number} length     number of values to check
 * @return {boolean}           true if the specified portion of the data has changed
 */
RobotData.prototype.segmentHasChanged = function(startIndex, length) {
  var hasChanged = false;
  for (var i = 0; i < length; i++) {
    if (this.values[startIndex + i] != this.oldValues[startIndex + i]) {
      hasChanged = true;
    }
  }
  return hasChanged;
}

/**
 * RobotData.prototype.update - Update the data with new values
 *
 * @param  {type} startIndex position in the value array to start the update
 * @param  {type} valueArray new values
 */
RobotData.prototype.update = function(startIndex, valueArray) {

  //values must be between 0 and 255
  for(let i = 0; i < valueArray.length; i++) {
    if (valueArray[i] < 0 || valueArray[i] > 255) {
      console.error("updateData invalid value: " + value);
      return;
    }
  }

  //make sure the index is not out of bounds
  if (startIndex < 0 || (startIndex + valueArray.length) > this.length) {
    console.error("updateData invalid index: " + startIndex);
    return;
  }

  this.pendingChanges.push({startIndex: startIndex, valueArray: valueArray});
  this.updatePending();
}

/**
 * RobotData.prototype.updatePending - Performs the next update in the queue if
 * possible. Called after each change is received to see if the update can be
 * made immediately, and called after each write to see if there are more
 * changes pending. Also called if an update is successfully made to see if the
 * next change can be made as well.
 */
RobotData.prototype.updatePending = function() {
  if (this.pendingChanges.length == 0) {
    return;
  } else if (this.pendingChanges.length > 10) {
    for (let i = 0; i < 2; i++) {
      this.pendingChanges.shift();
    }
  }

  //if the existing data hasn't been sent to the robot yet...
  if (this.isNew) {
    //check if the segment in question needs to be sent
    const next = this.pendingChanges[0];
    const hasChanged = this.segmentHasChanged(next.startIndex, next.valueArray.length);
    //if a change to this section is waiting to be sent, we cannot make this next change now.
    if (hasChanged) {
      console.log("cannot update pending changes at this time.")
      return;
    }
  }

  const nextChange = this.pendingChanges.shift();
  let newData = this.values.slice();
  for(let i = 0; i < nextChange.valueArray.length; i++) {
    newData[nextChange.startIndex + i] = nextChange.valueArray[i];
  }

  if (!RobotData.isEqual(this.values, newData)) {
    this.length = newData.length;
    this.values = newData;
    this.isNew = true;
  }

  this.updatePending(); //See if there is another change we can add.
}

/**
 * RobotData.prototype.reset - Returns all or a portion of the data to its
 * original values.
 *
 * @param  {number} startIndex Start the reset at this index (or 0 if null)
 * @param  {number} length     Length of the section to reset (or reset everything if null)
 */
RobotData.prototype.reset = function(startIndex, length) {
  if (startIndex == null || length == null) {
    this.values = this.originalValues.slice();
    this.oldValues = this.originalValues.slice();
  } else {
    for (let i = 0; i < length; i++) {
      this.values[startIndex + i] = this.originalValues[startIndex + i];
      this.oldValues[startIndex + i] = this.originalValues[startIndex + i];
    }
  }
}

/**
 * RobotData.prototype.getSendable - Returns a Uint8Array of values to send to
 * the robot. Saves a copy of these values for comparison, or resets the data
 * if necessary. The data is now no longer new, and the next update is
 * performed if there is one.
 *
 * @param  {boolean} reset True if the data should be reset after sending. Used for motor data and print arrays so that the same command can be sent again (but is not sent accidentially)
 * @return {Uint8Array}    Data array ready to be sent to the robot
 */
RobotData.prototype.getSendable = function(reset) {
  const sendable = this.values.slice();
  if (reset) {
    this.reset();
  } else {
    this.oldValues = sendable.slice();
  }
  this.isNew = false;
  this.updatePending();
  return sendable;
}

///////////////////////////////////


/**
 * Handle assigning fancy names to connected robots.
 */

 /**
  * Array of names to choose from. One name will be chosen from each column.
  */
const fancyNameArray = [
  ['Adorable', 'Amber', 'Beaver'],
  ['Adventurous', 'Amethyst', 'Bee'],
  ['Agile', 'Apricot', 'Canary'],
  ['Amazing', 'Arboreal', 'Cat'],
  ['Ancient', 'Arctic', 'Catfish'],
  ['Artistic', 'Banana', 'Centaur'],
  ['Astounding', 'Blue', 'Chicken'],
  ['Athletic', 'Brass', 'Coyote'],
  ['Awesome', 'Cave', 'Cricket'],
  ['Beautiful', 'Celestial', 'Dinosaur'],
  ['Benevolent', 'Citrine', 'Dog'],
  ['Big', 'Cloud', 'Dolphin'],
  ['Blazing', 'Cobalt', 'Dragon'],
  ['Blissful', 'Copper', 'Dragonfly'],
  ['Blushing', 'Crystal', 'Eagle'],
  ['Bold', 'Desert', 'Elephant'],
  ['Bouncy', 'Diamond', 'Falcon'],
  ['Breezy', 'Emerald', 'Flamingo'],
  ['Bright', 'Fire', 'Fox'],
  ['Brilliant', 'Forest', 'Giraffe'],
  ['Bubbly', 'Fuchsia', 'Grasshopper'],
  ['Bumpy', 'Gold', 'Griffin'],
  ['Busy', 'Gray', 'Hamster'],
  ['Calm', 'Green', 'Hawk'],
  ['Camouflaged', 'Indigo', 'Hippogriff'],
  ['Carefree', 'Jade', 'Hippopotamus'],
  ['Caring', 'Jungle', 'Horse'],
  ['Carnivorous', 'Lava', 'Inchworm'],
  ['Charming', 'Lavender', 'Kitten'],
  ['Cheerful', 'Lightning', 'Kraken'],
  ['Cheesy', 'Lime', 'Lemur'],
  ['Classy', 'Magenta', 'Leopard'],
  ['Colossal', 'Maroon', 'Lion'],
  ['Comfortable', 'Moonstone', 'Lizard'],
  ['Cool', 'Mountain', 'Manatee'],
  ['Corny', 'Navy', 'Monkey'],
  ['Courageous', 'Ocean', 'Narwhal'],
  ['Cozy', 'Olive', 'Octopus'],
  ['Crawling', 'Onyx', 'Parrot'],
  ['Crazy', 'Opal', 'Phoenix'],
  ['Creative', 'Orange', 'Platypus'],
  ['Cuddly', 'Pearl', 'Pony'],
  ['Cunning', 'Pink', 'Porcupine'],
  ['Dainty', 'Platinum', 'Puppy'],
  ['Dancing', 'Plum', 'Raccoon'],
  ['Dapper', 'Purple', 'Rooster'],
  ['Daring', 'Quartz', 'Seahorse'],
  ['Dark', 'Rainforest', 'Sloth'],
  ['Dashing', 'Red', 'Slug'],
  ['Delightful', 'River', 'Snail'],
  ['Deluxe', 'Ruby', 'Sphinx'],
  ['Determined', 'Sand', 'Squid'],
  ['Doubtful', 'Sapphire', 'Squirrel'],
  ['Dreaming', 'Scarlet', 'Stegosaurus'],
  ['Dry', 'Silver', 'Tiger'],
  ['Educated', 'Sky', 'Timberwolf'],
  ['Elder', 'Snow', 'Tuna'],
  ['Endearing', 'Space', 'Tyrannosaurus'],
  ['Energetic', 'Tangerine', 'Unicorn'],
  ['Engaging', 'Teal', 'Velociraptor'],
  ['Enormous', 'Titanium', 'Walrus'],
  ['Entertaining', 'Topaz', 'Whale'],
  ['Exciting', 'Violet', 'Wolf'],
  ['Extraordinary', 'Yellow', 'Zebra'],
  ['Fanciful', 'Amber', 'Beaver'],
  ['Fantastic', 'Amethyst', 'Bee'],
  ['Fast', 'Apricot', 'Canary'],
  ['Fearless', 'Arboreal', 'Cat'],
  ['Feathered', 'Arctic', 'Catfish'],
  ['Feisty', 'Banana', 'Centaur'],
  ['Feral', 'Blue', 'Chicken'],
  ['Fierce', 'Brass', 'Coyote'],
  ['Floppy', 'Cave', 'Cricket'],
  ['Fluffy', 'Celestial', 'Dinosaur'],
  ['Flying', 'Citrine', 'Dog'],
  ['Friendly', 'Cloud', 'Dolphin'],
  ['Frosty', 'Cobalt', 'Dragon'],
  ['Funny', 'Copper', 'Dragonfly'],
  ['Furry', 'Crystal', 'Eagle'],
  ['Fuzzy', 'Desert', 'Elephant'],
  ['Galactic', 'Diamond', 'Falcon'],
  ['Gargantuan', 'Emerald', 'Flamingo'],
  ['Generous', 'Fire', 'Fox'],
  ['Gentle', 'Forest', 'Giraffe'],
  ['Genuine', 'Fuchsia', 'Grasshopper'],
  ['Giant', 'Gold', 'Griffin'],
  ['Giggly', 'Gray', 'Hamster'],
  ['Ginormous', 'Green', 'Hawk'],
  ['Glacial', 'Indigo', 'Hippogriff'],
  ['Glamorous', 'Jade', 'Hippopotamus'],
  ['Gleeful', 'Jungle', 'Horse'],
  ['Glistening', 'Lava', 'Inchworm'],
  ['Glittery', 'Lavender', 'Kitten'],
  ['Glossy', 'Lightning', 'Kraken'],
  ['Glowing', 'Lime', 'Lemur'],
  ['Good', 'Magenta', 'Leopard'],
  ['Goofy', 'Maroon', 'Lion'],
  ['Gorgeous', 'Moonstone', 'Lizard'],
  ['Graceful', 'Mountain', 'Manatee'],
  ['Great', 'Navy', 'Monkey'],
  ['Groovy', 'Ocean', 'Narwhal'],
  ['Grumpy', 'Olive', 'Octopus'],
  ['Gutsy', 'Onyx', 'Parrot'],
  ['Hairy', 'Opal', 'Phoenix'],
  ['Happy', 'Orange', 'Platypus'],
  ['Heavy', 'Pearl', 'Pony'],
  ['Helpful', 'Pink', 'Porcupine'],
  ['Heroic', 'Platinum', 'Puppy'],
  ['Hidden', 'Plum', 'Raccoon'],
  ['Hopeful', 'Purple', 'Rooster'],
  ['Hopping', 'Quartz', 'Seahorse'],
  ['Huge', 'Rainforest', 'Sloth'],
  ['Humongous', 'Red', 'Slug'],
  ['Humorous', 'River', 'Snail'],
  ['Hungry', 'Ruby', 'Sphinx'],
  ['Hyper', 'Sand', 'Squid'],
  ['Icy', 'Sapphire', 'Squirrel'],
  ['Idealistic', 'Scarlet', 'Stegosaurus'],
  ['Imaginative', 'Silver', 'Tiger'],
  ['Impressive', 'Sky', 'Timberwolf'],
  ['Incredible', 'Snow', 'Tuna'],
  ['Ingenious', 'Space', 'Tyrannosaurus'],
  ['Inky', 'Tangerine', 'Unicorn'],
  ['Innovative', 'Teal', 'Velociraptor'],
  ['Inspiring', 'Titanium', 'Walrus'],
  ['Intellectual', 'Topaz', 'Whale'],
  ['Interesting', 'Violet', 'Wolf'],
  ['Interstellar', 'Yellow', 'Zebra'],
  ['Intrepid', 'Amber', 'Beaver'],
  ['Itty-Bitty', 'Amethyst', 'Bee'],
  ['Jazzy', 'Apricot', 'Canary'],
  ['Jiggly', 'Arboreal', 'Cat'],
  ['Joking', 'Arctic', 'Catfish'],
  ['Jovial', 'Banana', 'Centaur'],
  ['Joyful', 'Blue', 'Chicken'],
  ['Jumpy', 'Brass', 'Coyote'],
  ['Lacy', 'Cave', 'Cricket'],
  ['Large', 'Celestial', 'Dinosaur'],
  ['Laughing', 'Citrine', 'Dog'],
  ['Lazy', 'Cloud', 'Dolphin'],
  ['Leafy', 'Cobalt', 'Dragon'],
  ['Light', 'Copper', 'Dragonfly'],
  ['Lively', 'Crystal', 'Eagle'],
  ['Long', 'Desert', 'Elephant'],
  ['Loony', 'Diamond', 'Falcon'],
  ['Loud', 'Emerald', 'Flamingo'],
  ['Lovely', 'Fire', 'Fox'],
  ['Loyal', 'Forest', 'Giraffe'],
  ['Lucky', 'Fuchsia', 'Grasshopper'],
  ['Lyrical', 'Gold', 'Griffin'],
  ['Magical', 'Gray', 'Hamster'],
  ['Magnetic', 'Green', 'Hawk'],
  ['Majestic', 'Indigo', 'Hippogriff'],
  ['Marvelous', 'Jade', 'Hippopotamus'],
  ['Masterful', 'Jungle', 'Horse'],
  ['Mega', 'Lava', 'Inchworm'],
  ['Merry', 'Lavender', 'Kitten'],
  ['Metallic', 'Lightning', 'Kraken'],
  ['Micro', 'Lime', 'Lemur'],
  ['Mighty', 'Magenta', 'Leopard'],
  ['Mini', 'Maroon', 'Lion'],
  ['Mischievous', 'Moonstone', 'Lizard'],
  ['Muscular', 'Mountain', 'Manatee'],
  ['Musical', 'Navy', 'Monkey'],
  ['Mutant', 'Ocean', 'Narwhal'],
  ['Mysterious', 'Olive', 'Octopus'],
  ['Mythical', 'Onyx', 'Parrot'],
  ['Nice', 'Opal', 'Phoenix'],
  ['Nocturnal', 'Orange', 'Platypus'],
  ['Noticeable', 'Pearl', 'Pony'],
  ['Optimistic', 'Pink', 'Porcupine'],
  ['Outdoorsy', 'Platinum', 'Puppy'],
  ['Painted', 'Plum', 'Raccoon'],
  ['Patient', 'Purple', 'Rooster'],
  ['Peaceful', 'Quartz', 'Seahorse'],
  ['Perfect', 'Rainforest', 'Sloth'],
  ['Persistent', 'Red', 'Slug'],
  ['Pigmy', 'River', 'Snail'],
  ['Playful', 'Ruby', 'Sphinx'],
  ['Polite', 'Sand', 'Squid'],
  ['Powerful', 'Sapphire', 'Squirrel'],
  ['Quick', 'Scarlet', 'Stegosaurus'],
  ['Quiet', 'Silver', 'Tiger'],
  ['Quirky', 'Sky', 'Timberwolf'],
  ['Random', 'Snow', 'Tuna'],
  ['Remarkable', 'Space', 'Tyrannosaurus'],
  ['Righteous', 'Tangerine', 'Unicorn'],
  ['Robotic', 'Teal', 'Velociraptor'],
  ["Rockin'", 'Titanium', 'Walrus'],
  ['Rough', 'Topaz', 'Whale'],
  ['Round', 'Violet', 'Wolf'],
  ['Royal', 'Yellow', 'Zebra'],
  ['Running', 'Amber', 'Beaver'],
  ['Scaly', 'Amethyst', 'Bee'],
  ['Scary', 'Apricot', 'Canary'],
  ['Shadowy', 'Arboreal', 'Cat'],
  ['Shiny', 'Arctic', 'Catfish'],
  ['Shy', 'Banana', 'Centaur'],
  ['Singing', 'Blue', 'Chicken'],
  ['Skating', 'Brass', 'Coyote'],
  ['Skeptical', 'Cave', 'Cricket'],
  ['Skipping', 'Celestial', 'Dinosaur'],
  ['Sleepy', 'Citrine', 'Dog'],
  ['Slippery', 'Cloud', 'Dolphin'],
  ['Slow', 'Cobalt', 'Dragon'],
  ['Small', 'Copper', 'Dragonfly'],
  ['Smiling', 'Crystal', 'Eagle'],
  ['Sneezy', 'Desert', 'Elephant'],
  ['Soaring', 'Diamond', 'Falcon'],
  ['Soft', 'Emerald', 'Flamingo'],
  ['Sparkly', 'Fire', 'Fox'],
  ['Speckled', 'Forest', 'Giraffe'],
  ['Spikey', 'Fuchsia', 'Grasshopper'],
  ['Spirited', 'Gold', 'Griffin'],
  ['Splendid', 'Gray', 'Hamster'],
  ['Spooky', 'Green', 'Hawk'],
  ['Spotted', 'Indigo', 'Hippogriff'],
  ['Spunky', 'Jade', 'Hippopotamus'],
  ['Squeaky', 'Jungle', 'Horse'],
  ['Squishy', 'Lava', 'Inchworm'],
  ['Starry', 'Lavender', 'Kitten'],
  ['Stealthy', 'Lightning', 'Kraken'],
  ['Stellar', 'Lime', 'Lemur'],
  ['Stretchy', 'Magenta', 'Leopard'],
  ['Striped', 'Maroon', 'Lion'],
  ['Strong', 'Moonstone', 'Lizard'],
  ['Super', 'Mountain', 'Manatee'],
  ['Surprised', 'Navy', 'Monkey'],
  ['Swimming', 'Ocean', 'Narwhal'],
  ['Tall', 'Olive', 'Octopus'],
  ['Tame', 'Onyx', 'Parrot'],
  ['Terrific', 'Opal', 'Phoenix'],
  ['Thorny', 'Orange', 'Platypus'],
  ['Thundering', 'Pearl', 'Pony'],
  ['Ticklish', 'Pink', 'Porcupine'],
  ['Tiny', 'Platinum', 'Puppy'],
  ['Traveling', 'Plum', 'Raccoon'],
  ['Tremendous', 'Purple', 'Rooster'],
  ['Triumphant', 'Quartz', 'Seahorse'],
  ['Truthful', 'Rainforest', 'Sloth'],
  ['Twirling', 'Red', 'Slug'],
  ['Ultra', 'River', 'Snail'],
  ['Unbelievable', 'Ruby', 'Sphinx'],
  ['Velvety', 'Sand', 'Squid'],
  ['Visionary', 'Sapphire', 'Squirrel'],
  ['Vivacious', 'Scarlet', 'Stegosaurus'],
  ['Vivid', 'Silver', 'Tiger'],
  ['Vocal', 'Sky', 'Timberwolf'],
  ['Warm', 'Snow', 'Tuna'],
  ['Wild', 'Space', 'Tyrannosaurus'],
  ['Winged', 'Tangerine', 'Unicorn'],
  ['Wise', 'Teal', 'Velociraptor'],
  ['Witty', 'Titanium', 'Walrus'],
  ['Wonderful', 'Topaz', 'Whale'],
  ['Young', 'Violet', 'Wolf'],
  ['Zealous', 'Yellow', 'Zebra'],
  ['Adorable', 'Amber', 'Beaver'],
  ['Adventurous', 'Amethyst', 'Bee'],
  ['Agile', 'Apricot', 'Canary'],
  ['Amazing', 'Arboreal', 'Cat'],
  ['Ancient', 'Arctic', 'Catfish'],
  ['Artistic', 'Banana', 'Centaur'],
  ['Astounding', 'Blue', 'Chicken'],
  ['Athletic', 'Brass', 'Coyote'],
  ['Awesome', 'Cave', 'Cricket'],
  ['Beautiful', 'Celestial', 'Dinosaur'],
  ['Benevolent', 'Citrine', 'Dog'],
  ['Big', 'Cloud', 'Dolphin'],
  ['Blazing', 'Cobalt', 'Dragon'],
  ['Blissful', 'Copper', 'Dragonfly'],
  ['Blushing', 'Crystal', 'Eagle'],
  ['Bold', 'Desert', 'Elephant'],
  ['Bouncy', 'Diamond', 'Falcon'],
  ['Breezy', 'Emerald', 'Flamingo'],
  ['Bright', 'Fire', 'Fox'],
  ['Brilliant', 'Forest', 'Giraffe'],
  ['Bubbly', 'Fuchsia', 'Grasshopper'],
  ['Bumpy', 'Gold', 'Griffin'],
  ['Busy', 'Gray', 'Hamster'],
  ['Calm', 'Green', 'Hawk'],
  ['Camouflaged', 'Indigo', 'Hippogriff'],
  ['Carefree', 'Jade', 'Hippopotamus'],
  ['Caring', 'Jungle', 'Horse'],
  ['Carnivorous', 'Lava', 'Inchworm'],
  ['Charming', 'Lavender', 'Kitten'],
  ['Cheerful', 'Lightning', 'Kraken'],
  ['Cheesy', 'Lime', 'Lemur'],
  ['Classy', 'Magenta', 'Leopard'],
  ['Colossal', 'Maroon', 'Lion'],
  ['Comfortable', 'Moonstone', 'Lizard'],
  ['Cool', 'Mountain', 'Manatee'],
  ['Corny', 'Navy', 'Monkey'],
  ['Courageous', 'Ocean', 'Narwhal'],
  ['Cozy', 'Olive', 'Octopus'],
  ['Crawling', 'Onyx', 'Parrot'],
  ['Crazy', 'Opal', 'Phoenix'],
  ['Creative', 'Orange', 'Platypus'],
  ['Cuddly', 'Pearl', 'Pony'],
  ['Cunning', 'Pink', 'Porcupine'],
  ['Dainty', 'Platinum', 'Puppy'],
  ['Dancing', 'Plum', 'Raccoon'],
  ['Dapper', 'Purple', 'Rooster'],
  ['Daring', 'Quartz', 'Seahorse'],
  ['Dark', 'Rainforest', 'Sloth'],
  ['Dashing', 'Red', 'Slug'],
  ['Delightful', 'River', 'Snail'],
  ['Deluxe', 'Ruby', 'Sphinx'],
  ['Determined', 'Sand', 'Squid'],
  ['Doubtful', 'Sapphire', 'Squirrel'],
  ['Dreaming', 'Scarlet', 'Stegosaurus'],
  ['Dry', 'Silver', 'Tiger'],
  ['Educated', 'Sky', 'Timberwolf'],
  ['Elder', 'Snow', 'Tuna'],
  ['Endearing', 'Space', 'Tyrannosaurus'],
  ['Energetic', 'Tangerine', 'Unicorn'],
  ['Engaging', 'Teal', 'Velociraptor'],
  ['Enormous', 'Titanium', 'Walrus'],
  ['Entertaining', 'Topaz', 'Whale'],
  ['Exciting', 'Violet', 'Wolf'],
  ['Extraordinary', 'Yellow', 'Zebra'],
  ['Fanciful', 'Amber', 'Beaver'],
  ['Fantastic', 'Amethyst', 'Bee'],
  ['Fast', 'Apricot', 'Canary'],
  ['Fearless', 'Arboreal', 'Cat'],
  ['Feathered', 'Arctic', 'Catfish'],
  ['Feisty', 'Banana', 'Centaur'],
  ['Feral', 'Blue', 'Chicken'],
  ['Fierce', 'Brass', 'Coyote'],
  ['Floppy', 'Cave', 'Cricket'],
  ['Fluffy', 'Celestial', 'Dinosaur'],
  ['Flying', 'Citrine', 'Dog'],
  ['Friendly', 'Cloud', 'Dolphin'],
  ['Frosty', 'Cobalt', 'Dragon'],
  ['Funny', 'Copper', 'Dragonfly'],
  ['Furry', 'Crystal', 'Eagle'],
  ['Fuzzy', 'Desert', 'Elephant'],
  ['Galactic', 'Diamond', 'Falcon'],
  ['Gargantuan', 'Emerald', 'Flamingo'],
  ['Generous', 'Fire', 'Fox'],
  ['Gentle', 'Forest', 'Giraffe'],
  ['Genuine', 'Fuchsia', 'Grasshopper'],
  ['Giant', 'Gold', 'Griffin'],
  ['Giggly', 'Gray', 'Hamster'],
  ['Ginormous', 'Green', 'Hawk'],
  ['Glacial', 'Indigo', 'Hippogriff'],
  ['Glamorous', 'Jade', 'Hippopotamus'],
  ['Gleeful', 'Jungle', 'Horse'],
  ['Glistening', 'Lava', 'Inchworm'],
  ['Glittery', 'Lavender', 'Kitten'],
  ['Glossy', 'Lightning', 'Kraken'],
  ['Glowing', 'Lime', 'Lemur'],
  ['Good', 'Magenta', 'Leopard'],
  ['Goofy', 'Maroon', 'Lion'],
  ['Gorgeous', 'Moonstone', 'Lizard'],
  ['Graceful', 'Mountain', 'Manatee'],
  ['Great', 'Navy', 'Monkey'],
  ['Groovy', 'Ocean', 'Narwhal'],
  ['Grumpy', 'Olive', 'Octopus'],
  ['Gutsy', 'Onyx', 'Parrot'],
  ['Hairy', 'Opal', 'Phoenix'],
  ['Happy', 'Orange', 'Platypus'],
  ['Heavy', 'Pearl', 'Pony'],
  ['Helpful', 'Pink', 'Porcupine'],
  ['Heroic', 'Platinum', 'Puppy'],
  ['Hidden', 'Plum', 'Raccoon'],
  ['Hopeful', 'Purple', 'Rooster'],
  ['Hopping', 'Quartz', 'Seahorse'],
  ['Huge', 'Rainforest', 'Sloth'],
  ['Humongous', 'Red', 'Slug'],
  ['Humorous', 'River', 'Snail'],
  ['Hungry', 'Ruby', 'Sphinx'],
  ['Hyper', 'Sand', 'Squid'],
  ['Icy', 'Sapphire', 'Squirrel'],
  ['Idealistic', 'Scarlet', 'Stegosaurus'],
  ['Imaginative', 'Silver', 'Tiger'],
  ['Impressive', 'Sky', 'Timberwolf'],
  ['Incredible', 'Snow', 'Tuna'],
  ['Ingenious', 'Space', 'Tyrannosaurus'],
  ['Inky', 'Tangerine', 'Unicorn'],
  ['Innovative', 'Teal', 'Velociraptor'],
  ['Inspiring', 'Titanium', 'Walrus'],
  ['Intellectual', 'Topaz', 'Whale'],
  ['Interesting', 'Violet', 'Wolf'],
  ['Interstellar', 'Yellow', 'Zebra'],
  ['Intrepid', 'Amber', 'Beaver'],
  ['Itty-Bitty', 'Amethyst', 'Bee'],
  ['Jazzy', 'Apricot', 'Canary'],
  ['Jiggly', 'Arboreal', 'Cat'],
  ['Joking', 'Arctic', 'Catfish'],
  ['Jovial', 'Banana', 'Centaur'],
  ['Joyful', 'Blue', 'Chicken'],
  ['Jumpy', 'Brass', 'Coyote'],
  ['Lacy', 'Cave', 'Cricket'],
  ['Large', 'Celestial', 'Dinosaur'],
  ['Laughing', 'Citrine', 'Dog'],
  ['Lazy', 'Cloud', 'Dolphin'],
  ['Leafy', 'Cobalt', 'Dragon'],
  ['Light', 'Copper', 'Dragonfly'],
  ['Lively', 'Crystal', 'Eagle'],
  ['Long', 'Desert', 'Elephant'],
  ['Loony', 'Diamond', 'Falcon'],
  ['Loud', 'Emerald', 'Flamingo'],
  ['Lovely', 'Fire', 'Fox'],
  ['Loyal', 'Forest', 'Giraffe'],
  ['Lucky', 'Fuchsia', 'Grasshopper'],
  ['Lyrical', 'Gold', 'Griffin'],
  ['Magical', 'Gray', 'Hamster'],
  ['Magnetic', 'Green', 'Hawk'],
  ['Majestic', 'Indigo', 'Hippogriff'],
  ['Marvelous', 'Jade', 'Hippopotamus'],
  ['Masterful', 'Jungle', 'Horse'],
  ['Mega', 'Lava', 'Inchworm'],
  ['Merry', 'Lavender', 'Kitten'],
  ['Metallic', 'Lightning', 'Kraken'],
  ['Micro', 'Lime', 'Lemur'],
  ['Mighty', 'Magenta', 'Leopard'],
  ['Mini', 'Maroon', 'Lion'],
  ['Mischievous', 'Moonstone', 'Lizard'],
  ['Muscular', 'Mountain', 'Manatee'],
  ['Musical', 'Navy', 'Monkey'],
  ['Mutant', 'Ocean', 'Narwhal'],
  ['Mysterious', 'Olive', 'Octopus'],
  ['Mythical', 'Onyx', 'Parrot'],
  ['Nice', 'Opal', 'Phoenix'],
  ['Nocturnal', 'Orange', 'Platypus'],
  ['Noticeable', 'Pearl', 'Pony'],
  ['Optimistic', 'Pink', 'Porcupine'],
  ['Outdoorsy', 'Platinum', 'Puppy'],
  ['Painted', 'Plum', 'Raccoon'],
  ['Patient', 'Purple', 'Rooster'],
  ['Peaceful', 'Quartz', 'Seahorse'],
  ['Perfect', 'Rainforest', 'Sloth'],
  ['Persistent', 'Red', 'Slug'],
  ['Pigmy', 'River', 'Snail'],
  ['Playful', 'Ruby', 'Sphinx'],
  ['Polite', 'Sand', 'Squid'],
  ['Powerful', 'Sapphire', 'Squirrel'],
  ['Quick', 'Scarlet', 'Stegosaurus'],
  ['Quiet', 'Silver', 'Tiger'],
  ['Quirky', 'Sky', 'Timberwolf'],
  ['Random', 'Snow', 'Tuna'],
  ['Remarkable', 'Space', 'Tyrannosaurus'],
  ['Righteous', 'Tangerine', 'Unicorn'],
  ['Robotic', 'Teal', 'Velociraptor'],
  ["Rockin'", 'Titanium', 'Walrus'],
  ['Rough', 'Topaz', 'Whale'],
  ['Round', 'Violet', 'Wolf'],
  ['Royal', 'Yellow', 'Zebra'],
  ['Running', 'Amber', 'Beaver'],
  ['Scaly', 'Amethyst', 'Bee'],
  ['Scary', 'Apricot', 'Canary'],
  ['Shadowy', 'Arboreal', 'Cat'],
  ['Shiny', 'Arctic', 'Catfish'],
  ['Shy', 'Banana', 'Centaur'],
  ['Singing', 'Blue', 'Chicken'],
  ['Skating', 'Brass', 'Coyote'],
  ['Skeptical', 'Cave', 'Cricket'],
  ['Skipping', 'Celestial', 'Dinosaur'],
  ['Sleepy', 'Citrine', 'Dog'],
  ['Slippery', 'Cloud', 'Dolphin'],
  ['Slow', 'Cobalt', 'Dragon'],
  ['Small', 'Copper', 'Dragonfly'],
  ['Smiling', 'Crystal', 'Eagle'],
  ['Sneezy', 'Desert', 'Elephant'],
  ['Soaring', 'Diamond', 'Falcon'],
  ['Soft', 'Emerald', 'Flamingo'],
  ['Sparkly', 'Fire', 'Fox'],
  ['Speckled', 'Forest', 'Giraffe'],
  ['Spikey', 'Fuchsia', 'Grasshopper'],
  ['Spirited', 'Gold', 'Griffin'],
  ['Splendid', 'Gray', 'Hamster'],
  ['Spooky', 'Green', 'Hawk'],
  ['Spotted', 'Indigo', 'Hippogriff'],
  ['Spunky', 'Jade', 'Hippopotamus'],
  ['Squeaky', 'Jungle', 'Horse'],
  ['Squishy', 'Lava', 'Inchworm'],
  ['Starry', 'Lavender', 'Kitten'],
  ['Stealthy', 'Lightning', 'Kraken'],
  ['Stellar', 'Lime', 'Lemur'],
  ['Stretchy', 'Magenta', 'Leopard'],
  ['Striped', 'Maroon', 'Lion'],
  ['Strong', 'Moonstone', 'Lizard'],
  ['Super', 'Mountain', 'Manatee'],
  ['Surprised', 'Navy', 'Monkey'],
  ['Swimming', 'Ocean', 'Narwhal'],
  ['Tall', 'Olive', 'Octopus'],
  ['Tame', 'Onyx', 'Parrot'],
  ['Terrific', 'Opal', 'Phoenix'],
  ['Thorny', 'Orange', 'Platypus'],
  ['Thundering', 'Pearl', 'Pony'],
  ['Ticklish', 'Pink', 'Porcupine'],
  ['Tiny', 'Platinum', 'Puppy'],
  ['Traveling', 'Plum', 'Raccoon'],
  ['Tremendous', 'Purple', 'Rooster'],
  ['Triumphant', 'Quartz', 'Seahorse'],
  ['Truthful', 'Rainforest', 'Sloth'],
  ['Twirling', 'Red', 'Slug'],
  ['Ultra', 'River', 'Snail'],
  ['Unbelievable', 'Ruby', 'Sphinx'],
  ['Velvety', 'Sand', 'Squid'],
  ['Visionary', 'Sapphire', 'Squirrel'],
  ['Vivacious', 'Scarlet', 'Stegosaurus'],
  ['Vivid', 'Silver', 'Tiger'],
  ['Vocal', 'Sky', 'Timberwolf'],
  ['Warm', 'Snow', 'Tuna'],
  ['Wild', 'Space', 'Tyrannosaurus'],
  ['Winged', 'Tangerine', 'Unicorn'],
  ['Wise', 'Teal', 'Velociraptor'],
  ['Witty', 'Titanium', 'Walrus'],
  ['Wonderful', 'Topaz', 'Whale'],
  ['Young', 'Violet', 'Wolf'],
  ['Zealous', 'Yellow', 'Zebra']
];

/**
 * Array of initials to avoid. If the chosen 3 word name will produce any of
 * these initials, it is rejected and another is assigned.
 */
const blacklistArray = ['ANL',
  'ANS',
  'ASS',
  'AZN',
  'BCH',
  'CAC',
  'CAK',
  'CAQ',
  'CLT',
  'CNT',
  'COC',
  'COK',
  'COQ',
  'CUM',
  'DCK',
  'DIC',
  'DIK',
  'DIQ',
  'DIX',
  'DMN',
  'DSH',
  'DYC',
  'DYK',
  'DYQ',
  'FAG',
  'FAP',
  'FCK',
  'FCU',
  'FGT',
  'FKU',
  'FOB',
  'FQU',
  'FTP',
  'FUC',
  'FUK',
  'FUQ',
  'FUX',
  'GAI',
  'GAY',
  'GEI',
  'GEY',
  'GIZ',
  'GUC',
  'GUK',
  'GUQ',
  'GVR',
  'GZZ',
  'HOR',
  'JAP',
  'JEW',
  'JIZ',
  'JOO',
  'JYZ',
  'JZZ',
  'KAC',
  'KAK',
  'KAQ',
  'KIK',
  'KKK',
  'KLT',
  'KNT',
  'KOC',
  'KOK',
  'KOQ',
  'KOX',
  'KUM',
  'KYC',
  'KYK',
  'KYQ',
  'LCK',
  'LIC',
  'LIK',
  'LIQ',
  'LOL',
  'LSD',
  'MFF',
  'MIC',
  'MIK',
  'MIQ',
  'MLF',
  'MUF',
  'MYC',
  'MYK',
  'MYQ',
  'NAD',
  'NDS',
  'NDZ',
  'NGR',
  'NIG',
  'NUT',
  'NWA',
  'ORL',
  'OPP',
  'PCP',
  'PHC',
  'PHK',
  'PHQ',
  'PIS',
  'PMS',
  'PNS',
  'POO',
  'POT',
  'PRC',
  'PRK',
  'PRN',
  'PRQ',
  'PSS',
  'PSY',
  'PUS',
  'RAC',
  'RAK',
  'RAQ',
  'RCK',
  'SAC',
  'SAK',
  'SAQ',
  'SCK',
  'SEX',
  'SFU',
  'SHT',
  'SJV',
  'SLT',
  'SNM',
  'SOB',
  'SOL',
  'STD',
  'SUC',
  'SUK',
  'SUQ',
  'SXE',
  'SXI',
  'SXX',
  'SXY',
  'THC',
  'TIT',
  'TOC',
  'TOK',
  'TOQ',
  'TWT',
  'VAG',
  'VAJ',
  'VGN',
  'VJN',
  'WAC',
  'WAK',
  'WAQ',
  'WCK',
  'WOP',
  'WTF',
  'XTC',
  'XXX',
  'AZS',
  'AZZ'
];

/**
 * getDeviceFancyName - Choose a fancy name based on the robot's advertised
 * name. Avoids any name that produces blacklisted initials.
 *
 * @param  {string} devName Advertised name of the robot
 * @return {string}         Fancy name derived from advertised name.
 */
function getDeviceFancyName(devName) {
  if ((devName.startsWith("MB")) || (devName.startsWith("BB")) || (devName.startsWith("FN")) || (devName.startsWith("GB"))) {
    //console.log("Code: " + devName.substr(devName.length - 5));

    var numberInDec = parseInt(devName.substr(devName.length - 5), 16);
    //console.log("numberInDec " + numberInDec);
    var mod16 = numberInDec % 16;
    //console.log("mod16 " + mod16);
    var top8 = numberInDec % 256;
    //console.log("top8 " + top8);
    var mid6 = (numberInDec / 256) % 64;
    //console.log("mid6 " + mid6);
    var bot6 = (numberInDec / 256) / 64;
    //console.log("bot6 " + bot6);

    var first = Math.floor(top8 + mod16);
    var second = Math.floor(mid6 + mod16);
    var third = Math.floor(bot6 + mod16);

    //console.log("first, second, third: " + first + ", " + second + ", " + third);

    var names = fancyNameArray;
    var fancyName = names[first][0] + " " + names[second][1] + " " + names[third][2];
    var initials = names[first][0].charAt(0) + names[second][1].charAt(0) + names[third][2].charAt(0);

    while (blacklistArray.includes(initials)) {
      //console.log("Found bad word: {} in {}" + initials + " " + fancyName);
      // add 1 and mod the result by 512 to the index of the second word:
      second++;
      second %= 512;
      fancyName = names[first][0] + " " + names[second][1] + " " + names[third][2];
      initials = names[first][0].charAt(0) + names[second][1].charAt(0) + names[third][2].charAt(0);
    }

    fancyName += " (" + initials + ")";
    //console.log("Fancy Name assigned to device: " + fancyName);
    return fancyName;
  } else {
    return "Unknown device"
  }
}

///////////////////////////////////

/**
 * onMessage - Handle message received by this window.
 *
 * @param  {Object} e Message event.
 */
function receiveMessage(e) {

  if (e.data.message == "SPEAK") {
    console.log("tts " + e.data.val)
    textToSpeech(e.data.val)
  } else {
    //This message is a micro:bit robot command
    parseMessage(e.data);
  }
}

/**
 * parseMessage - Function for parsing commands for micro:bit based robots.
 *
 * @param  {Object} message Object containing command information
 */
function parseMessage(message) {
  if (message.cmd == "connect") {
    findAndConnect(message.robot)
    return
  }

  let robot = getRobotByLetter(message.robot);
  //if (FinchBlox) { robot = finchBloxRobot }
  if (robot == null) {
    console.error("Unable to find robot " + message.robot);
    return;
  }

  switch(message.cmd) {
    case "disconnect":
      robot.userDisconnect()

      break;
    case "calibrate":
      robot.startCalibration()

      break;

    case "playNote":
      robot.setBuzzer(message.note, message.duration)

      break;
    case "symbol":
      robot.setSymbol(message.symbolString)

      break;
    case "print":
      robot.setPrint(message.printString.split(""))

      break;
    case "setPin":
      robot.setPin(message.pin, message.percent)

      break;
    case "setPinRead":
      robot.setPinRead(message.pin)

      break;
    case "stopAll":
      robot.stopAll();

      break;
    default:
      console.error("Command not implemented: " + message.cmd);
  }
}

function textToSpeech(text) {
  var msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
}


///////////////////////////////////

window.birdbrain = {};
window.birdbrain.isConnected = {};
window.birdbrain.isConnected.A = false;
window.birdbrain.isConnected.B = false;
window.birdbrain.isConnected.C = false;
window.birdbrain.sensorData = {};
window.birdbrain.sensorData.A = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
window.birdbrain.sensorData.B = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
window.birdbrain.sensorData.C = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
window.birdbrain.microbitIsV2 = {};
window.birdbrain.microbitIsV2.A = false;
window.birdbrain.microbitIsV2.B = false;
window.birdbrain.microbitIsV2.C = false;
window.birdbrain.pinInReadMode = {};
window.birdbrain.pinInReadMode.A = [false, false, false];
window.birdbrain.pinInReadMode.B = [false, false, false];
window.birdbrain.pinInReadMode.C = [false, false, false];
window.birdbrain.robotType = {
  FINCH: 1,
  HUMMINGBIRDBIT: 2,
  MICROBIT: 3,
  GLOWBOARD: 4,
  //connected robots default to type MICROBIT
  A: 3,
  B: 3,
  C: 3
};


console.log("setting up message channel")
window.birdbrain.messageChannel = new MessageChannel();
window.birdbrain.messageChannel.port1.onmessage = function (e) {
    window.birdbrain.handleMessage(e.data)
}
window.parent.postMessage("hello from snap", "*", [window.birdbrain.messageChannel.port2]);
window.birdbrain.handleMessage = function(data) {
  if (data.sensorData != null && data.robot != null) {
    let robot = data.robot;
    window.birdbrain.sensorData[robot] = data.sensorData;
    window.birdbrain.robotType[robot] = data.robotType;
    window.birdbrain.microbitIsV2[robot] = data.hasV2Microbit;
    window.birdbrain.isConnected[robot] = true;
  }

  if (data.connectionLost && data.robot != null) {
      window.birdbrain.isConnected[data.robot] = false;
      window.birdbrain.sensorData[data.robot] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      window.birdbrain.microbitIsV2[data.robot] = false;
      window.birdbrain.pinInReadMode[data.robot] = [false, false, false];
  }
}

window.birdbrain.sendCommand = function(command) {
  //window.parent.postMessage(command, "*");
  var e = {}
  e.data = command
  receiveMessage(e)
}

//  Converts byte range 0 - 255 to -127 - 127 represented as a 32 bit signe int
function byteToSignedInt8 (byte) {
  var sign = (byte & (1 << 7));
  var value = byte & 0x7F;
  if (sign) { value  = byte | 0xFFFFFF00; }
  return value;
}

//  Converts byte range 0 - 255 to -127 - 127 represented as a 32 bit signe int
function byteToSignedInt16 (msb, lsb) {
  var sign = msb & (1 << 7);
  var value = (((msb & 0xFF) << 8) | (lsb & 0xFF));
  if (sign) {
    value = 0xFFFF0000 | value;  // fill in most significant bits with 1's
  }
  return value;
}

window.birdbrain.getMicrobitAcceleration = function(axis, robot) {
  const rawToMperS = 196/1280; //convert to meters per second squared
  let sensorData = window.birdbrain.sensorData[robot];
  let accVal = 0;
  switch (axis) {
    case 'X':
      accVal = byteToSignedInt8(sensorData[4]);
      break;
    case 'Y':
      accVal = byteToSignedInt8(sensorData[5]);
      break;
    case 'Z':
      accVal = byteToSignedInt8(sensorData[6]);
      break;
  }
  return (accVal * rawToMperS);
}

window.birdbrain.getMicrobitMagnetometer = function(axis, robot) {
  const rawToUT = 1/10; //convert to uT
  let sensorData = window.birdbrain.sensorData[robot];
  let msb = 0;
  let lsb = 0;
  switch (axis) {
    case 'X':
      msb = sensorData[8];
      lsb = sensorData[9];
      break;
    case 'Y':
      msb = sensorData[10];
      lsb = sensorData[11];
      break;
    case 'Z':
      msb = sensorData[12];
      lsb = sensorData[13];
      break;
  }
  let magVal = byteToSignedInt16(msb, lsb);
  return Math.round(magVal * rawToUT);
}




//// Robot Connection Blocks ////

SnapExtensions.primitives.set(
  'bbt_connect(robot)',
  function (robot) {

    var thisCommand = {
      robot: robot,
      cmd: "connect"
    }

    window.birdbrain.sendCommand(thisCommand);
  }
);

SnapExtensions.primitives.set(
  'bbt_disconnect(robot)',
  function (robot) {

    var thisCommand = {
      robot: robot,
      cmd: "disconnect"
    }

    window.birdbrain.sendCommand(thisCommand);
  }
);

SnapExtensions.primitives.set(
  'bbt_calibrate(robot)',
  function (robot) {

    var thisCommand = {
      robot: robot,
      cmd: "calibrate"
    }

    window.birdbrain.sendCommand(thisCommand);
  }
);


//// Looks Blocks ////

SnapExtensions.primitives.set(
  'bbt_display(robot, symbol)',
  function (robot, symbolString) {
    var thisCommand = {
      robot: robot,
      cmd: "symbol",
      symbolString: symbolString
    }

   window.birdbrain.sendCommand(thisCommand);
  }
);

SnapExtensions.primitives.set(
  'bbt_print(robot, string)',
  function (robot, string) {
    var thisCommand = {
      robot: robot,
      cmd: "print",
      printString: string
    }

    window.birdbrain.sendCommand(thisCommand);
  }
);

//// Control Blocks ////

SnapExtensions.primitives.set(
  'bbt_stop(robot)',
  function (robot) {
    var thisCommand = {
      robot: robot,
      cmd: "stopAll"
    }
    window.birdbrain.sendCommand(thisCommand)
  }
);

SnapExtensions.primitives.set(
  'bbt_writepin(robot, pin, percent)',
  function (robot, pin, percent) {
    var thisCommand = {
      robot: robot,
      cmd: "setPin",
      pin: pin,
      percent: percent
    }
    window.birdbrain.sendCommand(thisCommand)

    window.birdbrain.pinInReadMode[robot][pin] = false;
  }
);

SnapExtensions.primitives.set(
  'bbt_setpinread(robot, pin)',
  function (robot, pin) {
    var thisCommand = {
      robot: robot,
      cmd: "setPinRead",
      pin: pin
    }
    window.birdbrain.sendCommand(thisCommand)

    window.birdbrain.pinInReadMode[robot][pin] = true;
  }
);

//// Sound Blocks ////

SnapExtensions.primitives.set(
  'bbt_playnote(robot, note, duration)',
  function (robot, note, duration) {
    note = Math.round(Math.max(32, Math.min(135, note)));

    var thisCommand = {
      robot: robot,
      cmd: "playNote",
      note: note,
      duration: duration
    }
    window.birdbrain.sendCommand(thisCommand)

    window.birdbrain.pinInReadMode[robot][0] = false;
  }
);

//// Sensing Blocks ////

SnapExtensions.primitives.set(
  'bbt_accelerometer(robot, dimension)',
  function (robot, dim) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }
    let acc = window.birdbrain.getMicrobitAcceleration(dim, robot);
    return Math.round(acc * 10) / 10;
  }
);

SnapExtensions.primitives.set(
  'bbt_button(robot, button)',
  function (robot, button) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    const type = window.birdbrain.robotType[robot];
    const index = (type == window.birdbrain.robotType.FINCH) ? 16 : 7;
    var buttonState = window.birdbrain.sensorData[robot][index] & 0xF0; //Button Byte position = 7, clear LS Bits as it is for shake and calibrate

    switch (button) {
      case 'A':
        return (buttonState == 0x00 || buttonState == 0x20)
      case 'B':
        return (buttonState == 0x00 || buttonState == 0x10)
      case 'Logo (V2)':
        if(window.birdbrain.microbitIsV2[robot]) {
          return (((window.birdbrain.sensorData[robot][index] >> 1) & 0x1) == 0x0)
        } else {
          return "micro:bit V2 required";
        }
      default:
        console.log("unknown button " + button);
        return false;
    }
  }
);

SnapExtensions.primitives.set(
  'bbt_checkreadmode(robot, pin)',
  function (robot, pin) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    return (window.birdbrain.pinInReadMode[robot][pin] == true);
  }
);


SnapExtensions.primitives.set(
  'bbt_compass(robot)',
  function (robot) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    const ax = window.birdbrain.getMicrobitAcceleration('X', robot);
    const ay = window.birdbrain.getMicrobitAcceleration('Y', robot);
    const az = window.birdbrain.getMicrobitAcceleration('Z', robot);
    const mx = window.birdbrain.getMicrobitMagnetometer('X', robot);
    const my = window.birdbrain.getMicrobitMagnetometer('Y', robot);
    const mz = window.birdbrain.getMicrobitMagnetometer('Z', robot);

    const phi = Math.atan(-ay / az)
    const theta = Math.atan(ax / (ay * Math.sin(phi) + az * Math.cos(phi)))

    const xp = mx
    const yp = my * Math.cos(phi) - mz * Math.sin(phi)
    const zp = my * Math.sin(phi) + mz * Math.cos(phi)

    const xpp = xp * Math.cos(theta) + zp * Math.sin(theta)
    const ypp = yp

    const angle = 180.0 + ((Math.atan2(xpp, ypp)) * (180 / Math.PI)) //convert result to degrees

    return Math.round(angle)
  }
);

SnapExtensions.primitives.set(
  'bbt_magnetometer(robot, dimension)',
  function (robot, dim) {
    return window.birdbrain.getMicrobitMagnetometer(dim, robot);
  }
);

SnapExtensions.primitives.set(
  'bbt_orientation(robot, dimension)',
  function (robot, dim) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    if (dim == "Shake") {
      const index = 7;
      let shake = window.birdbrain.sensorData[robot][index];
      return ((shake & 0x01) > 0);
    }
    const threshold = 7.848;
    let acceleration = 0;
    switch(dim) {
      case "Tilt Left":
      case "Tilt Right":
        acceleration = window.birdbrain.getMicrobitAcceleration('X', robot);
        break;
      case "Logo Up":
      case "Logo Down":
        acceleration = window.birdbrain.getMicrobitAcceleration('Y', robot);
        break;
      case "Screen Up":
      case "Screen Down":
        acceleration = window.birdbrain.getMicrobitAcceleration('Z', robot);
        break;
    }
    switch(dim) {
      case "Tilt Left":
      case "Logo Down":
      case "Screen Down":
        return (acceleration > threshold);
      case "Tilt Right":
      case "Logo Up":
      case "Screen Up":
        return (acceleration < -threshold);
    }

    console.log("Unknown dimension " + dim);
    return false;
  }
);

SnapExtensions.primitives.set(
  'bbt_readpin(robot, pin)',
  function (robot, pin) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    let val = window.birdbrain.sensorData[robot][pin]
    return Math.round(val * (114/255))
  }
);

SnapExtensions.primitives.set(
  'bbt_robotisconnected(robot)',
  function(robot) {
    return window.birdbrain.isConnected[robot];
  }
);

SnapExtensions.primitives.set(
  'bbt_sound(robot)',
  function (robot) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    if (window.birdbrain.microbitIsV2[robot]) {
      const type = window.birdbrain.robotType[robot];
      if (type == window.birdbrain.robotType.FINCH) {
        return window.birdbrain.sensorData[robot][0];
      } else {
        return window.birdbrain.sensorData[robot][14];
      }
    } else {
      return "micro:bit V2 required"
    }
  }
);

SnapExtensions.primitives.set(
  'bbt_temperature(robot)',
  function (robot) {
    if (!window.birdbrain.isConnected[robot]) {
      return (robot + " is not connected")
    }

    if (window.birdbrain.microbitIsV2[robot]) {
      const type = window.birdbrain.robotType[robot];
      if (type == window.birdbrain.robotType.FINCH) {
        return (window.birdbrain.sensorData[robot][6] >> 2);
      } else {
        return window.birdbrain.sensorData[robot][15];
      }
    } else {
      return "micro:bit V2 required"
    }
  }
);


//////////////////////////////

//Add a little box for monitoring micro:bit connections
(function () {
//      border: 3px #535353 double;
  //Add some style for the popup
  var styleSheet = document.createElement("style")
  styleSheet.innerText = `
    #microbit-monitor {
      font-family: verdana;
      text-align: center;
      background-color: #ffffff;
      color: #535353;
      margin: 0;
      padding: 15px;
      font-size: 18px;
      position: absolute;
      border: 1px solid #CACACA;
      border-radius: 5px;
    }

    #microbit-monitor table {
      width: 100%;
      padding: 0;
      border-collapse: collapse;
    }

    #microbit-monitor td {
      padding: 5px;
    }

    #microbit-monitor h3 {
      margin-top: 0;
      margin-left: 50px;
      margin-right: 50px;
      margin-bottom: 15px;
    }

    #microbit-monitor button {
      border-radius: 4px;
      padding: 2px;
      padding-left: 5px;
      padding-right: 5px;
      font-family: verdana;
      color: #535353;
      font-size: 12px;
      margin-left: 5px;
      margin-right: 5px;
    }

    #microbit-monitor span {
      margin-left: 5px;
      margin-right: 5px;
      font-size: 12px;
    }

    #microbit-monitor-topbuttons {
      position: absolute;
      right: 15px;
      top: 15px;
    }

    #microbit-monitor-topbuttons button {
      font-size: 10px;
    }
`
  document.head.appendChild(styleSheet)

  const container = document.createElement('div');
  container.setAttribute("id", "microbit-monitor")
  const fullMonitor = document.createElement('div');
  container.appendChild(fullMonitor);

  const header = document.createElement('div');
  header.setAttribute("style", "cursor: move; display: inline-flex;")
  header.innerHTML = "<div style=\"position: absolute; left: 25px;\">⊹</div><h3>micro:bit Connections</h3>"

  const buttonDiv = document.createElement('div')
  buttonDiv.setAttribute("id", "microbit-monitor-topbuttons")
  const minButton = document.createElement('button')
  minButton.innerText = "─"
  minButton.onclick = function() {
    window.birdbrain.mbMonitor.container.removeChild(window.birdbrain.mbMonitor.full)
    window.birdbrain.mbMonitor.container.appendChild(window.birdbrain.mbMonitor.min)
  }
  buttonDiv.appendChild(minButton);

  const minMonitor = document.createElement('div')
  minMonitor.setAttribute("style","cursor: move; font-size: 12px;")
  minMonitor.innerText = "micro:bit Connections"
  minMonitor.onclick = function() {
    const monitor = window.birdbrain.mbMonitor
    if (monitor.isMoving) { return; }

    monitor.container.removeChild(monitor.min)
    monitor.container.appendChild(monitor.full)
  }

  //const removeButton = document.createElement('button')
  //removeButton.innerText = "✕"
  //buttonDiv.appendChild(removeButton)
  header.appendChild(buttonDiv)
  fullMonitor.appendChild(header);

  const table = document.createElement('table');
  window.birdbrain.mbMonitor = {};
  window.birdbrain.mbMonitor.A = addRow(table, 0, "A")
  window.birdbrain.mbMonitor.A.setAttribute("style", "border-bottom: 1pt solid #535353;")
  window.birdbrain.mbMonitor.B = addRow(table, 1, "B")
  window.birdbrain.mbMonitor.B.setAttribute("style", "border-bottom: 1pt solid #535353;")
  window.birdbrain.mbMonitor.C = addRow(table, 2, "C")

  function addRow(t, position, devLetter) {
    const row = t.insertRow(position);
    const cell0 = row.insertCell(0);
    cell0.innerHTML = devLetter;
    const cell1 = row.insertCell(1);

    const connectButton = document.createElement('button');
    //connectButton.setAttribute("style", "background-color: #2FC00B;")
    connectButton.innerText = "connect";
    connectButton.onclick = function() {
      SnapExtensions.primitives.get('bbt_connect(robot)').apply(
            this,
            [devLetter]
      );
    }
    cell1.appendChild(connectButton);

    return row;
  }

  fullMonitor.appendChild(table);

  document.body.appendChild(container);
  window.birdbrain.mbMonitor.min = minMonitor
  window.birdbrain.mbMonitor.full = fullMonitor
  window.birdbrain.mbMonitor.container = container

  container.style.top = (window.innerHeight - 100 - container.offsetHeight) + "px";
  container.style.left = (window.innerWidth - 100 - container.offsetWidth) + "px";
  console.log("container " + container.offsetWidth + " " + container.offsetHeight)


  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;
  minMonitor.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    window.birdbrain.mbMonitor.container.style.top = (window.birdbrain.mbMonitor.container.offsetTop - pos2) + "px";
    window.birdbrain.mbMonitor.container.style.left = (window.birdbrain.mbMonitor.container.offsetLeft - pos1) + "px";
    // note that the element is moving
    window.birdbrain.mbMonitor.isMoving = true;
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    setTimeout(() => window.birdbrain.mbMonitor.isMoving = false, 50)
  }

})();
