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
  const config = useState({
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
    value: "English",
    label: "en",
  });
  const [isMute, setIsMute] = useState(false);
  const [translateArr, setTranslateArr] = useState([]);
  const [meetingDetails, setMeetingDetails] = useState({});
  const [otherPersonData, setOtherPersonData] = useState("");

  useEffect(() => {
    // joinChannel();
    addNewUser();
    getRealTimeMeetingUpdate();
    // getTextConvertToSelectedLanguage();
  }, []);

  const getRealTimeMeetingUpdate = async () => {
    try {
      const userName = await localStorageMethods.getItem("meeting-room-user");
      const getMeetingRoomDetails =
        await firebaseMethods.getRealTimeRoomDetails();
      getMeetingRoomDetails.onSnapshot((querySnapshot) => {
        console.log(querySnapshot.data(), "snapshot");
        setMeetingDetails(querySnapshot.data());
        const otherPersonData = querySnapshot
          .data()
          .users.filter((item) => item.userName !== userName);
        // console.log("otherPersonData",otherPersonData)
        setOtherPersonData(otherPersonData[0]);
      });
    } catch (error) {
      console.log(error);
    }
  };

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
    //firebase method for add user
    await firebaseMethods.addUserInMeeting(getMeetingRoomDetails);
    // console.log("getMeetingRoomDetails", getMeetingRoomDetails);
  };

  // const getTextConvertToSelectedLanguage = async () => {
  //   const text = await translate("Hello world", "de");
  //   console.log("text", text);
  // };

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
          "00620a9600e27274878acd571fbb8ca7f0fIADGM6krREwA7/cHkISSpFS07XiZlRuWYVXGrpNSLrP0aWEYQyYAAAAAEABHuwtvz709YgEAAQDPvT1i",
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

  useEffect(() => {
    if (isMute) {
      handleTextToTranslate();
    }
  }, [isMute]);

  const handleTextToTranslate = async () => {
    try {
      const userName = await localStorageMethods.getItem("meeting-room-user");
      const otherUserLanguage = meetingDetails.users.filter(
        (item) => item.userName !== userName
      )[0];
      // console.log("otherUserLanguage", otherUserLanguage);
      const text = "Hi I am Zain";
      const convertedLanguage = await translate(
        text,
        otherUserLanguage.language
      );
      // console.log("convertedLanguage", convertedLanguage);
      const otherUserIndex = meetingDetails.users.findIndex(
        (item) => item.userName !== userName
      );
      console.log(otherUserIndex);
      console.log(meetingDetails.users[otherUserIndex]);
      meetingDetails.users[otherUserIndex].translatingArr.push(
        convertedLanguage
      );
      console.log(meetingDetails);
      await firebaseMethods.updateUserLanguageInMeeting(meetingDetails);
    } catch (error) {}
  };

  return (
    <div>
      {console.log("translateArr", translateArr)}
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
          padding:'10px',
          fontWeight:'bold',
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
        {Object.keys(otherPersonData).length > 0 &&
          otherPersonData.translatingArr.length > 0 &&
          otherPersonData.translatingArr[
            otherPersonData.translatingArr.length - 1
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
