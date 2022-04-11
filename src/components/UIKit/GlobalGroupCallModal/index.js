import React, { useEffect, useImperativeHandle, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { RTCView } from "react-native-webrtc";
import WebrtcSimple from "react-native-webrtc-simple";
import { CallEvents } from "react-native-webrtc-simple/WebRtcSimple/contains";
import { Timer } from "./../Timer";
import { styles } from "./styles";

let interval = null;
const ringtime = 20;
let status = "none";
const { width, height } = Dimensions.get("window");

export const globalGroupCallRef = React.createRef();
export const globalGroupCall = {
  call: (sessionId, userData) => {
    globalGroupCallRef?.current?.call(sessionId, userData);
  },
};

StatusBar.setBarStyle("dark-content");
const GlobalCallUI = React.forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [callStatus, setCallStatus] = useState("none");
  const stream = WebrtcSimple.getLocalStream();
  const [remotes, setRemotes] = useState([]);
  const [groupSessionId, setGroupSessionId] = useState([]);
  const [audioEnable, setAudioEnable] = useState(true);
  const [videoEnabled, setVideoEnable] = useState(true);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useImperativeHandle(ref, () => {
    return { call };
  });

  useEffect(() => {
    WebrtcSimple.listenings.getRemoteStream((remoteStream, sessionId) => {
      if (status === "incall" || status === "start" || status === "ring") {
        const checkSessionId = remotes.filter((e) => e.sessionId === sessionId);
        if (checkSessionId.length === 0) {
          setRemotes((e) => [...e, { remoteStream, sessionId }]);
        }
      }
    });

    WebrtcSimple.listenings.callEvents((type, userData) => {
      if (type === CallEvents.receivedGroup) {
        WebrtcSimple.events.vibration.start(20);
        setVisible(true);
        video(true);
        audio(true);

        if (userData?.groupSessionId?.length > 0) {
          let time = ringtime;
          interval = setInterval(() => {
            time = time - 1;
            if (time === 0) {
              leaveGroup();
              clearInterval(interval);
              setVisible(false);
            }
          }, 1000);

          setName(userData.name);
          setAvatar(userData.avatar);
          setCallStatus("ring");
          status = "ring";
          setGroupSessionId(userData.groupSessionId);
        }
      }

      if (type === CallEvents.leaveGroup) {
        if (userData?.sessionId) {
          const listRemote = remotes.filter(
            (e) => e.sessionId !== userData?.sessionId
          );
          setRemotes(listRemote);
        } else {
          setRemotes([]);
          clearInterval(interval);
        }
      }
      if (type === CallEvents.joinGroup) {
        clearInterval(interval);
        if (userData?.sessionId) {
          if (status === "incall" || status === "start") {
            WebrtcSimple.events.addStream(userData?.sessionId);
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    if (remotes.length > 0) {
      setCallStatus("incall");
    }
  }, [remotes]);

  const call = (sessionId, userData) => {
    if (sessionId.length > 0) {
      setVisible(true);
      video(true);
      audio(true);
      status = "start";
      setCallStatus("start");

      let time = ringtime;
      interval = setInterval(() => {
        time = time - 1;
        if (time === 0) {
          leaveGroup();
          clearInterval(interval);
          setVisible(false);
        }
      }, 1000);

      setName(userData?.name);
      setAvatar(userData?.avatar);
      WebrtcSimple.events.groupCall(sessionId, userData);
    }
  };

  const joinGroup = () => {
    WebrtcSimple.events.vibration.cancel();
    status = "incall";
    setCallStatus("incall");
    WebrtcSimple.events.joinGroup(groupSessionId);
  };

  const leaveGroup = () => {
    WebrtcSimple.events.vibration.cancel();
    status = "none";
    setCallStatus("none");
    WebrtcSimple.events.leaveGroup();
  };

  const video = (enable) => {
    WebrtcSimple.events.videoEnable(enable);
  };

  const audio = (enable) => {
    WebrtcSimple.events.audioEnable(enable);
  };

  const switchCamera = () => {
    WebrtcSimple.events.switchCamera();
  };

  const _renderStream = ({ item, index }) => {
    return (
      <RTCView
        key={index.toString()}
        mirror
        streamURL={item.remoteStream.toURL()}
        zOrder={999}
        style={[
          styles.remoteStream,
          remotes.length === 1 && { width: width, height: height },
        ]}
        objectFit="cover"
      />
    );
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
        {(callStatus === "start" || callStatus === "ring") && (
          <Text style={styles.name}>{name}</Text>
        )}
        {(callStatus === "start" || callStatus === "ring") && (
          <Image style={styles.avatar} source={{ uri: avatar }} />
        )}
        {(callStatus === "start" || callStatus === "ring") && (
          <Timer style={styles.timer} textStyle={styles.textTimer} start />
        )}

        {callStatus === "incall" && (
          <View style={styles.boxMyStream}>
            <RTCView
              mirror
              streamURL={stream.toURL()}
              zOrder={999}
              style={styles.myStream}
              objectFit="cover"
            />
            <Timer style={styles.timer2} textStyle={styles.textTimer2} start />
            <TouchableOpacity onPress={() => switchCamera()}>
              <Image
                style={styles.iconCamera}
                source={require("./icon/camera.png")}
              />
            </TouchableOpacity>
          </View>
        )}
        {remotes.length > 0 && (
          <View style={styles.wrapListStream}>
            <FlatList
              extraData={remotes}
              data={remotes}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
              renderItem={_renderStream}
            />
          </View>
        )}
        {callStatus === "start" && (
          <View style={styles.manageCall}>
            {renderIcon(require("./icon/endcall.png"), "red", () => {
              setVisible(false);
              leaveGroup();
            })}
          </View>
        )}

        {callStatus === "ring" && (
          <View style={styles.manageCall}>
            {renderIcon(require("./icon/call.png"), "green", () => {
              joinGroup();
            })}
            {renderIcon(require("./icon/endcall.png"), "red", () => {
              setVisible(false);
              leaveGroup();
            })}
          </View>
        )}

        {callStatus === "incall" && (
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
              leaveGroup();
            })}
          </View>
        )}
      </View>
    </Modal>
  );
});

export default GlobalCallUI;
