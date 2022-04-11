import "expo-dev-client";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  Button,
  SafeAreaView,
  Text,
  TextInput,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { mediaDevices, RTCView } from "react-native-webrtc";
import WebrtcSimple from "react-native-webrtc-simple";
import {
  globalCallRef,
  GlobalCallUI,
  globalCall,
} from "./src/components/UIKit";

export default function App() {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [userId, setUserId] = useState(null);
  const [text, onChangeText] = useState("");

  useEffect(() => {
    const configuration = {
      optional: null,
      key: Math.random().toString(36).substring(2, 4), //optional
    };

    WebrtcSimple.start(configuration)
      .then((status) => {
        if (status) {
          const stream = WebrtcSimple.getLocalStream();

          setStream(stream);

          WebrtcSimple.getSessionId((id) => {
            setUserId(id);
            console.log("UserId: ", id);
          });
        }
      })
      .catch();

    WebrtcSimple.listenings.callEvents((type, userData) => {
      console.log(`[${userId}]`, "Type: ", type);
      // START_CALL
      // RECEIVED_CALL
      // ACCEPT_CALL
      // END_CALL
      // MESSAGE
      // START_GROUP_CALL
      // RECEIVED_GROUP_CALL
      // JOIN_GROUP_CALL
      // LEAVE_GROUP_CALL

      if (type === "END_CALL") {
        setRemoteStream(null);
      }
    });

    WebrtcSimple.listenings.getRemoteStream((remoteStream) => {
      setRemoteStream(remoteStream);
      console.log("Remote stream", remoteStream);
    });
  }, []);

  // const onCallEvents = useCallback(() => {}, [userId]);

  const callToUser = (userId) => {
    const data = {};
    WebrtcSimple.events.call(userId, data);
  };

  const acceptCall = () => {
    WebrtcSimple.events.acceptCall();
  };

  const endCall = () => {
    WebrtcSimple.events.endCall();
  };

  const switchCamera = () => {
    WebrtcSimple.events.switchCamera();
  };

  const video = (enable) => {
    WebrtcSimple.events.videoEnable(enable);
  };

  const audio = (enable) => {
    WebrtcSimple.events.audioEnable(enable);
  };

  const sendMessage = (message) => {
    WebrtcSimple.events.message(message);
  };

  const groupCall = (sessionId) => {
    const data = {};
    WebrtcSimple.events.groupCall(sessionId, data);
  };

  const joinGroup = (groupSessionId) => {
    WebrtcSimple.events.joinGroup(groupSessionId);
  };

  const leaveGroup = () => {
    WebrtcSimple.events.leaveGroup();
  };

  const call = async () => {
    // callToUser(text);
    globalCall.call(text, {});
  };

  const start = async () => {
    WebrtcSimple.events.streamEnable(true);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.body}>
        <Text style={{ textAlign: "center", fontSize: 18 }}>{userId}</Text>
        <TextInput
          style={{
            borderColor: "gray",
            margin: 12,
            borderWidth: 1,
            borderRadius: 10,
            padding: 10,
          }}
          onChangeText={onChangeText}
          value={text}
        />
        <Button title="Call" onPress={call} />
        {/* <Button title="Accept Call" onPress={acceptCall} /> */}
        {/* <Button title="End Call" onPress={endCall} /> */}
        {/* <Button title="Show Stream" onPress={start} /> */}
        {/* <Button title="Switch Camera" onPress={switchCamera} /> */}
        {/* {remoteStream && (
          <RTCView streamURL={remoteStream.toURL()} style={styles.stream} />
        )} */}
        {/* <View style={styles.footer}></View> */}
      </SafeAreaView>
      <GlobalCallUI ref={globalCallRef} />
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    ...StyleSheet.absoluteFill,
  },
  stream: {
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.lighter,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
