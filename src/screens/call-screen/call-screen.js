import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import { Icon } from '../../components/icon';
import { useIsMounted } from '../../utils/hooks';
import generateJwt from '../../utils/jwt';
import {
  EventType,
  useZoom,
  ZoomVideoSdkUser,
  Errors,
} from '@zoom/react-native-videosdk';


export function CallScreen({ navigation, route }) {
  const [isInSession, setIsInSession] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [users, setUsersInSession] = useState([]);
  const [fullScreenUser, setFullScreenUser] = useState();
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const isMounted = useIsMounted();
  const zoom = useZoom();

  useEffect(() => {
    (async () => {
      const { params } = route;
      const token = await generateJwt(params.sessionName, params.roleType);
      Linking.openURL(
        `whatsapp://send?text=token:${token} sesionName:${params.sessionName}`,
      );
      try {
        await zoom.joinSession({
          sessionName: params.sessionName,
          sessionPassword: params.sessionPassword,
          token: token,
          userName: params.displayName,
          audioOptions: {
            connect: true,
            mute: false,
          },
          videoOptions: {
            localVideoOn: false,
          },
          sessionIdleTimeoutMins: parseInt(params.sessionIdleTimeoutMins, 10),
        });
      } catch (e) {
        Alert.alert('Failed to join the session');
        setTimeout(() => navigation.goBack(), 1000);
      }
    })();
  }, []);

  useEffect(() => {
    const sessionJoinListener = zoom.addListener(
      EventType.onSessionJoin,
      async (session) => {
        setIsInSession(true);
        zoom.session.getSessionName().then(setSessionName);
        const mySelf = new ZoomVideoSdkUser(session.mySelf);
        const remoteUsers =
          await zoom.session.getRemoteUsers();
        const muted = await mySelf.audioStatus.isMuted();
        const speakerOn = await zoom.audioHelper.getSpeakerStatus();
        setUsersInSession([mySelf, ...remoteUsers]);
        setIsMuted(muted);
        setIsSpeakerOn(speakerOn);
      }
    );

    const sessionLeaveListener = zoom.addListener(
      EventType.onSessionLeave,
      () => {
        setIsInSession(false);
        setUsersInSession([]);
        navigation.goBack();
      }
    );

    // görüşme ilk başladığında microfonun hatalı olmasını engelliyor
    const userAudioStatusChangedListener = zoom.addListener(
      EventType.onUserAudioStatusChanged,
      async ({ changedUsers }) => {
        const mySelf = new ZoomVideoSdkUser(
          await zoom.session.getMySelf()
        );
        changedUsers.map((u) => {
          if (mySelf.userId === u.userId) {
            mySelf.audioStatus.isMuted().then((muted) => setIsMuted(muted));
          }
        });
      }
    );

    const userJoinListener = zoom.addListener(
      EventType.onUserJoin,
      async ({ remoteUsers }) => {
        if (!isMounted()) return;
        const mySelf = await zoom.session.getMySelf();
        const remote = remoteUsers.map(
          (user) => new ZoomVideoSdkUser(user)
        );
        setUsersInSession([mySelf, ...remote]);
      }
    );

    const userLeaveListener = zoom.addListener(
      EventType.onUserLeave,
      async ({
        remoteUsers,
        leftUsers,
      }) => {
        if (!isMounted()) return;
        const mySelf = await zoom.session.getMySelf();
        const remote = remoteUsers.map(
          (user) => new ZoomVideoSdkUser(user)
        );
        if (fullScreenUser) {
          leftUsers.map((user) => {
            if (fullScreenUser.userId === user.userId) {
              setFullScreenUser(mySelf);
              return;
            }
          });
        } else {
          setFullScreenUser(mySelf);
        }
        setUsersInSession([mySelf, ...remote]);
      }
    );

    const eventErrorListener = zoom.addListener(
      EventType.onError,
      async (error) => {
        console.log('Error: ' + JSON.stringify(error));
        switch (error.errorType) {
          case Errors.SessionJoinFailed:
            Alert.alert('Failed to join the session');
            setTimeout(() => navigation.goBack(), 1000);
            break;
          default:
        }
      }
    );

    return () => {
      sessionJoinListener.remove();
      sessionLeaveListener.remove();
      userAudioStatusChangedListener.remove();
      userJoinListener.remove();
      userLeaveListener.remove();
      eventErrorListener.remove();
    };
  }, [zoom, route, users, isMounted]);

  const leaveSession = (endSession) => {
    zoom.leaveSession(endSession);
    navigation.goBack();
  };

  const onPressAudio = async () => {
    const mySelf = await zoom.session.getMySelf();
    const muted = await mySelf.audioStatus.isMuted();
    setIsMuted(muted);
    muted
      ? zoom.audioHelper.unmuteAudio(mySelf.userId)
      : zoom.audioHelper.muteAudio(mySelf.userId);
  };

  const onPressLeave = async () => {
    const mySelf = await zoom.session.getMySelf();
    const options = [
      {
        text: 'Leave Session',
        onPress: () => leaveSession(false),
      },
    ];

    if (mySelf.isHost) {
      options.unshift({
        text: 'End Session',
        onPress: () => leaveSession(true),
      });
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options.map((option) => option.text)],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex !== 0) {
            options[buttonIndex - 1].onPress();
          }
        }
      );
    } else {
      Alert.alert('Do you want to leave this session?', '', options, {
        cancelable: true,
      });
    }
  };

  const onPressSpeaker = async () => {
    zoom.audioHelper.setSpeaker(!isSpeakerOn);
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.topWrapper} pointerEvents="box-none">
          <View style={styles.sessionInfo}>
            <View style={styles.sessionInfoHeader}>
              <Text style={styles.sessionName}>{sessionName}</Text>
              <Icon
                name={route.params.sessionPassword ? 'locked' : 'unlocked'}
              />
            </View>
            <Text style={styles.numberOfUsers}>
              {`Participants: ${users.length}`}
            </Text>
          </View>
          <View style={styles.topRightWrapper}>
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={onPressLeave}
            >
              <Text style={styles.leaveText}>LEAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.middleWrapper} pointerEvents="box-none">
          <View style={styles.controls}>
            <Icon
              containerStyle={styles.controlButton}
              name={isMuted ? 'unmute' : 'mute'}
              onPress={onPressAudio}
            />
            <Icon
              containerStyle={styles.speakerButton}
              name={isSpeakerOn ? 'speakerOff' : 'speakerOn'}
              onPress={onPressSpeaker}
            />
          </View>
        </View>
        {!isInSession && (
          <View style={styles.connectingWrapper}>
            <Text style={styles.connectingText}>Connecting...</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#232323',
  },
  fullScreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  connectingWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  safeArea: {
    flex: 1,
  },
  contents: {
    flex: 1,
    alignItems: 'stretch',
  },
  sessionInfo: {
    width: 200,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sessionInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  numberOfUsers: {
    fontSize: 13,
    color: '#FFF',
  },
  topWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 8,
    paddingTop: 16,
  },
  topRightWrapper: {
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  middleWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  bottomWrapper: {
    paddingHorizontal: 8,
  },
  leaveButton: {
    paddingVertical: 4,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  leaveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E02828',
  },
  videoInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoInfoText: {
    fontSize: 12,
    color: '#FFF',
  },
  chatList: {
    paddingRight: 16,
  },
  chatMessage: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  chatUser: {
    fontSize: 14,
    color: '#CCC',
  },
  chatContent: {
    fontSize: 14,
    color: '#FFF',
  },
  controls: {
    alignSelf: 'center',
    paddingTop: 24,
  },
  controlButton: {
    marginBottom: 12,
  },
  speakerButton: {
    marginBottom: 12,
  },
  userList: {
    width: '100%',
  },
  userListContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chatInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    height: 40,
    marginVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
    color: '#AAA',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  chatSendButton: {
    height: 36,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  modalTitleText: {
    fontSize: 18,
    marginBottom: 8,
  },
  modalActionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalAction: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  moreItem: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreItemText: {
    fontSize: 16,
  },
  moreItemIcon: {
    width: 36,
    height: 36,
    marginLeft: 48,
  },
  moreModalTitle: {
    fontSize: 24,
  },
  renameInput: {
    width: 200,
    marginTop: 16,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: '#AAA',
    color: '#000',
  },
  keyboardArea: {
    height: 0,
    width: 0,
    zIndex: -100,
  },
});