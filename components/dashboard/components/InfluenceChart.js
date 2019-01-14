import React, { Component } from "react";
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ReactChartkick, { ColumnChart, PieChart } from 'react-chartkick';
import {ScaleLoader} from 'react-spinners';
import {Sigma, SigmaEnableWebGL,
        RandomizeNodePositions,
        RelativeSize,
        EdgeShapes, NodeShapes,
       } from 'react-sigma';
import ForceLink from 'react-sigma/lib/ForceLink';
import MaterialIcon from 'material-icons-react';
import Chart from 'chart.js';
import moment from 'moment';
import _ from 'underscore';
import ChartCard from './ChartCard';
import {HorizontalBar} from 'react-chartjs-2';

const colorYou = '#ab45ab';
let peerColors = ['#f56b6b', '#128EAD', '#7caf5f', '#f2a466'];

/* takes a string phrase and breaks it into separate phrases 
   no bigger than 'maxwidth', breaks are made at complete words.*/

function formatLabel(str, maxwidth){
    var sections = [];
    var words = str.split(" ");
    var temp = "";

    words.forEach(function(item, index){
        if(temp.length > 0)
        {
            var concat = temp + ' ' + item;

            if(concat.length > maxwidth){
                sections.push(temp);
                temp = "";
            }
            else{
                if(index == (words.length-1))
                {
                    sections.push(concat);
                    return;
                }
                else{
                    temp = concat;
                    return;
                }
            }
        }

        if(index == (words.length-1))
        {
            sections.push(item);
            return;
        }

        if(item.length < maxwidth) {
            temp = item;
        }
        else {
            sections.push(item);
        }

    });

    return sections;
}

const addColorsToData = (influenceData, participantId, influenceType) => {
    let otherUsers = _.map(_.filter(influenceData, (n) =>
                                    {
                                        return influenceType == 'mine' ?
                                            n.target != participantId :
                                            n.source != participantId;
                                    }),
                           (n, idx) => {
                               n.color = peerColors[idx];
                               return n;
                           });
    return otherUsers;
};

// either 'mine' or 'theirs'
const getLabelsAndData = (uid, influenceType, influenceData) => {
    let res = _.filter(influenceData, (n) => {
        console.log(n.target, n.target == uid);
        if (influenceType == 'theirs') {
            return n.source == uid;
        } else {
            return n.target == uid;
        }
    });
    console.log("influence type, res", uid, influenceType, res);
    let sortedRes = _.sortBy(res, (n) => { return -n.size });
    let labels = _.map(sortedRes, (n) => { return influenceType == 'theirs' ? n.targetName : n.sourceName;});
    let data = _.map(sortedRes, (n) => { return n.size});
    return {labels,data};
}



const transformDataForBarChart = (rawLabels,data) => {
    console.log("using labels and data:", rawLabels, data)
    var labels = _.map(rawLabels, (l) => { return formatLabel(l, 10)});
    return {
        labels,
        datasets: [
            {
                label: 'Responses',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 0.5,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data,
            }
        ]
    };
};

const options = {
    legend: {
        display: false
    },
    scales: {
        yAxes: [
            {
                gridLines: {display: false}, 
            }
        ],
        xAxes: [
            {
                ticks: {
                    beginAtZero: true,
                    stepSize: 1,
                    autoSkip: true,
                    maxTicksLimit: 10
                }
            }
        ],
        gridLines: {display: false} 
    }

};


const getBarGraph = (influenceType, BarGraphData, options) => {
    if (BarGraphData.labels.length > 0) {
        return (
            <div style={{padding: "1rem"}}>
              <HorizontalBar data={BarGraphData}
                             options={options}/>
            </div>
        );
    } else {
        let emptyText = influenceType == "mine" ? "It doesn't look like you responded quickly to anyone in this meeting." : "It doesn't look like anyone responded to you quickly in this meeting.";
        return (
            <div>
              <p style={{margin: "1.5rem"}}>{emptyText}</p>
            </div>);
    }
};

const chartInfoMine = "This graph shows how many times each person spoke first after you finished speaking. Frequent first-responses indicate that a person is engaged by what you have to say.";
const chartInfoTheirs = "This graph shows how many times you spoke first after another person finished speaking. Frequent first-responses indicate that you are engaged by what another person is saying.";
const BarChart = ({processedInfluence, participantId, influenceType, loaded}) => {
    //processedInfluence = addColorsToData(processedInfluence, participantId);

    const chartTitle = influenceType == 'mine' ? 'Who You Influenced' : 'Who Influenced You';
    const chartInfoText = influenceType == 'mine' ? chartInfoMine : chartInfoTheirs;

    const loadingDiv = (
        <ScaleLoader color={'#8A6A94'}/>
    );

    var BarGraph;
    if (loaded) {
        let labelsAndData = getLabelsAndData(participantId, influenceType, processedInfluence);
        console.log("influence labels and data,", influenceType, labelsAndData)

        let BarGraphData = transformDataForBarChart(labelsAndData.labels, labelsAndData.data);
        BarGraph = getBarGraph(influenceType, BarGraphData, options);
    }

    return (
        <ChartCard
          title={chartTitle}
          maxWidth={100}
          chartDiv={loaded ? BarGraph : loadingDiv}
          chartInfo={chartInfoText}>
        </ChartCard>
    );
};

export default BarChart;
