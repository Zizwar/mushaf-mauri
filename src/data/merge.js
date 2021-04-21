const fs = require('fs')
let textWarsh1 = require('./textWarsh1.json');

let textWarsh2 = require('./textWarsh2.json');

const saveTojson = (data) => {
    try {
        console.log(" start warite")
        fs.writeFileSync("textWarsh.json", JSON.stringify(data));
        console.log("end save json :)")
    } catch (err) {
        console.error(err)
    }
}
//play merge thow object


console.log("play merge foreach");



for (let ii = 0; ii <= textWarsh1.length-1; ii++) {
   textWarsh1[ii] = [textWarsh1[ii], textWarsh2[ii]];

  

}


saveTojson(textWarsh1)