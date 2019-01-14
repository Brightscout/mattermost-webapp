import moment from 'moment';

const formatMeetingDuration = (meeting) => {
    if (meeting === null) {
        return '';
    }

    // support showing data on in progress meeting by giving them a fake end time of now
    if (!meeting.endTime) {
        meeting = {...meeting, endTime: new Date()};
    }
    const diff = moment(new Date(meeting.endTime)).diff(
        moment(new Date(meeting.startTime)),
        'minutes'
    );
    return `${diff} minutes`;
};
