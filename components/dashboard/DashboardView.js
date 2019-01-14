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
import _ from 'underscore';

import MeetingViz from './components/MeetingViz';
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

const DashboardView = (props) => {
    console.log("dashboard view props:", props);
    if (props.loadingStatus) {
        return (
            <div className='columns is-centered has-text-centered'>
              <div className='column'>
                <ScaleLoader color={'#8A6A94'}/>
              </div>
            </div>
        );
    } else if (props.loadingError.status) {
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
                  {props.loadingError.message}
                </p>
                <ScaleLoader color={'#8A6A94'}/>
              </div>
            </div>
        );
    }
    // marginLeft on column is a quick fix until we fix the styling on this ugly page.
    const meetingVisualizations = _.map(_.first(props.meetings, 4), (m) => {
        return (
            <MeetingViz key={m._id} meeting={m} user={props.user}/>
        )
    });
    return (
        <div
          className='app__content'
          >
          {props.statsStatus === 'loading' ? (
              <div>
                <ScaleLoader color={'#8pA6A94'}/>
              </div>
          ) : (
              <div style={{overflowY: 'scroll'}}>
                {meetingVisualizations}
              </div>
          )}
        </div>
    );
};

export default DashboardView;
