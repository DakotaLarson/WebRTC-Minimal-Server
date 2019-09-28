const express = require("express");
const bodyParser = require("body-parser");
const {RTCPeerConnection} = require("wrtc");

const TURN_USERNAME = "<REDACTED>";
const TURN_CREDENTIAL = "<REDACTED>";

function onPostConnection(req, res) {
    const connection = new RTCPeerConnection({
        // Account needed: http://numb.viagenie.ca/
        iceServers: [
            {
              urls: "stun:numb.viagenie.ca:3478",
            },
            {
              urls: "turn:numb.viagenie.ca:3478",
              username: TURN_USERNAME,
              credential: TURN_CREDENTIAL,
            }
        ]
    });

    connection.ondatachannel = (channelEvent => {
        const channel = channelEvent.channel;
        channel.onmessage = (messageEvent => {
            channel.send("received " + messageEvent.data);
        });
    });

    const offer = req.body.offer; 
    const iceCandidates = req.body.iceCandidates;
    iceCandidates.forEach(iceCandidate => {
        connection.addIceCandidate(iceCandidate);
    });
    
    connection.setRemoteDescription(offer).then(() => {
        return connection.createAnswer();
    }).then((answer) => {
        return connection.setLocalDescription(answer);
    }).then(() => {
        res.send(connection.localDescription);     
    }).catch((err) => {
        console.log(err);
        res.status(500).send(err);
    });
    
}

const app = express();
app.use(bodyParser.json());
app.use("/rtc/", express.static("./public"));
app.post("/rtc/connection", onPostConnection);
app.listen(4500);