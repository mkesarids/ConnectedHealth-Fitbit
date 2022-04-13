import document from "document";
import * as messaging from "messaging";
import { outbox } from "file-transfer";
import { display } from "display";
import { HeartRateSensor } from "heart-rate";
import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
import { OrientationSensor } from "orientation";
import { clock } from "clock";
import { user } from "user-profile";
import { localStorage } from "local-storage";

///////////////////////////////////
////     Assisting Fields      ////
///////////////////////////////////

let session_id = 0;
let name = "";
let age = "";
let gender = "";
let height = "";
let workout = "";

var dataBuffer = [];
var data = {};

let recording = false;
let socketOpen = false;

///////////////////////////////////
////      Helper Functions     ////
///////////////////////////////////

// Generate a random 63-bit integer
function getRandomInt() {
  return Math.floor(Math.random() * Math.floor(Math.pow(2, 63)-1))
}

// Push sensor value to data and send the data if ready
function push(key, value) {
  data[key] = value;
  
  // If the data point contains all available sensor values, push it to the buffer
  var hasPropertyHeartRate = (!HeartRateSensor || data.hasOwnProperty("HeartRate"));
  var hasPropertyAccelerometer = (!Accelerometer || data.hasOwnProperty("Acceleration"));
  var hasPropertyGyroscope = (!Gyroscope || data.hasOwnProperty("Rotation"));
  var hasPropertyOrientation = (!OrientationSensor || data.hasOwnProperty("Quaternion_Orientation"));
  
  if(hasPropertyHeartRate && hasPropertyAccelerometer && hasPropertyGyroscope && hasPropertyOrientation) {
    // Before we push the data point, we need to assign the identifying metrics
    data.Timestamp = Date.now();
    
    data.session_id = session_id;
    
    dataBuffer.push(data);
    data = {HeartRate: data.HeartRate}; // When we reset the data field, we want to retain the heart rate as it updates slower than everything else
  }
  
  if(dataBuffer.length > 9) {
    bufferDelivery();
  }
}

function checkErrorMessage() {
  if(!socketOpen) {
    return "Error: No Connection";
  } else if (name.length == 0) {
    return "Missing info: Name";
  } else if (age.length == 0) {
    return "Missing info: Age";
  } else if (gender.length == 0) {
    return "Missing info: Gender";
  } else if (height.length == 0) {
    return "Missing info: Height";
  } else if (workout.length == 0) {
    return "Missing info: Workout";
  } else {
    return "No Error";
  }
}

///////////////////////////////////
////        UI Elements        ////
///////////////////////////////////

const hrmLabel = document.getElementById("hrm-label");
const hrmData = document.getElementById("hrm-data");

const accelLabel = document.getElementById("accel-label");
const accelData = document.getElementById("accel-data");

const gyroLabel = document.getElementById("gyro-label");
const gyroData = document.getElementById("gyro-data");

const errorLabel = document.getElementById("error-label");

const recordButton = document.getElementById("recordbutton");

///////////////////////////////////
////       Record Button       ////
///////////////////////////////////

// Controlling the visual and functional state of the button
recordButton.set = function(state) {
  switch(state) {
    case "recording":
      this.enabled = true;
      this.text = "Stop";
      this.style.fill = "fb-red";
      errorLabel.text = "";
      break;
    case "ready":
      this.enabled = true;
      this.text = "Record";
      this.style.fill = "fb-blue";
      errorLabel.text = "";
      break;
    case "disabled":
      this.enabled = false;
      this.text = "Error";
      this.style.fill = "fb-slate-press";
      errorLabel.text = checkErrorMessage();
      break;
  }
}

// Handle click events
recordButton.onactivate = function() {
  if(this.enabled) {
    recording = !recording;

    this.set(recording ? "recording" : "ready");
    
    if(recording) {
      session_id = getRandomInt();  // We want to set a new session ID to identify workouts
      data = {};                    // Reset data fields
      dataBuffer = [];              // Reset buffer
    }
  }
}

recordButton.set("disabled"); // Don't enable the record button until we have a connection

///////////////////////////////////
////           Sensors         ////
///////////////////////////////////

const sensors = [];

const frequency = 7;
const fixedPoint = 2;

if (HeartRateSensor) {
  const hrm = new HeartRateSensor({ frequency: 1 });
  hrm.addEventListener("reading", () => {
    var value = hrm.heartRate;
    
    // Set display text
    hrmData.text = value;
    
    // Push data
    if(recording) {
      push("HeartRate", value);
    }
  });
  sensors.push(hrm);
  hrm.start();
} else {
  hrmLabel.style.display = "none";
  hrmData.style.display = "none";
}

if (Accelerometer) {
  const accel = new Accelerometer({ frequency: frequency });
  accel.addEventListener("reading", () => {
    var value = {
      X: accel.x ? accel.x.toFixed(fixedPoint) : 0,
      Y: accel.y ? accel.y.toFixed(fixedPoint) : 0,
      Z: accel.z ? accel.z.toFixed(fixedPoint) : 0
    };
    
    // Set display text
    accelData.text = JSON.stringify(value);
    
    // Push data
    if(recording) {
      push("Acceleration", value);
    }
  });
  sensors.push(accel);
  accel.start();
} else {
  accelData.style.fill = "red";
  accelData.text = "No sensor!";
}

if (Gyroscope) {
  const gyro = new Gyroscope({ frequency: frequency });
  gyro.addEventListener("reading", () => {
    var value = {
      X: gyro.x ? gyro.x.toFixed(fixedPoint) : 0,
      Y: gyro.y ? gyro.y.toFixed(fixedPoint) : 0,
      Z: gyro.z ? gyro.z.toFixed(fixedPoint) : 0,
    };
    
    // Set display text
    gyroData.text = JSON.stringify(value);
    
    // Push data
    if(recording) {
      push("Rotation", value);
    }
  });
  sensors.push(gyro);
  gyro.start();
} else {
  gyroData.style.fill = "red";
  gyroData.text = "No sensor!";
}

if (OrientationSensor) {
  const orientation = new OrientationSensor({ frequency: frequency });
  orientation.addEventListener("reading", () => {
    var raw_val = orientation.quaternion ? orientation.quaternion.map(n => n.toFixed(fixedPoint)) : null;
    var value = {
      X: raw_val[0],
      Y: raw_val[1],
      Z: raw_val[2],
      W: raw_val[3]
    }
    
    // Push data
    if(recording) {
      push("Quaternion_Orientation", value);
    }
  });
  sensors.push(orientation);
  orientation.start();
} else {
  orientationData.style.fill = "red";
  orientationData.text = "No sensor!"
}

///////////////////////////////////
////      Display Handler      ////
///////////////////////////////////

// Handle display events
display.addEventListener("change", () => {
  // Automatically stop all sensors when the screen is off to conserve battery, but not if it's recording
  display.on || recording ? sensors.map(sensor => sensor.start()) : sensors.map(sensor => sensor.stop());
});

///////////////////////////////////
////      Socket Handlers      ////
///////////////////////////////////

// Message is received
messaging.peerSocket.onmessage = evt => {
  console.log(`App received: ${JSON.stringify(evt.data)}`);
  
  // Populate the labels with the new data
  let value = evt.data.value;
  let label = document.getElementById(evt.data.key + "-data"); 
  if(label) {
    label.text = value;
  }

  // Populate the data fields
  switch(evt.data.key) {
    case "name":
      name = value;
      break;
    case "workout":
      workout = value;
      break;
    case "age":
      age = value;
      break;
    case "gender":
      gender = value;
      break;
    case "height":
      height = value;
      break;
    case "request":
      send({key: value, value: user[value]})
      break;
  }

  if (!recording)
    recordButton.set(checkErrorMessage() == "No Error" ? "ready" : "disabled");
};

// Message socket opens
messaging.peerSocket.onopen = () => {
  console.log("App Socket Open");
  socketOpen = true;
  recordButton.set(checkErrorMessage() == "No Error" ? "ready" : "disabled");
};

// Message socket closes
messaging.peerSocket.onclose = () => {
  console.log("App Socket Closed");
  socketOpen = false;
  recordButton.set("disabled");
};

// Message socket buffer empty
messaging.peerSocket.onbufferedamountdecrease = () => {
  bufferDelivery();
};

// Send data to device using Messaging API
function send(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log("App Sent Data");
    messaging.peerSocket.send(data);
  } else {
    console.log("App Failed To Send Data To Companion");
    recording = false;
    recordButton.set("disabled");
  }
}

// Maximize data throughput and adhere to the Messaging API's buffer size
function bufferDelivery() {
  let availableBufferBytes = messaging.peerSocket.MAX_MESSAGE_SIZE - messaging.peerSocket.bufferedAmount;
  var data = [];
  while(dataBuffer.length > 0) {
    // We want our message to fit inside the buffer within a safe margin
    if(JSON.stringify(data).length + JSON.stringify(dataBuffer[0]).length < availableBufferBytes - 128) {
      data.push(dataBuffer.shift());
    } else {
      break;
    }
  }
  
  if(data.length > 0)
    send(data);
}