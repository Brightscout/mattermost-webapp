// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {DashboardActionTypes} from 'utils/constants.jsx';
import _ from 'underscore';

const initialState = {
    numMeetings: 0,
    lastFetched: new Date('January 1, 2000 00:01:00'),
    shouldFetch: true,
    numMeetings: 0,
    meetings: [],
    loadingError: {
        status: false,
        message: ''
    },

    // 'loaded' at idx if utterances, influence, and timeline are all loaded
    statsStatus: [],

    processedUtterances: [],
    influenceData: [],
    timelineData: []
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

const updateLoadingStatus = (state) => {
    let unzipped = _.unzip([state.processedUtterances,
                            state.influenceData,
                            state.timelineData]);

    console.log("meetingLoaded UNZIPPED:", unzipped)

    let meetingLoaded = _.map(unzipped, (triple) => {
        let bools = _.map(triple, (t) => { return !(t === false) });
        console.log("meetingLoaded mapped to bools:", bools)
        return _.every(bools);
    });

    console.log("meetingLoaded", meetingLoaded)
    let isLoadedArray = _.map(meetingLoaded, (m) => { return m ? 'loaded' : 'loading'});
    return {...state,
            statsStatus: isLoadedArray};
}

const dashboard = (state = initialState, action) => {
    switch (action.type) {
    case DashboardActionTypes.LOG_OUT:
        return initialState;
    case DashboardActionTypes.DASHBOARD_FETCH_MEETINGS:
        let timeDiff = ((((new Date()).getTime() - new Date(state.lastFetched).getTime())/1000) > 5);
        console.log("time should fetch?", timeDiff);
        return {
            ...state,
            meetings: action.meetings ? action.meetings : state.meetings,
            numMeetings: action.meetings ?
                action.meetings.length :
                state.meetings.length,
            lastFetched: new Date(),
            shouldFetch: timeDiff
        };
    case DashboardActionTypes.DASHBOARD_LOADING_ALL_MEETINGS:
        return {
            ...state,
            statsStatus: _.map(state.meetings, (m) => {return 'loading';}),
            processedUtterances: _.map(state.meetings, (m) => {return false;}),
            influenceData: _.map(state.meetings, (m) => {return false;}),
            timelineData: _.map(state.meetings, (m) => {return false;})
        };
    case DashboardActionTypes.DASHBOARD_LOADING_ERROR:
        return {
            ...state,
            error: {
                ...action.message,
                ...action.status
            }
        };

    case DashboardActionTypes.DASHBOARD_MEETING_LOAD_STATUS:
        return {
            ...state,
            statsStatus: updateArr(state.meetings,
                                   state.statsStatus,
                                   action.meetingId,
                                   action.status)
        };
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_UTTERANCES:
        return updateLoadingStatus({
            ...state,
            processedUtterances: updateArr(state.meetings,
                                           state.processedUtterances,
                                           action.meetingId,
                                           action.processedUtterances)
        });
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_INFLUENCE:
        return updateLoadingStatus({
            ...state,
            influenceData: updateArr(state.meetings,
                                     state.influenceData,
                                     action.meetingId,
                                     action.influenceData)
        });
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_TIMELINE:
        return updateLoadingStatus({
            ...state,
            timelineData: updateArr(state.meetings,
                                    state.timelineData,
                                    action.meetingId,
                                    action.timelineData)
        });
    default:
        return state;
    }
};

export default dashboard;
