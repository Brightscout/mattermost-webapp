import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import lifecycle from 'react-pure-lifecycle';
import {ScaleLoader} from 'react-spinners';
import MaterialIcon from 'material-icons-react';

import webrtc from '../../utils/webrtc/webrtc';
import store from '../../stores/redux_store';
import RemoteVideoContainer from './RemoteVideoContainer';
import RenderVideos from './RenderVideos';
import LeaveRoomButton from './LeaveRoomButton';
import WebRtcSidebar from './WebrtcSidebar';
import TextChat from './TextChat';
import {VideoPlaceholder,
        ErrorNotification,
        MenuLabel,
        MenuLabelCentered,
        Menu,
        RoomNameEntry
       } from './styled';



// needs to be a regular component because we need to use
// refs in order to request a local stream with SimpleWebRTC.
class WebRtc extends Component {
    constructor (props) {
        super(props);
        console.log("webrt has these props:", props);
        this.onUnload = this.onUnload.bind(this);
        this.render = this.render.bind(this);
        this.reattachVideo = this.reattachVideo.bind(this);
    }
    
    componentDidMount () {
        console.log("adding local video to:", this.localVideoRef);
        let localVideo = ReactDOM.findDOMNode(this.localVideoRef);
        //TODO: "" here should be replaced by user info.
        this.webrtc = webrtc(localVideo,
                             this.props.dispatch,
                             store.getState);
        this.webrtc.changeNick(this.props.user.id + "|" + this.props.user.username);

        window.addEventListener("beforeunload", this.onUnload);
    }

    componentWillUnmount() {
        this.webrtc.stopLocalVideo();
        this.onUnload();
        window.removeEventListener('beforeunload', this.onUnload);
    }

    onUnload(event) {
        // unload event...
        // we previously left the riff room
    }

    reattachVideo(video) {
        if (video == null) {
            return;
        }
        try {
            if (
                this.props.inRoom &&
                this.webrtc &&
                this.webrtc.webrtc.localStreams.length &&
                video.srcObject == null
            ) {
                this.webrtc.reattachLocalVideo(video);
            }
        } catch (err) {
            // it is possible webrtc state will change while re-rendering,
            // which can break things
            // we catch the exception here so we can recover
            logger.debug(err);
        }

        // creating ref for local video so we can pass down to children
        this.localVideoRef = video;
    }

    render () {
        return (
            <div id='app-content' className=''>
                <div className="section">
                    <div className="columns is-fullheight">
                        <div className="is-sidebar-menu">
                            <WebRtcSidebar {...this.props}
                                webrtc={this.webrtc}
                                localVideoRef={this.localVideoRef}
                                reattachVideo={this.reattachVideo}
                            />
                        </div>
                        <div className="column">
                            <RenderVideos
                                inRoom={this.props.inRoom}
                                roomName={this.props.roomName}
                                handleKeyPress={this.props.handleKeyPress}
                                webRtcPeers={this.props.webRtcPeers}
                                handleRoomNameChange={null}
                                handleReadyClick={(event) => this.props.handleReadyClick(event, this.props, this.webrtc)}
                                joinButtonDisabled={false}
                                clearJoinRoomError={this.props.clearJoinRoomError}
                                joinRoomStatus={this.props.joinRoomStatus}
                                joinRoomMessage={this.props.joinRoomMessage}
                                chat={this.props}
                                riff={this.props.riff}
                                webrtc={this.webrtc}
                                displayRoomName={false}
                                displayName={this.props.user.nickname == "" ? (
                                    "@" + this.props.user.username
                                ) : (
                                    this.props.user.nickname
                                )}
                                roDisplayName={true}
                                webRtcRemoteSharedScreen={this.props.webRtcRemoteSharedScreen}
                            />
                            {this.props.inRoom && <TextChat/>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


export default WebRtc;
