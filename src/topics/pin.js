'use strict';

const db = require('../database');
const topics = require('./topics');
const privileges = require('../privileges');
const event = require('../event');
const utils = require('../utils');
const plugins = require('../plugins');

const Pin = {};

// Toggle Pin/Unpin a topic
Pin.togglePin = async function (tid, uid, pin) {
    const topicData = await topics.getTopicData(tid);  // Use lowercase 'topics'
    if (!topicData) {
        throw new Error('[[error:no-topic]]');
    }

    if (topicData.scheduled) {
        throw new Error('[[error:cant-pin-scheduled]]');
    }

    const isAdminOrMod = uid === 'system' || await privileges.topics.isAdminOrMod(tid, uid);
    if (!isAdminOrMod) {
        throw new Error('[[error:no-privileges]]');
    }

    if (pin && topicData.pinned) {
        throw new Error('[[error:topic-already-pinned]]');
    } else if (!pin && !topicData.pinned) {
        throw new Error('[[error:topic-not-pinned]]');
    }

    // Update pin status in the database
    const promises = [
        topics.setTopicField(tid, 'pinned', pin ? 1 : 0),
        event.emit(pin ? 'topic.pinned' : 'topic.unpinned', { tid, uid }),
        plugins.hooks.fire('action:topic.pin', { topic: _.clone(topicData), uid }),
    ];

    if (pin) {
        promises.push(db.sortedSetAdd(`cid:${topicData.cid}:tids:pinned`, Date.now(), tid));
        promises.push(db.sortedSetsRemove([
            `cid:${topicData.cid}:tids`,
            `cid:${topicData.cid}:tids:create`,
            `cid:${topicData.cid}:tids:posts`,
            `cid:${topicData.cid}:tids:votes`,
            `cid:${topicData.cid}:tids:views`,
        ], tid));
    } else {
        promises.push(db.sortedSetRemove(`cid:${topicData.cid}:tids:pinned`, tid));
        promises.push(topics.deleteTopicField(tid, 'pinExpiry'));
        promises.push(db.sortedSetAddBulk([
            [`cid:${topicData.cid}:tids`, topicData.lastposttime, tid],
            [`cid:${topicData.cid}:tids:create`, topicData.timestamp, tid],
            [`cid:${topicData.cid}:tids:posts`, topicData.postcount, tid],
            [`cid:${topicData.cid}:tids:votes`, parseInt(topicData.votes, 10) || 0, tid],
            [`cid:${topicData.cid}:tids:views`, topicData.viewcount, tid],
        ]));
        topicData.pinExpiry = undefined;
        topicData.pinExpiryISO = undefined;
    }

    await Promise.all(promises);

    return { tid, pinned: pin };
};

// Pin a topic
Pin.pin = async function (tid, uid) {
    return await Pin.togglePin(tid, uid, true);
};

// Unpin a topic
Pin.unpin = async function (tid, uid) {
    return await Pin.togglePin(tid, uid, false);
};

module.exports = Pin;
