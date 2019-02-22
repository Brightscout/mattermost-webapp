// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint
    header/header: "off",
 */

import React from 'react';
import MaterialIcon from 'material-icons-react';
import {detect} from 'detect-browser';

import MicEnabledIcon from 'components/svg/mic_enabled_icon';
import MicDisabledIcon from 'components/svg/mic_disabled_icon';
import ScreenShareStartIcon from 'components/svg/screen_share_start_icon';
import ScreenShareStopIcon from 'components/svg/screen_share_stop_icon';
import {isScreenShareSourceAvailable} from 'utils/webrtc/webrtc';
import {logger} from 'utils/riff';

import LeaveRoomButton from './LeaveRoomButton';
import MeetingMediator from './MeetingMediator';
import {
    VideoPlaceholder,
    MenuLabelCentered,
    Menu,
} from './styled';

const browser = detect();

const videoStyle = (mediaError) => {
    if (mediaError) {
        return {borderRadius: '5px', display: 'none'};
    }
    return {borderRadius: '5px', display: 'inline-block'};
};

const placeholderStyle = (mediaError) => {
    if (!mediaError) {
        return {borderRadius: '5px', display: 'none'};
    }
    return {borderRadius: '5px', display: 'inline-block'};
};

const AudioStatus = (props) => {
    const MicMuteButton = (mmbProps) => {
        let icon = <MicEnabledIcon/>;
        let classNames = 'button is-rounded';

        if (mmbProps.audioMuted) {
            icon = <MicDisabledIcon/>;
            classNames += ' is-danger';
        }

        return (
            <button
                className={classNames}
                onClick={(event) => mmbProps.handleMuteAudioClick(event, mmbProps.audioMuted, mmbProps.webrtc)}
            >
                {icon}
            </button>
        );
    };

    const ScreenShareButton = (ssbProps) => {
        let icon = <ScreenShareStartIcon/>;
        const classNames = 'button is-rounded';
        let disabled = false;
        let ariaLabel = 'Share Your Screen';
        if (ssbProps.webRtcRemoteSharedScreen) {
            disabled = true;
        } else if (ssbProps.userSharing) {
            icon = <ScreenShareStopIcon/>;
            ariaLabel = 'Stop Sharing Your Screen';
        }

        const onClick = (event) => {
            ssbProps.handleScreenShareClick(
                event,
                ssbProps.userSharing,
                ssbProps.webRtcRemoteSharedScreen,
                ssbProps.webrtc
            );
        };

        return (
            <button
                className={classNames}
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel}
            >
                {icon}
            </button>
        );
    };

    return (
        <div className='has-text-centered'>
            <div className='control'>
                <div className='columns'>
                    <div className='column'><MicMuteButton {...props}/></div>
                    <div className='column has-text-right'>{isScreenShareSourceAvailable() && <ScreenShareButton {...props}/>}</div>
                </div>
            </div>
        </div>
    );
};

const AudioStatusBar = (props) => {
    const screenShareWarning = () => {
        // inform the user screen sharing is not available on their device
        let text = <p/>;
        let alertText = 'Copy and paste "chrome://flags/#enable-experimental-web-platform-features" into your ';
        alertText +=    'address bar, toggle the button to "Enabled", and relaunch Chrome.'; // eslint-disable-line no-multi-spaces

        const howToEnableAlert = (e) => {
            e.preventDefault();
            alert(alertText); // eslint-disable-line no-alert
        };

        switch (browser && browser.name) {
        case 'chrome': {
            const version = parseInt(browser.version.split('.')[0], 10);
            if (version >= 70) {
                text = (
                    <p>
                        {'Screen Sharing is Disabled.'}
                        {'To enable screen sharing, please&nbsp;'}
                        <a href="#" onClick={howToEnableAlert}>{'turn on experimental features'}</a>
                        {'&nbsp;in Chrome.'}
                    </p>
                );
            } else {
                text = (
                    <p>
                        {`Screen Sharing is Disabled.
                        Please update Chrome to the latest version to use screen sharing.`}
                    </p>
                );
            }
            break;
        }
        case 'firefox':
            text = (
                <p>
                    {`Screen Sharing is Disabled.
                    Please make sure you have the latest version of Firefox to use screen sharing.`}
                </p>
            );
            break;
        default:
            text = (
                <p>
                    {`Screen sharing is not supported in this browser.
                     Please use the latest version of Chrome or Firefox to enable screen sharing.`}
                </p>
            );
        }

        return (
            <div style={{paddingBottom: '20px'}}>
                <MaterialIcon icon="warning" color="#f44336"/>
                <div>
                    {text}
                </div>
            </div>
        );
    };

    return (
        <div className="has-text-centered" style={{marginTop: '1rem'}}>
            <div className="level" style={{marginBottom: '5px'}}>
                <div className="level-item" style={{maxWidth: '20%'}}>
                    <MaterialIcon icon="mic"/>
                </div>
                <div className="level-item">
                    <progress
                        style={{maxWidth: '100%', margin: 0}}
                        className="progress is-success"
                        value={props.volume}
                        max="100"
                    />
                </div>
            </div>
            {!isScreenShareSourceAvailable() && screenShareWarning()}
            <MenuLabelCentered>
                <p>
                    {'Having trouble? '}<a href="/room">{'Refresh the page'}</a>{' and allow access to your camera and mic.'}
                </p>
            </MenuLabelCentered>
        </div>
    );
};

class WebRtcSidebar extends React.PureComponent {
    constructor(props) {
        super(props);
        this.appendLocalScreen = this.appendLocalScreen.bind(this);
    }

    localVideo() {
        return (
            <React.Fragment>
                <video
                    className="local-video"
                    id="local-video"

                    // this is necessary for thumos. yes, it is upsetting.
                    height="175"
                    width="250"
                    style={videoStyle(this.props.mediaError)}
                    ref={this.props.reattachVideo}
                />
                <canvas
                    id="video-overlay"
                    height="175"
                    width="250"
                    style={{display: 'none'}}
                />
            </React.Fragment>
        );
    }

    appendLocalScreen(container) {
        const screen = this.props.webRtcLocalSharedScreen;
        try {
            screen.style = this.videoStyle();
            screen.height = 175;
            screen.width = 250;
            screen.className = 'local-video';
            screen.muted = true;
            container.appendChild(screen);
        } catch (err) {
            // it is possible that the connection will end
            // in the middle of trying to display the shared screen
            // this will cause a TypeError
            logger.debug('Screen nulled while rendering', err);
        }
    }

    videoStyle() {
        if (this.props.mediaError) {
            return {borderRadius: '5px', display: 'none'};
        }

        return {borderRadius: '5px', display: 'inline-block'};
    }

    localSharedScreen() {
        return <div id='local-screen-container' ref={this.appendLocalScreen}/>;
    }

    render() {
        return (
            <Menu>
                {!this.props.inRoom ? (
                    <MenuLabelCentered>
                        {'Check your video and microphone before joining.'}
                    </MenuLabelCentered>
                ) : (
                    <MenuLabelCentered>
                        <LeaveRoomButton
                            webrtc={this.props.webrtc}
                            leaveRiffRoom={this.props.riffParticipantLeaveRoom}
                            leaveRoom={this.props.leaveRoom}
                        />
                    </MenuLabelCentered>
                )}

                {!this.props.webRtcLocalSharedScreen ? this.localVideo() : this.localSharedScreen()}

                {this.props.mediaError && (
                    <VideoPlaceholder style={placeholderStyle(this.props.mediaError)}>
                        <p>{"Can't see your video? Make sure your camera is enabled."}</p>
                    </VideoPlaceholder>
                )}

                <p
                    className="menu-label"
                    style={{marginBottom: '0px'}}
                >
                    {this.props.user.email}
                </p>

                {this.props.inRoom && <AudioStatus {...this.props}/>}

                {!this.props.inRoom ? (
                    <AudioStatusBar {...this.props}/>
                ) : (
                    <MeetingMediator {...this.props}/>
                )}
            </Menu>
        );
    }
}

export default WebRtcSidebar;
