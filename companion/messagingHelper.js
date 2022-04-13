import * as messaging from "messaging";
import { settingsStorage } from "settings";
import * as helper from "./helper.js";
import * as settingsHelper from "./settingsHelper.js";
import * as constants from "./constants.js";

// Send data to device using Messaging API
export function send(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
}

export function handleMessage(evt) {
  console.log(`Companion received: ${JSON.stringify(evt.data)}`);
  if(evt.data.hasOwnProperty('key')) { // This will handle any reply from the requests for missing user information.
    let key = evt.data.key;
    let value = evt.data.value;
    switch(key) {
      case "age":
        settingsStorage.setItem(key, value);
        break;
      case "gender":
        let genders = constants.map.genders;
        let idx = genders.indexOf(value) % genders.length;  // Any error in the index resolves to other
        settingsStorage.setItem(key, value);
        let genderJSON = {
          "selected": [idx],
          "values": [{"name": genders[idx]}]
        }
        settingsStorage.setItem("genderJSON", JSON.stringify(genderJSON));
        break;
      case "height":
        settingsStorage.setItem(key, String(parseInt(parseFloat(value)*39.37)));
    }
  } else {
    let data = evt.data;
    let name = settingsStorage.getItem('name');
    let age = settingsStorage.getItem('age');
    let gender = settingsStorage.getItem('gender');
    let height = settingsStorage.getItem('height');
    let workout = settingsStorage.getItem('workout');
    let workout_description = settingsStorage.getItem('workout_description');
    data.forEach(sample => {
      sample.name = name;
      sample.age = age;
      sample.gender = gender;
      sample.height = height;
      sample.workout = workout;
      sample.workout_description = workout_description;
      sample.Euler_Orientation = helper.quaternionToEuler(sample.Quaternion_Orientation)
    });
    helper.postData(constants.app.url, data);
  }
}

export function handleOpen() {
  console.log("Companion Socket Open");
  settingsHelper.restoreSettings();
}

export function handleClose() {
  console.log("Companion Socket Closed");
}