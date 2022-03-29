import { firebaseInstance } from "../configuration/firebase";
import firebase from "firebase/compat/app";
const db = firebaseInstance.firestore();
const meetingRoomId = "f60daf4AddUQ62p4m2vG";

export const firebaseMethods = {
  translateLanguage: async (data) => {
    try {
      const addTranslateToMeetingRoom = db
        .collection("meeting-room")
        .doc(meetingRoomId);
      addTranslateToMeetingRoom.update({ ...data.userTranslationData });
    } catch (error) {
      console.log(error);
    }
  },
  getMeetingRoomDetails: async (data) => {
    const getMeetingRoomDetails = await db
      .collection("meeting-room")
      .doc(meetingRoomId)
      .get();
    return getMeetingRoomDetails.data();
  },
  getRealTimeRoomDetails: async () => {
    const getMeetingRoomDetails = db
      .collection("meeting-room")
      .doc(meetingRoomId);
    return getMeetingRoomDetails;
  },
  addUserInMeeting: async (data) => {
    try {
      await db.collection("meeting-room").doc(meetingRoomId).update(data);
      const getUser = await db
        .collection("meeting-room")
        .doc(meetingRoomId)
        .get();
      return getUser.data();
    } catch (error) {
      console.log(error);
    }
  },
  updateUserLanguageInMeeting: async (data) => {
    try {
      await db.collection("meeting-room").doc(meetingRoomId).update(data);
    } catch (error) {}
  },
};
