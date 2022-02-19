function initPeerConnection() {
  peerConnection = new RTCPeerConnection();
  peerConnection.addEventListener('icecandidate', (data) => {
    socket.emit('ice', data.candidate, currentChannel);
  });
  peerConnection.addEventListener('track', (data) => {
    peerVideo.srcObject = data.streams[0];
  });
  myMediaStream.getTracks().forEach((track) => peerConnection.addTrack(track, myMediaStream));
}

function closePeerConnection() {
  peerConnection.close();
  peerConnection = null;
  peerVideo.srcObject = null;
}

async function sendOffer() {
  console.log('Send Offer');
  dataChannel = peerConnection.createDataChannel('chat');
  dataChannel.addEventListener('message', receiveMessage);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, currentChannel);
}

async function sendAnswer(offer) {
  console.log('Send Answer');
  peerConnection.addEventListener('datachannel', (event) => {
    dataChannel = event.channel;
    dataChannel.addEventListener('message', receiveMessage);
  });
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, currentChannel);
}

async function sendIceCandidate(answer) {
  console.log('Send IceCandidate');
  await peerConnection.setRemoteDescription(answer);
}

async function shareStream(icecandidate) {
  console.log('Receive IceCandidate');
  await peerConnection.addIceCandidate(icecandidate);
}

socket.on('offer', async (offer) => {
  console.log('Receive Offer');
  await sendAnswer(offer);
});

socket.on('answer', async (answer) => {
  console.log('Receive Answer');
  await sendIceCandidate(answer);
});

socket.on('ice', async (icecandidate) => {
  await shareStream(icecandidate);
});
