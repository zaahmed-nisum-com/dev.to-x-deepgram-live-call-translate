import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import translate from "translate";
import LanguageSelect from "../../components/selectLanguage";
import { firebaseMethods } from "../../utilities/firebase.utilities";
import { localStorageMethods } from "../../utilities/localstorage.utilities";

const localTracks = {
  videoTrack: null,
  audioTrack: null,
};
let remoteUsers = {};

function Streaming(props) {
  const [config, setConfig] = useState({
    rtc: {
      client: null,
      joined: false,
      published: false,
      localStream: null,
      remoteStreams: [],
      params: {},
    },
  });
  const options = [
    { value: "en", label: "English" },
    { value: "de", label: "Deutsch" },
    { value: "es_419", label: "Español – América Latina" },
    { value: "fr", label: "Français" },
    { value: "pt_br", label: "Português – Brasil" },
    { value: "zh_cn", label: "中文 – 简体" },
    { value: "ja", label: "日本語" },
  ];
  const [selectedValue, setSelectedValue] = useState({
    value: "en",
    label: "English",
  });
  const [isMute, setIsMute] = useState(true);
  const [translateArr, setTranslateArr] = useState([]);
  const [meetingDetails, setMeetingDetails] = useState({});
  const [translatedData, setTranslatedData] = useState({});
  const [userName, setUserName] = useState("");
  const [personWhoSpeaking, setPersonWhoSpeaking] = useState(0);
  let currentText = "";

  useEffect(async () => {
    const a = await localStorageMethods.getItem("meeting-room-user");
    addNewUser();
    setUserName(a);
    joinChannel();
    getRealTimeMeetingUpdate();
  }, []);

  const getRealTimeMeetingUpdate = async () => {
    try {
      const userName = await localStorageMethods.getItem("meeting-room-user");
      const getMeetingRoomDetails =
        await firebaseMethods.getRealTimeRoomDetails();
      getMeetingRoomDetails.onSnapshot((querySnapshot) => {
        setMeetingDetails(querySnapshot.data());
        const myTranslatedData = querySnapshot
          .data()
          .users.filter((item) => item.userName == userName);
        if (querySnapshot.data().hasOwnProperty("userTurn")) {
          setPersonWhoSpeaking(querySnapshot.data().userTurn);
          userName == querySnapshot.data().userTurn && setIsMute(false);
        }
        setTranslatedData(myTranslatedData[0]);
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isMute) {
      getSpeak();
    }
    if (isMute && currentText != "") {
      handleTextToTranslate(currentText);
    } else {
    }
  }, [isMute]);

  const addNewUser = async () => {
    let userName = "";
    let getUserNameFromLocalStorage = await localStorageMethods.getItem(
      "meeting-room-user"
    );
    // create user name if not present in localstorag or will use localstorage user name
    if (!getUserNameFromLocalStorage) {
      userName = Math.floor(Math.random() * 10000);
      await localStorageMethods.setItem("meeting-room-user", userName);
    } else {
      userName = await localStorageMethods.getItem("meeting-room-user");
    }

    const getMeetingRoomDetails = await firebaseMethods.getMeetingRoomDetails();
    setMeetingDetails(getMeetingRoomDetails);

    //checking meeting has any user and adding new user
    if (
      getMeetingRoomDetails.hasOwnProperty("users") &&
      getMeetingRoomDetails.users.length > 0 &&
      getMeetingRoomDetails?.users.findIndex(
        (item) => item.userName == userName
      ) < 0
    ) {
      //adding new user
      getMeetingRoomDetails.users.push({
        userName,
        language: "en",
        translatingArr: [],
      });
    } else {
      if (
        getMeetingRoomDetails.hasOwnProperty("users") &&
        getMeetingRoomDetails.users.length > 0 &&
        getMeetingRoomDetails?.users.findIndex(
          (item) => item.userName == userName
        ) >= 0
      ) {
        const selfUser = getMeetingRoomDetails?.users.filter(
          (item) => item.userName == userName
        );
        setTranslateArr(selfUser[0].translatingArr);
      }

      //adding new first user.
      if (!getMeetingRoomDetails.hasOwnProperty("users")) {
        getMeetingRoomDetails["users"] = [
          { userName: userName, translatingArr: [], language: "en" },
        ];
      }
    }
    if (!getMeetingRoomDetails.hasOwnProperty("userTurn")) {
      getMeetingRoomDetails.userTurn = userName;
    }
    //firebase method for add user
    console.log("getMeetingRoomDetails",getMeetingRoomDetails)
    await firebaseMethods.addUserInMeeting(getMeetingRoomDetails);
    // console.log("getMeetingRoomDetails", getMeetingRoomDetails);
  };

  const joinChannel = async (role) => {
    config.rtc.client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
    config.rtc.client.on("client-role-changed", () => {});
    config.rtc.client.on("connection-state-change", (curState, prevState) => {
      if (curState === "CONNECTING") {
        // this.setState({ isWatchPartyStart: true });
      }
      if (curState === "RECONNECTING") {
        // this.setState({ isWatchPartyStart: true });
      }
      if (curState === "CONNECTED") {
        // this.setState({ isWatchPartyStart: false });
      }
    });
    config.rtc.client.setClientRole("host");
    config.rtc.client.on("user-published", handleUserPublished);
    config.rtc.client.on("user-unpublished", handleUserUnpublished);
    [config.rtc.uid, localTracks.audioTrack, localTracks.videoTrack] =
      await Promise.all([
        config.rtc.client.join(
          props.APP_ID,
          "streaming",
          "00620a9600e27274878acd571fbb8ca7f0fIAARSQfS92TB7rF/xuO5dz5OFOgfgQgouwr5wKF2BVd/7WEYQyYAAAAAEAAg4mLWdR9EYgEAAQB1H0Ri",
          null
        ),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);
    localTracks.videoTrack.play("local_stream");
    await config.rtc.client.publish(Object.values(localTracks));
  };

  const handleUserPublished = (user, mediaType) => {
    const id = user.uid;
    subscribe(user, mediaType);
  };

  const handleUserUnpublished = (user) => {
    console.log({ user });
  };

  const subscribe = async (user, mediaType) => {
    await config.rtc.client.subscribe(user, mediaType);
    if (mediaType === "video") {
      user.videoTrack.play(`remote_video`);
    }
    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  };

  const handleChangeLanguageSelector = async (value) => {
    try {
      //getting user from localstorage
      const userName = await localStorageMethods.getItem("meeting-room-user");
      //getting meeting details from firebase
      const getMeetingRoomDetails =
        await firebaseMethods.getMeetingRoomDetails();
      //getting user details from getMeetingRoomDetails
      const selfUser = getMeetingRoomDetails?.users.findIndex(
        (item) => item.userName == userName
      );
      //set language for self user
      getMeetingRoomDetails.users[selfUser].language = value.value;
      await firebaseMethods.updateUserLanguageInMeeting(getMeetingRoomDetails);
      setSelectedValue(value);
    } catch (error) {
      console.log(error);
    }
  };

  const getSpeak = async () => {
    console.log("getSpeak");
    let mediaRecorder = null;
    await window.navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((res) => {
        mediaRecorder = new MediaRecorder(res, {
          audio: true,
        });
      });
    console.log("mediaRecorder", mediaRecorder);
    let socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
      "token",
      "06e1b33e25def49e8c87daa5940991afdc34b0b5",
    ]);
    console.log("socket", socket);
    socket.onopen = () => {
      mediaRecorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0 && socket.readyState == 1) {
          socket.send(event.data);
        }
      });
      mediaRecorder.start(500);
    };
    socket.onmessage = async (message) => {
      const received = JSON.parse(message.data);
      const transcript = received.channel.alternatives[0].transcript;
      if (transcript && received.is_final) {
        console.log(transcript);
        currentText = currentText.concat(" " + transcript);
        console.log(currentText);
        const convertedLanguage = await translate(currentText, "en");
        // mediaRecorder.stop();
      }
    };
  };

  const handleTextToTranslate = async (text) => {
    try {
      const userName = await localStorageMethods.getItem("meeting-room-user");
      const otherUserLanguage = meetingDetails.users.filter(
        (item) => item.userName !== userName
      )[0];
      // console.log("otherUserLanguage", otherUserLanguage);
      const convertedLanguage = await translate(
        text,
        otherUserLanguage.language
      );
      // console.log("convertedLanguage", convertedLanguage);
      const otherUserIndex = meetingDetails.users.findIndex(
        (item) => item.userName !== userName
      );
      meetingDetails.users[otherUserIndex].translatingArr.push(
        convertedLanguage
      );
      meetingDetails.userTurn = meetingDetails.users[otherUserIndex].userName;
      await firebaseMethods.updateUserLanguageInMeeting(meetingDetails);
      currentText = "";
    } catch (error) {}
  };

  return (
    <div>
      {console.log("currentText", currentText)}
      <div
        style={{
          width: "250px",
          margin: "20px",
          position: "absolute",
          zIndex: "1000",
          right: "30px",
        }}
      >
        <LanguageSelect
          options={options}
          handleChange={handleChangeLanguageSelector}
          selectedValue={selectedValue}
        />
      </div>
      <div
        className="controllers d-flex text-center"
        style={{
          height: "50px",
          width: " 300px",
          position: "absolute",
          zIndex: "1000",
          bottom: "15px",
          left: "0px",
          right: "0px",
          margin: "0 auto",
          backgroundColor: "white",
          boxShadow: "3px 3px 5px -1px black",
          borderRadius: "15px",
        }}
      >
        <div className="w-50 align-self-center">
          <div
            className="text-center align-self-center cursor-pointer m-auto"
            style={{
              width: "fit-content",
            }}
          >
            {!isMute && (
              <i
                class="fa-solid fa-volume-high"
                onClick={() => setIsMute(!isMute)}
                style={{ fontSize: "12px" }}
              ></i>
            )}
            {isMute && (
              <i
                class="fa-solid fa-volume-xmark"
                onClick={() => setIsMute(!isMute)}
                style={{ fontSize: "12px" }}
              ></i>
            )}
          </div>
        </div>
        <div className="w-50 align-self-center">
          <div
            className="m-auto align-self-center cursor-pointer"
            style={{
              width: "fit-content",
            }}
          >
            <i
              class="fa-solid fa-phone-slash text-danger"
              style={{ fontSize: "12px" }}
            ></i>
          </div>
        </div>
      </div>
      <div
        className="controllers d-flex text-center"
        style={{
          padding: "10px",
          fontWeight: "bold",
          width: " 300px",
          position: "absolute",
          zIndex: "1000",
          bottom: "80px",
          left: "0px",
          right: "0px",
          margin: "0 auto",
          backgroundColor: "white",
          boxShadow: "3px 3px 5px -1px black",
          borderRadius: "15px",
        }}
      >
        {Object.keys(translatedData).length > 0 &&
          translatedData.hasOwnProperty("userName") &&
          translatedData.userName == userName &&
          translatedData.translatingArr.length > 0 &&
          translatedData.translatingArr[
            translatedData.translatingArr.length - 1
          ]}
      </div>
      <div className="d-flex " style={{ height: "100vh" }}>
        <div className="w-50 h-100" id="local_stream" style={{}}></div>
        <div className="w-50 h-100" id="remote_video" style={{}}></div>
      </div>
    </div>
  );
}

export default Streaming;
