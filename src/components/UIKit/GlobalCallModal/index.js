import React, { useEffect, useImperativeHandle, useState } from "react";
import {
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RTCView } from "react-native-webrtc";
import WebrtcSimple from "react-native-webrtc-simple";
import { CallEvents } from "react-native-webrtc-simple/WebRtcSimple/contains";
import { Timer } from "./../index";
import { styles } from "./styles";

let interval = null;
const ringtime = 20;

export const globalCallRef = React.createRef();
export const globalCall = {
  call: (sessionId, userData) => {
    globalCallRef?.current?.call(sessionId, userData);
  },
};

StatusBar.setBarStyle("dark-content");
const GlobalCallUI = React.forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const stream = WebrtcSimple.getLocalStream();
  const [remoteStream, setRemoteStream] = useState(null);
  const [type, setType] = useState("");
  const [audioEnable, setAudioEnable] = useState(true);
  const [videoEnabled, setVideoEnable] = useState(true);
  const [cameraType, setCameraType] = useState("front");
  const [remoteCameraType, setRemoteCameraType] = useState("front");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useImperativeHandle(ref, () => {
    return { call };
  });

  useEffect(() => {
    WebrtcSimple.listenings.getRemoteStream((remoteStream) => {
      setRemoteStream(remoteStream);
    });

    WebrtcSimple.listenings.callEvents((type, userData) => {
      console.log(type, userData);

      if (type !== CallEvents.message) {
        setType(type);
      }

      if (type === CallEvents.received || type === CallEvents.start) {
        video(true);
        audio(true);
        let time = ringtime;
        interval = setInterval(() => {
          time = time - 1;
          if (time === 0) {
            endCall();
            clearInterval(interval);
          }
        }, 1000);

        if (type === CallEvents.received) {
          WebrtcSimple.events.vibration.start(20);

          if (userData?.sender_name && userData?.sender_avatar) {
            setName(userData.sender_name);
            setAvatar(userData.sender_avatar);
          }
        } else {
          if (userData?.receiver_name && userData?.receiver_avatar) {
            setName(userData.receiver_name);
            setAvatar(userData.receiver_avatar);
          }
        }
        setVisible(true);
      }

      if (type === CallEvents.accept) {
        clearInterval(interval);
        WebrtcSimple.events.vibration.cancel();
      }

      if (type === CallEvents.end) {
        clearInterval(interval);
        WebrtcSimple.events.vibration.cancel();
        setVisible(false);
        setAudioEnable(true);
        setVideoEnable(true);
      }

      if (type === CallEvents.message) {
        if (userData?.message?.type === "SWITCH_CAMERA") {
          setRemoteCameraType(userData?.message?.value);
        }
      }
    });
  }, []);

  const call = (sessionId, userData) => {
    WebrtcSimple.events.call(sessionId, userData);
  };

  const acceptCall = () => {
    WebrtcSimple.events.acceptCall();
  };

  const endCall = () => {
    WebrtcSimple.events.endCall();
  };

  const switchCamera = () => {
    if (cameraType === "front") {
      setCameraType("end");
      WebrtcSimple.events.message({ type: "SWITCH_CAMERA", value: "end" });
    } else {
      setCameraType("front");
      WebrtcSimple.events.message({ type: "SWITCH_CAMERA", value: "front" });
    }
    WebrtcSimple.events.switchCamera();
  };

  const video = (enable) => {
    WebrtcSimple.events.videoEnable(enable);
  };

  const audio = (enable) => {
    WebrtcSimple.events.audioEnable(enable);
  };

  const renderIcon = (icon, color, onPress) => {
    return (
      <View>
        <TouchableOpacity
          style={[styles.btnCall, { backgroundColor: color }]}
          onPress={() => {
            onPress();
          }}
        >
          <Image
            style={[
              styles.icon,
              { tintColor: color === "white" ? "black" : "white" },
            ]}
            source={icon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={() => {
        setVisible(false);
      }}
    >
      <View style={styles.modalCall}>
        {name.length > 0 && type !== CallEvents.accept && (
          <Text style={styles.name}>{name}</Text>
        )}
        {avatar.length > 0 && type !== CallEvents.accept && (
          <Image style={styles.avatar} source={{ uri: avatar }} />
        )}
        {(type === CallEvents.start || type === CallEvents.received) && (
          <Timer style={styles.timer} textStyle={styles.textTimer} start />
        )}
        {type === CallEvents.accept && remoteStream && (
          <View style={{ flex: 1 }}>
            {stream && (
              <View style={styles.boxMyStream}>
                <RTCView
                  mirror={cameraType === "front" ? true : false}
                  streamURL={stream.toURL()}
                  zOrder={999}
                  style={styles.myStream}
                  objectFit="cover"
                />
                {type === CallEvents.accept && (
                  <Timer
                    style={styles.timer2}
                    textStyle={styles.textTimer2}
                    start
                  />
                )}
                <TouchableOpacity onPress={() => switchCamera()}>
                  <Image
                    style={styles.iconCamera}
                    source={require("./icon/camera.png")}
                  />
                </TouchableOpacity>
              </View>
            )}

            <RTCView
              mirror={remoteCameraType === "front" ? true : false}
              streamURL={remoteStream.toURL()}
              zOrder={99}
              style={styles.stream}
              objectFit="cover"
            />
          </View>
        )}
        {type === CallEvents.start && (
          <View style={styles.manageCall}>
            {renderIcon(require("./icon/endcall.png"), "red", () => {
              setVisible(false);
              endCall();
            })}
          </View>
        )}
        {type === CallEvents.received && (
          <View style={styles.manageCall}>
            {renderIcon(require("./icon/call.png"), "green", () => {
              acceptCall();
            })}
            {renderIcon(require("./icon/endcall.png"), "red", () => {
              setVisible(false);
              endCall();
            })}
          </View>
        )}
        {type === CallEvents.accept && (
          <View style={styles.manageCall}>
            {renderIcon(
              require("./icon/micro.png"),
              audioEnable ? "white" : "red",
              () => {
                audio(!audioEnable);
                setAudioEnable(!audioEnable);
              }
            )}

            {renderIcon(
              require("./icon/video.png"),
              videoEnabled ? "white" : "red",
              () => {
                video(!videoEnabled);
                setVideoEnable(!videoEnabled);
              }
            )}

            {renderIcon(require("./icon/endcall.png"), "red", () => {
              setVisible(false);
              endCall();
            })}
          </View>
        )}
      </View>
    </Modal>
  );
});

export default GlobalCallUI;
