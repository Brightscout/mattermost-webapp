// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';

import $ from 'jquery';
import * as UserAgent from 'utils/user_agent.jsx';
import moment from 'moment';
import lifecycle from 'react-pure-lifecycle';

import {
    loadRecentMeetings,
    selectMeeting,
    loadMeetingData,
} from '../../actions/views/dashboard';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/users';
import * as RiffServerActionCreators from '../../actions/views/riff';

import DashboardView from './DashboardView';

const mapStateToProps = (state) => {
    console.log("dashboard state:", state);
    const {lti, dashboard, riff} = state.views;
    const riffState = {...lti, ...dashboard, ...riff};
    return {
        user: getCurrentUser(state),
        riff,
        riffAuthToken: riffState.authToken,
        fetchMeetingsStatus: riffState.fetchMeetingsStatus,
        fetchMeetingsMessage: riffState.fetchMeetingsMessage,
        meetings: riffState.meetings,
        numMeetings: riffState.numMeetings,
        lastFetched: riffState.lastFetched,
        shouldFetch: riffState.shouldFetch,
        selectedMeeting: riffState.selectedMeeting || null,
        processedUtterances: riffState.processedUtterances,
        statsStatus: riffState.statsStatus,
        processedNetwork: riffState.networkData,
        processedTimeline: riffState.timelineData,
        loadingError: riffState.loadingError
    };
};

const mapDispatchToProps = (dispatch) => ({
    loadRecentMeetings: (uid) => {
        dispatch(loadRecentMeetings(uid));
    },
    handleRefreshClick: (event, uid) => {
        dispatch(loadRecentMeetings(uid));
    },
    handleMeetingClick: (event, uid, meeting) => {
        event.preventDefault();

        /// TODO: Why do we want 2 distinct actions to select the meeting and to load the meeting data? -mjl 2018-09-05
        dispatch(selectMeeting(meeting));
        dispatch(loadMeetingData(uid, meeting._id));
    },
    authenticateRiff: () => {
        console.log("attempt data-server auth");
        dispatch(RiffServerActionCreators.attemptRiffAuthenticate());
    },
});

const formatMeetingDuration = (meeting) => {
    if (!meeting || meeting === null) {
        return '';
    }

    // support showing data on in progress meeting by giving them a fake end time of now
    if (!meeting.endTime) {
        meeting = {...meeting, endTime: new Date()};
    }
    const diff = moment(new Date(meeting.endTime)).diff(
        moment(new Date(meeting.startTime)),
        'minutes'
    );
    return `${diff} minutes`;
};

const mapMergeProps = (stateProps, dispatchProps, ownProps) => {
    console.log("dashboard user:", stateProps.user);
    return {
        ...stateProps,
        ...dispatchProps,
        ...ownProps,
        selectedMeetingDuration: formatMeetingDuration(
            stateProps.meetings[0]
        ),
    };
};

const componentDidUpdate = (props) => {
    if (props.riffAuthToken && props.shouldFetch) {
        props.loadRecentMeetings(props.user.id);
    }
};

const componentDidMount = (props) => {
    if (props.riffAuthToken) {
        props.loadRecentMeetings(props.user.id);
    }

    $('body').addClass('app__body');

    // IE Detection
    if (UserAgent.isInternetExplorer() || UserAgent.isEdge()) {
        $('body').addClass('browser--IE');
    }
};

const componentWillMount = (props) => {
    console.log("dashboard user:", props.user);
    if (!props.riff.authToken) {
        props.authenticateRiff();
    }
};

// componentWillUnmount = () => {
//     $('body').removeClass('app__body');
// }

const methods = {
    componentDidUpdate,
    componentDidMount,
    componentWillMount
};

const Dashboard = lifecycle(methods)(DashboardView);

export default withRouter(
    connect(
        mapStateToProps,
        mapDispatchToProps,
        mapMergeProps
    )(Dashboard)
);
