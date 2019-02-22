// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint
    header/header: "off",
 */

import React from 'react';
import styled from 'styled-components';
import {ScaleLoader} from 'react-spinners';
import _ from 'underscore';

import {logger} from 'utils/riff';

import MeetingViz from './components/MeetingViz';

const NoMeetingsMessage = styled.div.attrs({
    className: 'no-meetings-message',
})`
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%,-50%);
    text-align: center;
    color: #4A4A4A;
    font-size: 28px;
`;

// TODO Add dispatch and click

// All dispatches were ripped out re-copy back in once server is working

const DashboardView = (props) => {
    logger.debug('dashboard view props:', props);
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
    logger.debug('only loading:', props.numLoadedMeetings, 'Meetings');
    const meetingVisualizations = _.map(_.first(props.meetings, props.numLoadedMeetings), (m) => {
        return (
            <MeetingViz
                key={m._id} // eslint-disable-line no-underscore-dangle
                meeting={m}
                allMeetings={props.meetings}
                maybeLoadNextMeeting={props.maybeLoadNextMeeting}
                user={props.user}
            />
        );
    });
    return (
        <div className='app__content'>
            {props.statsStatus === 'loading' ? (
                <div>
                    <ScaleLoader color={'#8pA6A94'}/>
                </div>
            ) : (
                <div style={{overflowY: 'scroll'}}>
                    {props.meetings.length > 0 ?
                        meetingVisualizations :
                        <NoMeetingsMessage>
                            <div>{'Welcome to your Riff Dashboard!'}</div>
                            <br/>
                            <div>{'Once you have a Riff video meeting,'}</div>
                            <div>{'your Riff Stats will display here.'}</div>
                        </NoMeetingsMessage>
                    }
                </div>
            )}
        </div>
    );
};

export default DashboardView;
