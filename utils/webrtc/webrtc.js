// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import SimpleWebRtc from 'simplewebrtc';
import Sibilant from 'sibilant-webaudio';
import parse from 'url-parse';

import * as WebRtcActions from 'actions/webrtc_actions';
import {updateRiffMeetingId} from 'actions/views/riff';
import {app, logger, config as riffConfig} from 'utils/riff';

export const createWebRtcLink = (teamName, channelName) => {
    const link = parse(window.location.href, true);
    link.set('pathname', `${teamName}/${channelName}/video/${generateUID()}`);
    logger.debug('Created webrtc Link:', link.href);
    return link;
};

function generateUID() {
    // I generate the UID from two parts here
    // to ensure the random number provide enough bits.
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ('000' + firstPart.toString(36)).slice(-3);
    secondPart = ('000' + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

export function isScreenShareSourceAvailable() {
    // currently we only support chrome v70+ (w/ experimental features enabled, if necessary)
    // and firefox
    return (navigator.getDisplayMedia ||
        navigator.mediaDevices.getDisplayMedia ||
        Boolean(navigator.mediaDevices.getSupportedConstraints().mediaSource));
}

export default function (localVideoNode, dispatch, getState) {
    //TODO: make dynamic
    const webRtcConfig = {
        localVideoEl: localVideoNode,
        remoteVideosEl: '',
        autoRequestMedia: true,
        url: riffConfig.signalmasterUrl,
        socketio: {
            path: riffConfig.signalmasterPath + '/socket.io',
            forceNew: true,
        },
        media: {
            audio: true,
            video: {
                width: {ideal: 640},
                height: {ideal: 480},
                frameRate: {max: 30},
            },
        },
        debug: true,
    };

    const webrtc = new SimpleWebRtc(webRtcConfig);

    webrtc.on('videoAdded', (video, peer) => {
        logger.debug('added video', video, peer);
        dispatch(WebRtcActions.addPeer({peer}));
    });

    webrtc.on('videoRemoved', (video, peer) => {
        const state = getState();

        // get riffId
        if (state.views.webrtc.inRoom) {
            dispatch(WebRtcActions.removePeer({peer,
                                               videoEl: video})); // eslint-disable-line indent
            const [riffId, ...rest] = peer.nick.split('|'); // eslint-disable-line no-unused-vars

            //TODO: state get here is wrong.
            dispatch(WebRtcActions.riffParticipantLeaveRoom(state.views.riff.meetingId, riffId));
        }
    });

    webrtc.on('screenAdded', (video, peer) => {
        logger.debug('adding shared screen!', video, 'from', peer);
        dispatch(WebRtcActions.addSharedScreen({videoEl: video, peer}));
    });

    webrtc.on('screenRemoved', (video) => {
        logger.debug('removing shared screen!', video);
        dispatch(WebRtcActions.removeSharedScreen());
    });

    webrtc.on('localScreenAdded', (video) => {
        dispatch(WebRtcActions.addLocalSharedScreen(video));
    });

    webrtc.on('localScreenRemoved', (video) => {
        dispatch(WebRtcActions.removeLocalSharedScreen(video));
    });

    // this happens if the user ends via the chrome button
    // instead of our button
    webrtc.on('localScreenStopped', (video) => {
        dispatch(WebRtcActions.removeLocalSharedScreen(video));
    });

    webrtc.on('localScreenRequestFailed', () => {
        dispatch(WebRtcActions.getDisplayError());
    });

    webrtc.on('localStreamRequestFailed', (event) => {
        dispatch(WebRtcActions.getMediaError(event));
    });

    webrtc.on('localStream', (stream) => {
        if (stream.active) {
            dispatch(WebRtcActions.getMediaSuccess());
        }
    });

    webrtc.on('readyToCall', (/*video, peer*/) => {
        const stream = webrtc.webrtc.localStreams[0];
        dispatch(WebRtcActions.getMediaSuccess());
        const sib = new Sibilant(stream);
        if (sib) {
            webrtc.stopVolumeCollection = () => {
                // sib.unbind('volumeChange');
            };

            webrtc.startVolumeCollection = () => {
                sib.bind('volumeChange', (data) => {
                    const state = getState();
                    if (!state.views.webrtc.inRoom) {
                        dispatch(WebRtcActions.volumeChanged(data));
                    }
                });
            };

            webrtc.startVolumeCollection();
        }

        sib.bind('stoppedSpeaking', (data) => {
            app.service('utterances').create({
                participant: getState().entities.users.currentUserId,
                room: getState().views.webrtc.roomName,
                startTime: data.start.toISOString(),
                endTime: data.end.toISOString(),
                token: getState().views.riff.authToken,
            }).then((res) => {
                dispatch(updateRiffMeetingId(res.meeting));
            }).catch((err) => { // eslint-disable-line no-unused-vars
                // error thrown, throw it?
            });
        });

        webrtc.stopSibilant = () => {
            sib.unbind('volumeChange');
            sib.unbind('stoppedSpeaking');
        };

        // TODO: add volume collection and sibilant
        dispatch(WebRtcActions.readyToCall());
    });

    webrtc.changeNick = function (nick) {
        this.config.nick = nick;
        this.webrtc.config.nick = nick;
    };

    return webrtc;
}

