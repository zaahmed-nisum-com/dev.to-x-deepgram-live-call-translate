import React, { useEffect, useState } from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";

const localTracks = {
    videoTrack: null,
    audioTrack: null
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
            params: {}
        },
    });

    useEffect(() => {
        joinChannel()
    }, [])

    const joinChannel = async role => {
        config.rtc.client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
        config.rtc.client.on("client-role-changed", () => { });
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
        [config.rtc.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
            config.rtc.client.join(props.APP_ID, 'streaming', '00620a9600e27274878acd571fbb8ca7f0fIAB4CuPEp7Yt/664IWDIJ2f/dBmasIcTylj/IPRYIFCspGEYQyYAAAAAEADjTvSOdEs6YgEAAQB1Szpi', null),
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack()
        ]);
        localTracks.videoTrack.play("local_stream");
        await config.rtc.client.publish(Object.values(localTracks));
    };

    const handleUserPublished = (user, mediaType) => {
        console.log('handleUserPublished')
        console.log({ user })
        const id = user.uid;
        subscribe(user, mediaType);
    };

    const handleUserUnpublished = user => {
        console.log({ user })
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

    return (
        <div>
            <div>
                <div
                    className=""
                    id="local_stream"
                    style={{
                        height: '100px',
                        width: '100px',
                        border: 'solid',
                    }}>
                </div>
                <div
                    className=""
                    id="remote_video"
                    style={{
                        height: '100px',
                        width: '100px',
                        border: 'solid',
                    }}>
                </div>
            </div>
        </div>
    );
}

export default Streaming;