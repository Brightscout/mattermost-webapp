// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {Component, Fragment} from 'react';
import {withRouter} from 'react-router-dom';
import styled, {injectGlobal, keyframes} from 'styled-components';
import {Link} from 'react-router-dom';
import ReactChartkick, {ColumnChart, PieChart} from 'react-chartkick';
import {ScaleLoader} from 'react-spinners';
import MaterialIcon from 'material-icons-react';
import Chart from 'chart.js';
import moment from 'moment';

import TurnChart from './components/TurnChart';
import NetworkChart from './components/NetworkChart';
import TimelineChart from './components/TimelineChart';

const SpaceBetweeen = styled.div.attrs({
    className: 'space-between',
})`
    display: flex;
    justify-content: space-between;
    width: 320px;
`;

const MeetingTabs = styled.div.attrs({
    className: 'timeline',
})`
    padding-left: 2.5rem;
    overflow-y: scroll;
    max-height: 100%;
    &::-webkit-scrollbar {
        width: 0px; /* remove scrollbar space */
        background: transparent; /* optional: just make scrollbar invisible */
    }
    /* optional: show position indicator in red */
    &::-webkit-scrollbar-thumb {
        background: #ff0000;
    }
`;

// TODO Add dispatch and click

// All dispatches were ripped out re-copy back in once server is working

const MeetingView = ({uid, meeting, selected}) => {
    const m = moment(meeting.startTime).format('ha MMM Do');
    return (
        <a onClick={(event) => handleMeetingClick(event, uid, meeting)}>
          <div className='timeline-item'>
            <div className='timeline-marker is-image is-32x32'>
              <MaterialIcon
                icon='voice_chat'
                size={20}

                // color={selected ? '#ab45ab' : '#bdc3c7'}
                style={{
                    marginLeft: '0.25rem',
                    marginTop: '0.25rem',
                    paddingLeft: '0.05rem',
                    paddingTop: '0.1rem',
                    fontSize: '1.3rem',
                }}
                />
            </div>

            <div className='timeline-content'>
              <span className={selected ? 'heading selected' : 'heading'}>
                <p>{m}</p>
                <p/>
              </span>
            </div>
          </div>
        </a>
    );
};

const MeetingList = ({
    uid,
    fetchMeetingsStatus,
    fetchMeetingsMessage,
    meetings,
    selectedMeeting,
    handleMeetingClick,
}) => {
    const meetingTiles = meetings.map((meeting) => {
        return (
            <MeetingView
              key={meeting._id}
              uid={uid}
              meeting={meeting}
              selected={
                  selectedMeeting !== null &&
                      meeting._id === selectedMeeting._id
              }
              handleMeetingClick={handleMeetingClick}
              />
        );
    });
    return (
        <MeetingTabs>
          <div
            className='timeline-header'
            style={{minHeight: '2em'}}
            >
            <span className='tag is-medium is-inverted is-primary'>
              Today
            </span>
          </div>
          {meetingTiles}
        </MeetingTabs>
    );
};

const DashboardView = (props) => {
    console.log("dashboard view props:", props);
    if (props.fetchMeetingsStatus === 'loading') {
        return (
            <div className='columns is-centered has-text-centered'>
              <div className='column'>
                <ScaleLoader color={'#8A6A94'}/>
              </div>
            </div>
        );
    } else if (props.fetchMeetingsStatus === 'error') {
        return (
            <div
              className='columns is-centered has-text-centered is-vcentered'
              style={{height: '92vh'}}
              >
              <div
                className='column is-vcentered'
                style={{alignItems: 'center'}}
                >
                <p className='is-size-4 is-primary'>
                  {props.fetchMeetingsMessage}
                </p>
                <ScaleLoader color={'#8A6A94'}/>
              </div>
            </div>
        );
    }
    // marginLeft on column is a quick fix until we fix the styling on this ugly page.
    return (
        <div
          className='app__content'
          style={{overflowY: 'scroll'}}
          >
          {props.statsStatus === 'loading' ? (
              <div>
                <ScaleLoader color={'#8pA6A94'}/>
              </div>
          ) : (
              <div>
                <div
                  className=''
                  style={{paddingBottom: '2rem',
                          paddingTop: '1rem',
                  paddingLeft: '1rem'}}>
                  <h3>Room: {props.meetings[0].room} </h3>
                  <SpaceBetweeen>
                    <span> Attendees </span>
                    
                  </SpaceBetweeen>
                  <SpaceBetweeen>
                    <span> Duration </span>
                    {props.meetings[0].startTime}
                  </SpaceBetweeen>
                  <div className='column is-half has-text-left'>

                  </div>
                </div>
                <div className="columns is-centered">
                  <div className="column" style={{marginLeft: "33%"}}>
                    <TurnChart
                      processedUtterances={props.processedUtterances[0]}
                      participantId={props.user.id}
                      />
                  </div>
                </div>

              </div>
          )}
        </div>
    );
};

export default DashboardView;
