import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import translate from "translate";
import LanguageSelect from "../../components/selectLanguage";

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
    { value: "English", label: "en" },
    { value: "Deutsch", label: "de" },
    { value: "es_419", label: "Español – América Latina" },
    { value: "fr", label: "Français" },
    { value: "pt_br", label: "Português – Brasil" },
    { value: "zh_cn", label: "中文 – 简体" },
    { value: "ja", label: "日本語" },
  ];
  const [selectedValue, setSelectedValue] = useState({ value: "English", label: "en" });
  const [isMute, setIsMute] = useState(false);

  useEffect(() => {
    // joinChannel();
    getTextConvertToSelectedLanguage();
  }, []);

  const getTextConvertToSelectedLanguage = async () => {
    const text = await translate("Hello world", "de");
    console.log("text", text);
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
    console.log("handleUserPublished");
    console.log({ user });
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
    setSelectedValue(value);
  };

  return (
    <div>
      {console.log("selectedValue", selectedValue)}
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
            <i class="fa-solid fa-phone-slash text-danger" style={{ fontSize: "12px" }}></i>
          </div>
        </div>
      </div>
      <div className="d-flex " style={{ height: "100vh" }}>
        <div className="w-50 h-100" id="local_stream" style={{}}></div>
        <div className="w-50 h-100" id="remote_video" style={{}}></div>
      </div>
    </div>
  );
}

export default Streaming;
