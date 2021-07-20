'use strict';
//n5

//librerie per i led
var onoff = require('onoff')
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LedY = new Gpio(18, 'out'); //use GPIO pin 18, and specify that it is output

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;
var sogliaMax = 25;
Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
    throw err;
  } else {
    client.on('error', function (err) {
      throw err;
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('IoT Hub module client initialized');

        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          pipeMessage(client, inputName, msg);
        });
        // client.on('inputMessage', pipeMessage(client, inputName, msg));
      }
    });
  }
});

// This function just pipes the messages without any change.
function pipeMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));

  if (inputName === 'input1') {
    var message = msg.getBytes().toString('utf8');
    if (message) {
      var messageBody = JSON.parse(message);
      var sensore = (messageBody.sensore);
      var name = (messageBody.name);
      var temp = parseFloat(messageBody.temperature);
      var state = false;
      var allarme = 0;


      if (temp >= 20 && temp < sogliaMax) {

        //clearInterval(myVar);
       // allarme = 0;
       LedY.writeSync(0); // Turn LED off
        var outputMsg = new Message(String("La temperatura rilevata dal sensore " + sensore + " presente sul dispositivo " + name + " equivale a " + temp));
        client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
      }
       if (temp >= sogliaMax) {
    
          var myVar = setInterval(blink, 200);
          function blink() {
            if (state) LedY.writeSync(1);
            else LedY.writeSync(0);
            state = !state;
          }
          setTimeout(endBlink, 9000); //stop 
          function endBlink() { //function to stop blinking
            clearInterval(myVar); // Stop blink intervals
            LedY.writeSync(0); // Turn LED off
          }
        var outputMsg = new Message(String("ATTENZIONE!!! SOGLIA MASSIMA DI " + sogliaMax + " SUPERATA. LA TEMPERATURA RILEVATA DAL SENSORE " + sensore + "  PRESENTE SUL DISPOSITIVO " + name + " EQUIVALE A " + temp));
        outputMsg.properties.add('MessageType', 'Alert');
        client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
      }
      if (temp < 20) {
        //clearInterval(myVar);
       // allarme = 0;
       LedY.writeSync(0); // Turn LED off

      }
    }
  }
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    }
    if (res) {
      console.log(op + ' status: ' + res.constructor.name);
    }
  };
}
