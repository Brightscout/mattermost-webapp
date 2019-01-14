// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {DashboardActionTypes} from 'utils/constants.jsx';
import _ from 'underscore';

import {app, socket} from 'utils/riff';
import firebaseApp from 'utils/firebase';

const db = firebaseApp.firestore();

export const updateMeetingList = (meetings) => {
    return {
        type: DashboardActionTypes.DASHBOARD_FETCH_MEETINGS,
        status: 'loaded',
        meetings,
    };
};

export const selectMeeting = (meeting) => {
    return {
        type: DashboardActionTypes.DASHBOARD_SELECT_MEETING,
        meeting,
    };
};

export const loadRecentMeetings = (uid) => (dispatch) => {
    dispatch({
        type: DashboardActionTypes.DASHBOARD_LOADING_ALL_MEETINGS,
    });

    // set it to not re-fetch. This changes lastFetched to now
    // we re-set this after the following block of code.
    dispatch(updateMeetingList([]));

    return app.
        service('participants').
        find({query: {_id: uid}}).
        then((res) => {
            if (res.data.length == 0) {
                // no found participants. Throw an error to break out early.
                throw new Error('no participant');
            }
            console.log('>>fetched participant:', res);
            return res.data[0];
        }).
        then((participant) => {
            return participant.meetings;
        }).
        then((meetingIds) => {
            return app.service('meetings').find({query: {_id: meetingIds}});
        }).
        then((meetingObjects) => {
            console.log('raw meeting objects received:', meetingObjects);
            meetingObjects = _.filter(meetingObjects, (m, idx) => {
                if (!m.endTime) {
                    return true;
                }
                const durationSecs =
                    (new Date(m.endTime).getTime() -
                        new Date(m.startTime).getTime()) /
                    1000;
                return durationSecs > 2 * 60;
            });

            if (meetingObjects.length == 0) {
                throw new Error('no meetings after filter');
            }
            // fetch data for first meeting
            return meetingObjects;

            // dispatch(updateMeetingList(meetingObjects));
        }).
        then((meetingObjects) => {
            const pEvents = _.map(meetingObjects, (m) => {
                return app.
                    service('participantEvents').
                    find({query: {meeting: m._id, $limit: 500}});
            });
            return Promise.all(pEvents).then((vals) => {
                console.log('pevents in promise', vals);
                return {meetings: meetingObjects, pEvents: vals};
            });
        }).
        then(({meetings, pEvents}) => {
            // only return meetings that have over 1 participant.
            const numParticipants = _.map(pEvents, (pe) => {
                return _.uniq(
                    _.flatten(
                        _.map(pe.data, (p) => {
                            return p.participants;
                        })
                    )
                ).length;
            });

            // TODO: this will include meetings where someone joins but does not speak.
            // because we use the utterance data to inform our shit, the # of attendees will also be wrong.
            // right thing to do here is to try and create a service on the server that will reliably give
            // us # of attendees
            console.log('num participants:', numParticipants, meetings);
            meetings = _.filter(meetings, (m, idx) => {
                return numParticipants[idx] >= 2;
            });
            console.log('kept meetings:', meetings);
            if (meetings.length == 0) {
                throw new Error('no meetings after nparticipants filter');
            }
            meetings.sort(
                (a, b) => /*descending*/ -cmpMeetingsByStartTime(a, b)
            );
            
            // limit to 10 to begin with
            meetings = _.first(meetings, 10);

            dispatch(updateMeetingList(meetings));
            if (meetings.length > 0) {
                const newSelectedMeeting = meetings[0];
                console.log("meeting list is now:", meetings);
                console.log("selected meeting is:", meetings[0]._id);
                dispatch(selectMeeting(newSelectedMeeting));
                dispatch(loadMeetingData(uid, newSelectedMeeting._id));
            }
        }).
        catch((err) => {
            if (err.message == 'no participant') {
                dispatch({
                    type: DashboardActionTypes.DASHBOARD_LOADING_ERROR,
                    status: true,
                    message:
                        'No meetings found. Meetings that last for over two minutes will show up here.',
                });
            } else if (err.message == 'no meetings after filter') {
                dispatch({
                    type: DashboardActionTypes.DASHBOARD_LOADING_ERROR,
                    status: true,
                    message:
                        "We'll only show meetings that lasted for over two minutes. Go have a riff!",
                });
            } else if (
                err.message == 'no meetings after nparticipants filter'
            ) {
                dispatch({
                    type: DashboardActionTypes.DASHBOARD_LOADING_ERROR,
                    status: true,
                    message:
                        'Only had meetings by yourself? Come back after some meetings with others to explore some insights.',
                });
            } else {
                console.log("Couldn't retrieve meetings", err);
                //dispatch(loadRecentMeetings(uid));
            }
        });
};

const processUtterances = (utterances, meetingId) => {
//    console.log('processing utterances:', utterances);

    // {'participant': [utteranceObject, ...]}
    var participantUtterances = _.groupBy(utterances, 'participant');

    // {'participant': number of utterances}
    var numUtterances = _.mapObject(participantUtterances, (val, key) => {
        return val.length;
    });
    var lengthUtterances = _.mapObject(participantUtterances, (val, key) => {
        var lengthsUtterances = val.map((utteranceObject) => {
            return (
                (new Date(utteranceObject.endTime).getTime() -
                    new Date(utteranceObject.startTime).getTime()) /
                1000
            );
        });
        return lengthsUtterances.reduce(
            (previous, current) => current + previous,
            0
        );
    });

    // {'participant': mean length of utterances in seconds}
    var meanLengthUtterances = _.mapObject(
        participantUtterances,
        (val, key) => {
            var lengthsUtterances = val.map((utteranceObject) => {
                return (
                    (new Date(utteranceObject.endTime).getTime() -
                        new Date(utteranceObject.startTime).getTime()) /
                    1000
                );
            });
            var sum = lengthsUtterances.reduce(
                (previous, current) => current + previous,
                0
            );
            return sum / lengthsUtterances.length;
        }
    );
    const participants = Object.keys(participantUtterances);

    var visualizationData = participants.map((participantId) => {
        return {

            //    name: participant['name'],
            participantId,
            lengthUtterances:
                participantId in lengthUtterances ?
                    lengthUtterances[participantId] :
                    0,
            numUtterances:
                participantId in numUtterances ?
                    numUtterances[participantId] :
                    0,
            meanLengthUtterances:
                participantId in meanLengthUtterances ?
                    meanLengthUtterances[participantId] :
                    0,
        };
    });

    console.log("viz data:", visualizationData);

    _.map(visualizationData, (v) => {
        return Object.assign(v, {
            displayName: "displayName",
            meetingId,
        });
    });

    // const promises = _.map(visualizationData, (v) => {
    //     const docId = v.participantId + '_' + meetingId;
    //     const docRef = db.collection('meetings').doc(docId);
    //     return docRef.get().then((doc) => {
    //         return Object.assign(v, {
    //             displayName: doc.displayName,
    //             meetingId,
    //         });
    //     });
    // });
    //return Promise.all(promises);

    console.log("data returned:", visualizationData);
    return visualizationData;
};

/**
 *
 * Comparison functor for meetings based on their start times.
 *
 * @returns {number} -1 if a < b, 1 if a > b, 0 if a = b
 */

/***************************************************************************
 * cmpMeetingsByStartTime                                              */ function cmpMeetingsByStartTime(
    a,
    b
) {
    return a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0;
}

export const processInfluence = (uid, utterances, meetingId) => {
  let participantUtterances = _.groupBy(utterances, 'participant');
  let participants = Object.keys(participantUtterances);
  let sortedUtterances = _.sortBy(utterances, (u) => { return u.startTime; });

  let recentUttCounts = _.map(sortedUtterances, (ut, idx, l) => {
    // get list of utterances within 2 seconds that are not by the speaker.
    let recentUtterances = _.filter(sortedUtterances.slice(0, idx), (recentUt) => {
      let timeDiff = ((new Date(ut.startTime).getTime() - new Date(recentUt.endTime).getTime())/1000);
      let recent =  timeDiff < 3 && timeDiff > 0;
      let sameParticipant = ut.participant == recentUt.participant;
      return recent && !sameParticipant;
    });
    if (recentUtterances.length > 0) {
      return {participant: ut.participant,
              counts: _.countBy(recentUtterances, 'participant')};
    } else {
      return false;
    }
  });

  recentUttCounts = _.compact(recentUttCounts);
  console.log("recent utt counts:", recentUttCounts);

  // create object with the following format:
  // {participantId: {participantId: Count, participantId: Count, ...}}
  let aggregatedCounts = _.reduce(recentUttCounts, (memo, val, idx, l) => {
    if (!memo[val.participant]) {
      memo[val.participant] = val.counts;
    } else {
      // update count object that's stored in memo, adding new
      // keys as we need to.
      // obj here should be an object of {participantId: nUtterances}
      let obj = memo[val.participant];
      _.each(_.pairs(val.counts), (pair) => {
        if (!obj[pair[0]]) {
          obj[pair[0]] = pair[1];
        } else {
          obj[pair[0]] += pair[1];
        }
      });
      memo[val.participant] = obj;
    }
    return memo;
  }, {});

  // limit to only the current user
  //aggregatedCounts = aggregatedCounts[uid];

  let finalEdges = [];
  let edges = _.each(_.pairs(aggregatedCounts), (obj, idx) => {
    let participant = obj[0];
    _.each(_.pairs(obj[1]), (o) => {
      let toAppend = {source: participant, target: o[0], size: o[1]};
      finalEdges.push(toAppend);
    });
  });


  finalEdges = _.map(finalEdges, (e, idx) => { return { ...e,
                                                        id: "e" + idx,
                                                        size: e.size}});
  // filter any edges under 0.2 weight
  //finalEdges = _.filter(finalEdges, (e) => { return !(e.size < 0.1*sizeMultiplier); });
  let nodes = _.map(participants, (p, idx) => { return {id: p}; });
  nodes = _.sortBy(nodes, "id");

  let barLabels = {}
  let promises = _.map(nodes, (n) => {
    return app.service('participants').get(n.id)
      .then((res) => {
        barLabels[n.id] = res.name;
        return {...n,
                label: res.name};
      });
  });

  return Promise.all(promises).then(values => {
    finalEdges = _.map(finalEdges, (e, idx) => {
      return {...e,
              targetName: barLabels[e.target],
              sourceName: barLabels[e.source]
             };
      
    });
    return finalEdges;

  });
};


export const processTimeline = (uid, utterances, meetingId) => {
    const participantUtterances = _.groupBy(utterances, 'participant');
    let utts = _.map(utterances, (u) => {
        return {
            ...u,
            startDate: new Date(u.startTime),
            endDate: new Date(u.endTime),
            taskName: u.participant,
        };
    });

    utts = _.sortBy(utts, (u) => {
        return u.startDate;
    });

    const participants = Object.keys(participantUtterances);
    let otherParticipants = _.filter(participants, (p) => { return p != uid; });
    console.log("local uid:", uid)
    console.log("other participants:", otherParticipants)
    const promises = _.map(otherParticipants, (p) => {
        return app.
            service('participants').
            get(p).
            then((res) => {
                return {name: res.name, id: p};
            });
    });

    const startTime = _.min(utts, (u) => {
        return u.startTime;
    });
    const endTime = _.max(utts, (u) => {
        return u.endTime;
    });

    return Promise.all(promises).then((participants) => {
        // add local participant
        participants = _.sortBy(participants, "id");
        participants.unshift({name: 'You',
                              id: uid});
        console.log("sending sorted participants:", participants);
        return {utts,
                participants,
                startTime,
                endTime};
    });
};

export const loadMeetingData = (uid, meetingId) => (dispatch) => {
    console.log("loading meeting data:", uid, meetingId);
    dispatch({
        type: DashboardActionTypes.DASHBOARD_MEETING_LOAD_STATUS,
        status: 'loading',
        meetingId
    });
    console.log('finding utterances for meeting', meetingId);
    return app.
        service('utterances').
        find({query: {meeting: meetingId, $limit: 10000}}).
        then((utterances) => {
            console.log(">>>", meetingId, 'utterances', utterances);
            return {
                processedUtterances: processUtterances(utterances, meetingId),
                processedInfluence: processInfluence(uid, utterances, meetingId),
                processedTimeline: processTimeline(uid, utterances, meetingId),
            };
        }).
        then(({processedUtterances, processedInfluence, processedTimeline}) => {
            console.log(
                'utterances:',
                processedUtterances,
                'influence:',
                processedInfluence,
                "timeline:",
                processedTimeline
            );

            processedInfluence.then((influenceObj) => {
                dispatch({type: DashboardActionTypes.DASHBOARD_FETCH_MEETING_INFLUENCE,
                          meetingId,
                          influenceData: influenceObj});
            });

            const promises = _.map(processedUtterances, (u) => {
                return app.
                    service('participants').
                    get(u.participantId).
                    then((res) => {
                        return {...u, name: res.name};
                    });
            });
            Promise.all(promises).then((processedUtterances) => {
                console.log('processed utterances:', processedUtterances, "for meeting ID", meetingId);
                dispatch({
                    type:
                    DashboardActionTypes.DASHBOARD_FETCH_MEETING_UTTERANCES,
                    meetingId,
                    processedUtterances,
                });
            });
            // dispatch processed utterance (aggregated) data
            // processedUtterances.then((processedUtterances) => {
            //     const promises = _.map(processedUtterances, (u) => {
            //         return app.
            //             service('participants').
            //             get(u.participantId).
            //             then((res) => {
            //                 return {...u, name: res.name};
            //             });
            //     });
            //     Promise.all(promises).then((processedUtterances) => {
            //         console.log('processed utterances:', processedUtterances);
            //         dispatch({
            //             type:
            //                 DashboardActionTypes.DASHBOARD_FETCH_MEETING_STATS,
            //             status: 'loaded',
            //             processedUtterances,
            //         });
            //     });
            // });

            processedTimeline.then((processedTimeline) => {
                console.log('processed timeline:', processedTimeline);
                dispatch({
                    type: DashboardActionTypes.DASHBOARD_FETCH_MEETING_TIMELINE,
                    meetingId,
                    timelineData: processedTimeline,
                });
            });
        }).
        catch((err) => {
            // re-call load meeting here?
            console.log("couldn't retrieve meeting data", err);
        });
};
