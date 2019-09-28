(function() {    
    let connectButton = null;
    let disconnectButton = null;
    let sendButton = null;
    let messageInputBox = null;
    let receiveBox = null;
    
    let connection = null;
    
    let channel = null;

    const TURN_USERNAME = "<REDACTED>";
    const TURN_CREDENTIAL = "<REDACTED>";
        
    
    function startup() {
      connectButton = document.getElementById('connectButton');
      disconnectButton = document.getElementById('disconnectButton');
      sendButton = document.getElementById('sendButton');
      messageInputBox = document.getElementById('message');
      receiveBox = document.getElementById('receivebox');
    
      connectButton.addEventListener('click', connectPeers, false);
      disconnectButton.addEventListener('click', disconnectPeers, false);
      sendButton.addEventListener('click', sendMessage, false);
    }
    
    function connectPeers() {
      
      connection = new RTCPeerConnection({
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

      channel = connection.createDataChannel("sendChannel", {
        ordered: false,
        maxRetransmits: 0,
      });
      channel.onopen = handleSendChannelStatusChange;
      channel.onclose = handleSendChannelStatusChange;
      channel.onmessage = handleReceiveMessage;

      connection.onconnectionstatechange = event => console.log(connection.connectionState);
      
      connection.createOffer().then((description) => {
        return connection.setLocalDescription(description);
      }).then(() => {
        return gatherIceCandidates(connection);
      }).then((iceCandidates) => {
        const body = JSON.stringify({
          offer: connection.localDescription.toJSON(),
          iceCandidates,
        });
        return fetch("/rtc/connection", {
          body,
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        });
      }).then((response) => {
        return response.json();
      }).then((answer) => {
        return connection.setRemoteDescription(answer);
      }).catch(console.error);
    }

    function gatherIceCandidates(connection) {
      return new Promise((resolve) => {
        const candidates = [];
        const onIceCandidate = (event) => {
          if (!event.candidate) {
            connection.removeEventListener("icecandidate",  onIceCandidate);
            resolve(candidates);
          } else {
            candidates.push(event.candidate.toJSON());
          }
        }
        connection.addEventListener("icecandidate", onIceCandidate);
      });
    }
    
    function sendMessage() {
      const message = messageInputBox.value;
      channel.send(message);
      
      messageInputBox.value = "";
      messageInputBox.focus();
    }
    
    function handleSendChannelStatusChange() {
      if (channel) {
        const state = channel.readyState;
        console.log(state);
      
        if (state === "open") {
          messageInputBox.disabled = false;
          messageInputBox.focus();
          sendButton.disabled = false;
          disconnectButton.disabled = false;
          connectButton.disabled = true;
        } else {
          messageInputBox.disabled = true;
          sendButton.disabled = true;
          connectButton.disabled = false;
          disconnectButton.disabled = true;
        }
      }
    }

    function handleReceiveMessage(event) {
      const el = document.createElement("p");
      el.textContent = event.data;
      receiveBox.appendChild(el);
    }
    
    function disconnectPeers() {
          
      channel.close();
            
      connection.close();
  
      channel = null;
      connection = null;
            
      connectButton.disabled = false;
      disconnectButton.disabled = true;
      sendButton.disabled = true;
      
      messageInputBox.value = "";
      messageInputBox.disabled = true;
    }
    
    
    window.addEventListener('load', startup, false);
  })();