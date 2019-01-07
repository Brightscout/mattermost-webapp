// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {DashboardActionTypes} from 'utils/constants.jsx';
import _ from 'underscore';

const initialState = {
    numMeetings: 0,
    fetchMeetingsStatus: 'loading',
    fetchMeetingsMessage: 'loading',
    lastFetched: new Date('January 1, 2000 00:01:00'),
    shouldFetch: true,
    numMeetings: 0,
    meetings: [],

    timelineStatus: [],
    statsStatus: [],
    networkStatus: [],

    processedUtterances: [],
    networkData: [],
    timelineData: [],
};

const getMeetingIndex = (meetings, meetingId) => {
    let meetingIds = _.pluck(meetings, '_id');
    return _.indexOf(meetingIds, meetingId);
}

const updateDataArray = (arr, idx, newData) => {
    return [...arr.slice(0, idx), newData, ...arr.slice(idx+1)];
}

const updateArr = (state, arr, meetingId, newData) => {
    let idx = getMeetingIndex(state, meetingId);
    console.log("index of meeting", meetingId, "is:", idx, state.meetings);
    return updateDataArray(arr, idx, newData);
}

const dashboard = (state = initialState, action) => {
    switch (action.type) {
    case DashboardActionTypes.LOG_OUT:
        return initialState;
    case DashboardActionTypes.DASHBOARD_FETCH_MEETINGS:
        //console.log("time diff:", (((new Date()).getTime() - new Date(state.lastFetched).getTime())/1000) > 5)
        return {
            ...state,
            fetchMeetingsStatus: action.status,
            fetchMeetingsMessage: action.message,
            meetings: action.meetings ? action.meetings : state.meetings,
            numMeetings: action.meetings ?
                action.meetings.length :
                state.meetings.length,
            lastFetched: new Date(),
            shouldFetch:
                    (new Date().getTime() -
                        new Date(state.lastFetched).getTime()) /
                        1000 >
                    5 * 60,
        };
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_STATS:
        if (state.meetings.length > 0) {
            console.log("meeting state at 0 is:", state.meetings[0], state.meetings[0]._id, action)
        }
        if (action.status === 'loading') {
            if (action.meeting === 'all') {
                return {
                    ...state,
                    statsStatus: _.map(state.meetings, (m) => {return 'loading';})
                }
            } else {
                return {
                    ...state,
                    statsStatus: updateArr(state.meetings,
                                           state.statsStatus,
                                           action.meetingId,
                                           action.status)
                };
            }
        } else {
            return {
                ...state,
                statsStatus: updateArr(state.meetings,
                                       state.statsStatus,
                                       action.meetingId,
                                       action.status),
                processedUtterances: updateArr(state.meetings,
                                               state.processedUtterances,
                                               action.meetingId,
                                               action.processedUtterances)
            };
        }
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_NETWORK:
        return {
            ...state,
            networkStatus: updateArr(state.meetings,
                                     state.networkStatus,
                                     action.meetingId,
                                     action.status),
            networkData: updateArr(state.meetings,
                                   state.networkData,
                                   action.meetingId,
                                   action.networkData)
        };
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_TIMELINE:
        return {
            ...state,
            timelineStatus: updateArr(state.meetings,
                                      state.timelineStatus,
                                      action.meetingId,
                                      action.status),
            timelineData: updateArr(state.meetings,
                                    state.timelineData,
                                    action.meetingId,
                                    action.timelineData)
        };
    default:
        return state;
    }
};

export default dashboard;
