#!/usr/bin/env node

const Chuck  = require('chucknorris-io'),
      client = new Chuck(),
      fs = require('fs');

client.getRandomJoke('dev').then(function (joke) {
    console.log("NETWORK [OK]: " + joke.value)
}).catch(function (err) {
    var joke = `NETWORK [FAIL]: I can't connect to chucknorris.io. Offering you a network-related joke then: Chuck Norris's OSI network model has only one layer - Physical.`;
    console.log(joke);
});

/* try to access the camera for illustrating plugs on different commands.
   it will error out differently on a permission denied and string opening
*/
fs.writeFile("/dev/video0", "Hello!", function(err) {
    if (err.code === 'EACCES') {
        console.log("CAMERA [FAIL]: Urgh, even Chuck doesn't have access to the camera")
        return
    }
    console.log("CAMERA [OK]: I can see you, you should smile more!")
});

// try to list the first file in home directory
var home = process.env.SNAP_USER_DATA
if (home) {
    home = home + "/../../../"
} else {
    home = process.env.HOME
}
fs.readdir(home, (err, files) => {
     if (err) {
         console.log("HOME ACCESS [FAIL]: What's happening? I can't even read your home directory.")
         return
     }
     console.log("HOME ACCESS [OK]: My power enables me to see that you have " + files[0] + " in your home directory. I'm unstoppable!")
})

// read /etc/os-release content
var re = /PRETTY_NAME="(.*)"/;
fs.readFileSync('/etc/os-release').toString().split('\n').forEach(
function (line) {
        var os = line.replace(re, "$1")
        if (os !== line) {
            console.log("FILE SYSTEM: I see from /etc/os-release that I'm running on " + os + ".")
        }
});

