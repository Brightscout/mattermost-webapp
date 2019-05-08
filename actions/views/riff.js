// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint header/header: "off" */

import {RiffServerActionTypes} from 'utils/constants';
import {app, socket, logger} from 'utils/riff';

export const riffAuthSuccess = (token) => {
    return {
        type: RiffServerActionTypes.RIFF_AUTHENTICATE_SUCCESS,
        token,
    };
};

export const riffAuthFail = (err) => {
    return {
        type: RiffServerActionTypes.RIFF_AUTHENTICATE_FAIL,
        error: err,
    };
};

export const updateTurnData = (transitions, turns) => {
    logger.debug('updating turn data:', transitions, turns);
    return {
        type: RiffServerActionTypes.RIFF_TURN_UPDATE,
        transitions,
        turns,
    };
};

export const updateMeetingParticipants = (participants) => {
    logger.debug('updating riff meeting participants', participants);
    return {
        type: RiffServerActionTypes.RIFF_PARTICIPANTS_CHANGED,
        participants,
    };
};

export const updateRiffMeetingId = (meetingId) => {
    return {
        type: RiffServerActionTypes.RIFF_MEETING_ID_UPDATE,
        meetingId,
    };
};

export const participantLeaveRoom = (meetingId, participantId) => {
    return app.
        service('meetings').
        patch(meetingId, {
            remove_participants: [participantId],
        }).
        then(() => {
            logger.debug(`removed participant: ${participantId} from meeting ${meetingId}`);
            return true;
        }).
        catch((err) => {
            logger.error('shit, caught an error:', err);
            return false;
        });
};

export const attemptRiffAuthenticate = () => (dispatch) => {
    app.authenticate({
        strategy: 'local',
        email: 'default-user-email',
        password: 'default-user-password',
    }).
        then((result) => {
            logger.debug('riff data server auth result!: ', result);
            dispatch(riffAuthSuccess(result.accessToken));

            //return this.recordMeetingJoin();
        }).
        catch((err) => {
            logger.warn('riff data server auth ERROR:', err);
            // dispatch(riffAuthFail(err));
            logger.info('trying to authenticate again...');
            // dispatch(attemptRiffAuthenticate());
            dispatch(riffAuthSuccess('result.accessToken'));
        });
};

export const riffAddUserToMeeting = (
    uid,
    email,
    roomName,
    nickName,
    url,
    currentUsers,
    token
) => {
    const parts = currentUsers.map((user) => {
        return {participant: user.id};
    });

    return socket.emit('meetingJoined', {
        participant: uid,
        email,
        name: nickName,
        participants: parts,
        room: roomName,
        meetingUrl: url,
        consent: true,
        consentDate: new Date().toISOString(),
        token,
    });
};
