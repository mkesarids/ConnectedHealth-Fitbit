import { settingsStorage } from "settings";
import { restoreSettings } from "./Helper.js";
import * as messaging from "messaging";
import * as constants from "./constants.js"
import * as messagingHelper from "./messagingHelper.js";
import * as settingsHelper from "./settingsHelper.js";

/////////////////////////////////////
////   Version Update Handling   ////
/////////////////////////////////////
let currentVersion = settingsStorage.getItem("version");

// Make changes to fix any issues in storage
if (currentVersion == null) {
  settingsStorage.clear();
}

// Update stored version
if (currentVersion != constants.app.version) {
  settingsStorage.setItem("version", constants.app.version);
}

///////////////////////////////////
////     Messaging Handlers    ////
///////////////////////////////////

// Message is received
messaging.peerSocket.onmessage = messagingHelper.handleMessage;

// Message socket opens
messaging.peerSocket.onopen = messagingHelper.handleOpen;

// Message socket closes
messaging.peerSocket.onclose = messagingHelper.handleClose;

//////////////////////////////////
////     Settings Handler     ////
//////////////////////////////////

// A user changes settings
settingsStorage.onchange = settingsHelper.handleChange;
