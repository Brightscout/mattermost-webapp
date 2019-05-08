/* eslint-disable header/header */
import {Client4} from 'mattermost-redux/client';
import {buildQueryString} from 'mattermost-redux/utils/helpers';

export async function sendSurvey(userID, meetingID, success, error) {
    const {data, error: err} = await Client4.doFetch(`/plugins/survey/send${buildQueryString({user_id: userID, meeting_id: meetingID})}`, {method: 'get'});

    if (data) {
        if (success) {
            success(data);
        }
    } else if (err && error) {
        error(err);
    }
}
