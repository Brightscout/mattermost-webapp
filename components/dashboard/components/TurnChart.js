// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import styled, {injectGlobal, keyframes} from 'styled-components';
import {Link} from 'react-router-dom';
import ReactChartkick, {ColumnChart, PieChart} from 'react-chartkick';
import {ScaleLoader} from 'react-spinners';
import MaterialIcon from 'material-icons-react';
import Chart from 'chart.js';
import _ from 'underscore';

import moment from 'moment';

import ChartCard from './ChartCard';

ReactChartkick.addAdapter(Chart);

const formatChartData = (processedUtterances, participantId) => {
    console.log('formatting:', processedUtterances);

    const colorYou = '#ab45ab';
    const colorOther = '#bdc3c7';
    let nextOtherUser = 1;

    const data = [];
    const peerColors = ['#f56b6b', '#128EAD', '#7caf5f', '#f2a466'];
    const colors = [];
    processedUtterances = _.sortBy(processedUtterances, 'participantId');

    processedUtterances.forEach((p) => {
        // our display name from firebase if we've got it.
        const label = p.name;

        if (p.participantId === participantId) {
            data.unshift(['You', p.lengthUtterances]);
            colors.unshift(colorYou);
        } else {
            data.push([label || `User ${nextOtherUser++}`, p.lengthUtterances]);
            colors.push(peerColors[nextOtherUser++ - 1]);
        }
    });

    return {data, colors};
};

const chartInfo =
    'This shows a breakdown of how long each member of your meeting spoke for. More \
equal speaking time across all members is associated with higher creativity, more trust between \
group members, and better brainstorming.';

const TurnChart = ({processedUtterances, participantId, loaded}) => {


    var chartDiv;
    if (loaded) {
        const r = formatChartData(processedUtterances, participantId);
        console.log('data for chart:', r.data);

        const chartOptions = {
            tooltips: {
                callbacks: {
                    label(tooltipItem, data) {
                        const label = data.labels[tooltipItem.index] || '';
                        let seconds =
                            data.datasets[tooltipItem.datasetIndex].data[
                                tooltipItem.index
                            ] || -1;
                        const minutes = Math.trunc(seconds / 60);
                        seconds = Math.round(seconds % 60);

                        const tooltip = `${label}${
                        label ? ': ' : ''
                    }${minutes}m ${seconds}s`;
                        return tooltip;
                    },
                },
            },
        };

        chartDiv = (
            <PieChart
              donut={true}
              library={chartOptions}
              data={r.data}
              colors={r.colors}
              height='25vw'
              width='25vw'
              />
        );
    }

    const loadingDiv = (
        <ScaleLoader color={'#8A6A94'}/>
    );

    return (
        <ChartCard
            title='Speaking Time'
            chartDiv={loaded ? chartDiv : loadingDiv}
            chartInfo={chartInfo}
        />
    );
};

export default TurnChart;
