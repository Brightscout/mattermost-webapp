// Copyright (c) 2018-present Riff Learning, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint
    header/header: "off",
 */

import React from 'react';

import {logger} from '../../utils/riff';

class PeerVideo extends React.Component {
    constructor(props) {
        super(props);
        this.appendVideo = this.appendVideo.bind(this);
        this.video = this.props.videoEl;
    }

    appendVideo(el) {
        logger.debug('appending?', 'color:', this.props.peerColor);
        if (el !== null) {
            this.video.style.setProperty('overflow', 'hidden');
            this.video.style.setProperty('display', 'block');
            this.video.style.setProperty('width', '100%');
            this.video.style.setProperty('margins', '5px');
            this.video.style.setProperty('border-radius', '5px');

            // when we have less than four peers, we display them in one row.
            // with more than four, we display them in two rows
            // set height to account for this
            if (this.props.peerLength < 4) {
                this.video.style.setProperty('height', '85vh');
            } else {
                this.video.style.setProperty('height', '42vh');
            }

            if (this.props.type === 'peer') {
                // we don't want to clip any of the shared screen,
                // so only apply this to peers
                this.video.style.setProperty('object-fit', 'cover');
                this.video.style.setProperty('border-bottom-right-radius', '0px');
                this.video.style.setProperty('border-bottom-left-radius', '0px');
            }
            el.appendChild(this.video);
            this.video.play();
        }
    }

    render() {
        const style = {
            padding: '0.25rem',
        };

        if (this.props.type === 'peer') {
            style.borderBottom = '5px solid ' + this.props.peerColor;
            style.padding = '0';
            style.margin = '0.25rem';
            style.borderBottomRightRadius = '5px';
            style.borderBottomLeftRadius = '5px';
        }

        const classes = 'videoContainer remotes column';

        return (
            <div
                className={classes}
                id={'container_' + this.props.id}
                style={style}
                ref={this.appendVideo}
            />
        );
    }
}

export default PeerVideo;
