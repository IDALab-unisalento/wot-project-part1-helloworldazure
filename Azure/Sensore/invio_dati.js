// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';
var fs = require('fs');
var sensorLib = require("node-dht-sensor");
sensorLib.initialize(11, 12); 
var Protocol = require('azure-iot-device-mqtt').Mqtt;
// Uncomment one of these transports and then change it in fromConnectionString to test other transports
// var Protocol = require('azure-iot-device-http').Http;
// var Protocol = require('azure-iot-device-amqp').Amqp;

var Client = require('azure-iot-device').Client;
var Message = require('azure-iot-device').Message;

// 1) Obtain the connection string for your downstream device and to it
//    append this string GatewayHostName=<edge device hostname>;
// 2) The Azure IoT Edge device hostname is the hostname set in the config.yaml of the Azure IoT Edge device
//    to which this sample will connect to.
//
// The resulting string should look like the following
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>;GatewayHostName=<edge device hostname>"

 var DEVICE_CONNECTION_STRING= "HostName=raspberrypi;DeviceId=DispositivoFoglia2;SharedAccessKey=VdEzM4FMT/POHR+5UPcqlnjsf+b+YOfRi2lafRcS1B0=";
const PATH_TO_EDGE_CA_CERT = "/home/pi/Desktop/A/azure-iot-test-only.root.ca.cert.pem";

var deviceConnectionString = DEVICE_CONNECTION_STRING;

// Path to the Edge "owner" root CA certificate
var edge_ca_cert_path = PATH_TO_EDGE_CA_CERT;
// fromConnectionString must specify a transport constructor, coming from any transport package.
var client = Client.fromConnectionString(deviceConnectionString, Protocol);

var connectCallback = function (err) {
  if (err) {
    console.error('Could not connect: ' + err.message);
  } else {
    console.log('Client connected');
    client.on('message', function (msg) {
      console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
      // When using MQTT the following line is a no-op.
      client.complete(msg, printResultFor('completed'));
      // The AMQP and HTTP transports also have the notion of completing, rejecting or abandoning the message.
      // When completing a message, the service that sent the C2D message is notified that the message has been processed.
      // When rejecting a message, the service that sent the C2D message is notified that the message won't be processed by the device. the method to use is client.reject(msg, callback).
      // When abandoning the message, IoT Hub will immediately try to resend it. The method to use is client.abandon(msg, callback).
      // MQTT is simpler: it accepts the message by default, and doesn't support rejecting or abandoning a message.
    });

    // Create a message and send it to the IoT Hub every five seconds
    var sendInterval = setInterval(function () {
  
   
var readout = sensorLib.read(); 
var temp=parseInt(readout.temperature.toFixed(0)); 



     const data = JSON.stringify({
      "name":"Rapberry Pi",
      "sensore":"DHT11",
      "temperature":temp,
   
  })
      var message = new Message(data);
      console.log('Sending message: ' + message.getData());
      client.sendEvent(message, printResultFor('send'));
    }, 10000);

    client.on('error', function (err) {
      console.error(err.message);
    });

    client.on('disconnect', function () {
      clearInterval(sendInterval);
      client.removeAllListeners();
      client.open(connectCallback);
    });
  }
};

// Provide the Azure IoT device client via setOptions with the X509
// Edge root CA certificate that was used to setup the Edge runtime
 var options = {
  ca : fs.readFileSync(edge_ca_cert_path, 'utf-8'),
};  

client.setOptions(options, function(err) {
  if (err) {
    console.log('SetOptions Error: ' + err);
  } else {
    client.open(connectCallback);
  } 
}); 

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}