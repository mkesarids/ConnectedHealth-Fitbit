import { settingsStorage } from "settings";
import * as messagingHelper from "./messagingHelper.js";

// Restore any previously saved settings and send to the device
export function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key) {
      let value = settingsStorage.getItem(key);
      let data = {
        key: key,
        value: value
      };
      messagingHelper.send(data);
    }
  }
  requestUserProfile();
}

// Get user information if it's missing
function requestUserProfile() {
  let keys = ["age", "gender", "height"];
  keys.forEach((key, idx)=>{
    if(!settingsStorage.getItem(key)) {
      messagingHelper.send({key: "request", value: key});
    }
  })
}

export function handleChange(evt) {
  let data = {
    key: evt.key,
    value: evt.newValue
  };
  messagingHelper.send(data);  
}