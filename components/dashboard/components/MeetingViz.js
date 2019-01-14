import React, {Component, Fragment} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import styled, {injectGlobal, keyframes} from 'styled-components';
import {Link} from 'react-router-dom';
import ReactChartkick, {ColumnChart, PieChart} from 'react-chartkick';
import {ScaleLoader} from 'react-spinners';
import MaterialIcon from 'material-icons-react';
import Chart from 'chart.js';
import moment from 'moment';
import _ from 'underscore';

import TurnChart from './TurnChart';
import InfluenceChart from './InfluenceChart';
import TimelineChart from './TimelineChart';

import PropTypes from 'prop-types';

import {
    loadRecentMeetings,
    selectMeeting,
    loadMeetingData,
} from '../../../actions/views/dashboard';

const SpaceBetweeen = styled.div.attrs({
    className: 'space-between',
})`
    display: flex;
    justify-content: space-between;
    width: 320px;
`;

const getMeetingIndex = (meetings, meetingId) => {
    let meetingIds = _.pluck(meetings, '_id');
    return _.indexOf(meetingIds, meetingId);
}

const formatMeetingDuration = (meeting) => {
  if (meeting === null) {
    return '';
  }
  // support showing data on in progress meeting by giving them a fake end time of now
  if (!meeting.endTime) {
    meeting = { ...meeting, endTime: new Date()  };
  };
  let diff = moment(new Date(meeting.endTime)).diff(moment(new Date(meeting.startTime)), 'minutes');
  return `${diff} minutes`;
}

const mapStateToProps = (state, ownProps) => {
    const {lti, dashboard, riff} = state.views;
    const riffState = {...lti, ...dashboard, ...riff};
    const meetingId = ownProps.meeting._id;
    const idx = getMeetingIndex(dashboard.meetings, meetingId);
    console.log("meeting for this viz is:", dashboard.meetings[idx]);
    console.log("timeline for this viz is:", idx, dashboard.timelineData[idx], dashboard.timelineData, dashboard.timelineStatus);
    return {
        processedUtterances: dashboard.processedUtterances[idx],
        processedinfluence: dashboard.influenceData[idx],
        processedTimeline: dashboard.timelineData[idx],
        selectedMeetingDuration: formatMeetingDuration(dashboard.meetings[idx]),
        loaded: dashboard.statsStatus[idx] == 'loaded'
    };

};

const mapDispatchToProps = (dispatch) => ({
    loadMeetingData: (uid, meetingId) => {
        dispatch(loadMeetingData(uid, meetingId));
    }
});

class MeetingViz extends React.PureComponent {
    static propTypes = {
        processedUtterances: PropTypes.array.isRequired,
        user: PropTypes.object.isRequired,
        influenceData: PropTypes.object.isRequired,
        timelineData: PropTypes.object.isRequired,
        meeting: PropTypes.object.isRequired,
        loaded: PropTypes.bool.isRequired
    }

    static defaultProps = {
        processedUtterances: [],
    }

    constructor(props) {
        super(props)
        this.state = {
        }

        // only load if the data hasn't been loaded yet.
        if (!this.props.loaded) {
            console.log("MEETING NOT LOADED; LOADING MEETING", props.meeting._id);
            props.loadMeetingData(props.user.id, props.meeting._id);
        }
    }

    render() {
        let meetingDate = moment(this.props.meeting.startTime).format("ha MMM Do");
        return (
            <div>
                <div
                  className=''
                  style={{paddingBottom: '2rem',
                          paddingTop: '1rem',
                  paddingLeft: '1rem'}}>
                  <h3>Meeting at: {meetingDate} </h3>
                  <SpaceBetweeen>
                    <span> Attendees: {this.props.processedUtterances.length}</span>
                  </SpaceBetweeen>
                  <SpaceBetweeen>
                    <span> Duration: {this.props.selectedMeetingDuration} </span>
                  </SpaceBetweeen>
                  <div className='column is-half has-text-left'>

                  </div>
                </div>
                <div className="columns is-centered" style={{marginLeft: "3rem"}}>
                  <div className="column" style={{paddingBottom: "0px"}}>
                    <div className="columns is-centered">
                        <div className="column is-one-third has-text-centered is-centered"
                               style={{alignItems: 'center', display: 'flex'}}>
                          <TurnChart processedUtterances={this.props.processedUtterances}
                                     participantId={this.props.user.id}/>
                      </div>
                        <div className="column is-two-thirds has-text-left">
                          <InfluenceChart influenceType={"mine"}
                                          processedInfluence={this.props.influenceData}
                                          participantId={this.props.user.id}/>
                              <div className="columns">
                                  <div className="column" >
                                    <InfluenceChart influenceType={"theirs"}
                                                    processedInfluence={this.props.influenceData}
                                                    participantId={this.props.user.id}/>
                                    </div>
                              </div>
                          </div>
                      </div>

                    <div className="section" style={{padding: "0px"}}>


                    </div>
                  </div>
                </div>

                </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MeetingViz);
