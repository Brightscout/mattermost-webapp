// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint
    header/header: "off",
    indent: ["error", 4, { "CallExpression": { "arguments": "first" } }]
 */

import _ from 'underscore';

import {DashboardActionTypes} from 'utils/constants.jsx';
import {logger} from 'utils/riff';

const initialState = {
    numMeetings: 0,
    lastFetched: new Date('January 1, 2000 00:01:00'),
    shouldFetch: true,
    meetings: [],
    loadingError: {
        status: false,
        message: '',
    },

    // 'loaded' at idx if utterances, influence, and timeline are all loaded
    statsStatus: [],

    // initial number of meetings to load
    numLoadedMeetings: 2,

    // array holding processed data for each meeting.
    processedUtterances: [],
    influenceData: [],
    timelineData: [],
};

const getMeetingIndex = (meetings, meetingId) => {
    const meetingIds = _.pluck(meetings, '_id');
    return _.indexOf(meetingIds, meetingId);
};

const updateDataArray = (arr, idx, newData) => {
    return [...arr.slice(0, idx), newData, ...arr.slice(idx + 1)];
};

const updateArr = (state, arr, meetingId, newData) => {
    const idx = getMeetingIndex(state, meetingId);
    logger.debug(`index of meeting ${meetingId} is: ${idx}`, state.meetings);
    return updateDataArray(arr, idx, newData);
};

const updateLoadingStatus = (state) => {
    const unzipped = _.unzip([
        state.processedUtterances,
        state.influenceData,
        state.timelineData,
    ]);

    logger.debug('meetingLoaded UNZIPPED:', unzipped);

    // a meeting is loaded if all processed datasets for the meeting exist
    const meetingLoaded = unzipped.map((processedDatasets) => processedDatasets.every((dataset) => Boolean(dataset)));
    logger.debug('meetingLoaded', meetingLoaded);

    const isLoadedArray = meetingLoaded.map((isLoaded) => {return isLoaded ? 'loaded' : 'loading';});
    return {
        ...state,
        statsStatus: isLoadedArray,
    };
};

const dashboard = (state = initialState, action) => {
    switch (action.type) {
    case DashboardActionTypes.LOG_OUT:
        return initialState;
    case DashboardActionTypes.DASHBOARD_LOAD_MORE_MEETINGS:
        return {
            ...state,
            numLoadedMeetings: state.numLoadedMeetings + 1,
        };
    case DashboardActionTypes.DASHBOARD_FETCH_MEETINGS: {
        const timeDiff = ((((new Date()).getTime() - new Date(state.lastFetched).getTime()) / 1000) > 5);
        logger.debug('time should fetch?', timeDiff);
        return {
            ...state,
            meetings: action.meetings ? action.meetings : state.meetings,
            numMeetings: action.meetings ?
                action.meetings.length :
                state.meetings.length,
            lastFetched: new Date(),
            shouldFetch: timeDiff,
        };
    }
    case DashboardActionTypes.DASHBOARD_LOADING_ALL_MEETINGS: {
        const numMeetings = state.meetings.length;
        return {
            ...state,
            statsStatus: new Array(numMeetings).fill('loading'),
            processedUtterances: new Array(numMeetings).fill(false),
            influenceData: new Array(numMeetings).fill(false),
            timelineData: new Array(numMeetings).fill(false),
        };
    }
    case DashboardActionTypes.DASHBOARD_LOADING_ERROR:
        return {
            ...state,
            error: {
                ...action.message,
                ...action.status,
            },
        };

    case DashboardActionTypes.DASHBOARD_MEETING_LOAD_STATUS:
        return {
            ...state,
            statsStatus: updateArr(state.meetings,
                                   state.statsStatus,
                                   action.meetingId,
                                   action.status),
        };
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_UTTERANCES:
        return updateLoadingStatus({
            ...state,
            processedUtterances: updateArr(state.meetings,
                                           state.processedUtterances,
                                           action.meetingId,
                                           action.processedUtterances),
        });
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_INFLUENCE:
        return updateLoadingStatus({
            ...state,
            influenceData: updateArr(state.meetings,
                                     state.influenceData,
                                     action.meetingId,
                                     action.influenceData),
        });
    case DashboardActionTypes.DASHBOARD_FETCH_MEETING_TIMELINE:
        return updateLoadingStatus({
            ...state,
            timelineData: updateArr(state.meetings,
                                    state.timelineData,
                                    action.meetingId,
                                    action.timelineData),
        });
    default:
        return state;
    }
};

export default dashboard;
