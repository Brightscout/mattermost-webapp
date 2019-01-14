// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import styled, {injectGlobal, keyframes} from 'styled-components';
import {Link} from 'react-router-dom';
import ReactChartkick, {ColumnChart, PieChart} from 'react-chartkick';
import {ScaleLoader} from 'react-spinners';
import {
    Sigma,
    SigmaEnableWebGL,
    RandomizeNodePositions,
    RelativeSize,
    EdgeShapes,
    NodeShapes,
} from 'react-sigma';
import ForceLink from 'react-sigma/lib/ForceLink';
import MaterialIcon from 'material-icons-react';
import Chart from 'chart.js';
import moment from 'moment';
import lifecycle from 'react-pure-lifecycle';
import _ from 'underscore';

import Gantt from './gantt';
import ChartCard from './ChartCard';

const colorYou = '#ab45ab';
const colorOther = '#bdc3c7';
const peerColors = ['#f56b6b', '#128EAD', '#7caf5f', '#f2a466'];

const drawGantt = (props) => {
    console.log("GANTT PROPS:", props);
    const {processedTimeline, participantId} = props;
    const {utts, participants, startTime, endTime} = processedTimeline;

    // create map of id: name
    // local user will always be first.
    console.log('sorted participants:', participants);
    const participantNames = _.pluck(participants, 'name');
    const participantIds = _.pluck(participants, 'id');
    const participantMap = _.object(participantIds, participantNames);

    const getColor = (pId) => {
        let pIndex = participantIds.indexOf(pId) - 1;
        console.log(pId, "participant index:", pIndex, "color:", peerColors[pIndex]);
        let color = peerColors[pIndex];
        if (color == undefined) {
            color = colorOther;
        }
        return color;
    };
    // create extra key 'taskName' detailing name of speaker
    let utts2 = _.map(utts, (u) => {
        return {...u,
                taskName: participantMap[u.participant],
                color: u.participant == participantId ? colorYou : getColor(u.participant)};
    });

    var gantt = Gantt('#gantt-' + props.meeting._id).taskTypes(participantNames);
    gantt(utts2);
};

const componentDidMount = (props) => {
    if (props.loaded & props.processedTimeline) {
        console.log("TIMELINE loaded, props:", props);
        drawGantt(props);
    };
};

const componentDidUpdate = (props) => {
    // console.log("component updating...", props);
    // drawGantt(props);
    return false;
};

const methods = {
    componentDidUpdate,
    componentDidMount,
};

const WaveDiv = styled.div`
    background: rgba(171, 69, 171, 1);
    margin-top: -10px;
    padding-bottom: 10rem;
`;

const chartInfo =
    'This chart shows a timeline of when people spoke during your meeting.';

// processedTimeline:
// processedUtterances: [list of utterances...]
// participants: [{id, name, ...}, ...]
const TimelineView = (props) => {
    console.log("timeline props:", props); 
    var chartDiv;
    if (!props.loaded) {
        chartDiv = (
            <ScaleLoader color={'#8A6A94'}/>
        );
    } else {
        chartDiv = <div id={'gantt-' + props.meeting._id}/>;
    }
    return (
          <ChartCard
            title='Timeline'
            chartDiv={chartDiv}
            // messy, but here we need to give the child component
            // a way to redraw the chart
            redraw={() => {if (props.loaded && props.processedTimeline) { drawGantt(props)}}}
            chartInfo={chartInfo}
            maxWidth='80'
            />
    );
};

const TimelineChart = lifecycle(methods)(TimelineView);

export default TimelineChart;
