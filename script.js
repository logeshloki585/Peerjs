const PRE = "DELTA"
const SUF = "MEET"
var room_id;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null
var screenSharing = false

var ICE_config = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      {
        urls: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
      {
        urls: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      }
    ]
  };

function createRoom() {
    console.log("Creating Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = PRE + room + SUF;
    peer = new Peer(room_id,{
        host: 'myserver.com',
port: 9000,
debug: true,
config: { 'iceServers': [
{ 'url': 'stun:stun.l.google.com:19302' }
] }
    })
    peer.on('open', (id) => {
        console.log("Peer Connected with ID: ", id)
        hideModal()
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
        }, (err) => {
            console.log(err)
        })
        notify("Waiting for peer to join.")
    })
    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            setRemoteStream(stream)
        })
        currentPeer = call;
    })
}

function setLocalStream(stream) {

    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream) {
    let video = document.getElementById("remote-video");
    video.srcObject = stream;

    var playPromise = video.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('video playing')
        }).catch(error => {            
            console.error('Autoplay was prevented:', error);
        });
    }
}

function hideModal() {
    document.getElementById("entry-modal").hidden = true
}

function notify(msg) {
    let notification = document.getElementById("notification")
    notification.innerHTML = msg
    notification.hidden = false
    setTimeout(() => {
        notification.hidden = true;
    }, 3000)
}

function joinRoom() {
    console.log("Joining Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = PRE + room + SUF;
    hideModal()
    peer = new Peer({
        host: 'myserver.com',
port: 9000,
debug: true,
config: { 'iceServers': [
{ 'url': 'stun:stun.l.google.com:19302' }
] }
    })
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id)
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
            notify("Joining peer")
            let call = peer.call(room_id, stream)
            call.on('stream', (stream) => {
                setRemoteStream(stream);
            })
            currentPeer = call;
        }, (err) => {
            console.log(err)
        })

    })
}

function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing()
        }
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
            screenSharing = true
        }
        console.log(screenStream)
    })
}

function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false
}
