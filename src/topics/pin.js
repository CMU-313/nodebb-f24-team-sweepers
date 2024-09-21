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
    // Fetch topic data
    const topicData = await Topics.getTopicData(tid);
    if (!topicData) {
        throw new Error('[[error:no-topic]]');
    }

    if (topic.scheduled) {
        throw new Error('[[error:cant-pin-scheduled]]');
    }

    if (uid !== 'system' && !await privileges.topics.isAdminOrMod(tid, uid)) {
        throw new Error('[[error:no-privileges]]');
    }

    if (pin && topic.pinned) {
        throw new Error('[[error:topic-already-pinned]]');
    } else if (!pin && !topic.pinned) {
        throw new Error('[[error:topic-not-pinned]]');
    }

    // Update pin status in the database
    const promises = [
        Topics.setTopicField(tid, 'pinned', pin ? 1 : 0),
		Topics.events.log(tid, { type: pin ? 'pin' : 'unpin', uid }),
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
        promises.push(Topics.deleteTopicField(tid, 'pinExpiry'));
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

    const results = await Promise.all(promises);

    // Emit appropriate event
    event.emit(pin ? 'topic.pinned' : 'topic.unpinned', { tid, uid });
    plugins.hooks.fire('action:topic.pin', { topic: _.clone(topicData), uid });

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

// Set pin expiry for a topic
Pin.setPinExpiry = async function (tid, expiry, uid) {
    // Validate expiry date
    if (isNaN(parseInt(expiry, 10)) || expiry <= Date.now()) {
        throw new Error('[[error:invalid-data]]');
    }

    // Check privileges
    const topic = await topics.getTopicFields(tid, ['cid', 'uid']);
    const isAdminOrMod = await privileges.categories.isAdminOrMod(topic.cid, uid);
    if (!isAdminOrMod) {
        throw new Error('[[error:no-privileges]]');
    }

    // Set pin expiry in the database
    await topics.setTopicField(tid, 'pinExpiry', expiry);
    plugins.hooks.fire('action:topic.setPinExpiry', { topic, uid, expiry });

    return { tid, expiry };
};

// Check and expire pins
Pin.checkPinExpiry = async function (tids) {
    const expiryDates = await topics.getTopicsFields(tids, ['pinExpiry']);
    const now = Date.now();

    // Check and unpin topics that have expired
    const unpinPromises = expiryDates.map(async (topicExpiry, idx) => {
        if (topicExpiry && parseInt(topicExpiry.pinExpiry, 10) <= now) {
            await Pin.unpin(tids[idx], 'system');
            return null;
        }
        return tids[idx];
    });

    const filteredTids = (await Promise.all(unpinPromises)).filter(Boolean);
    return filteredTids;
};

// Order pinned topics
Pin.orderPinnedTopics = async function (uid, data) {
    const { tid, order } = data;
    const cid = await topics.getTopicField(tid, 'cid');

    if (!cid || !tid || !utils.isNumber(order) || order < 0) {
        throw new Error('[[error:invalid-data]]');
    }

    const isAdminOrMod = await privileges.categories.isAdminOrMod(cid, uid);
    if (!isAdminOrMod) {
        throw new Error('[[error:no-privileges]]');
    }

    const pinnedTids = await db.getSortedSetRange(`cid:${cid}:tids:pinned`, 0, -1);
    const currentIndex = pinnedTids.indexOf(String(tid));
    if (currentIndex === -1) {
        return;
    }

    const newOrder = pinnedTids.length - order - 1;
    // Move tid to the specified order
    if (pinnedTids.length > 1) {
        pinnedTids.splice(Math.max(0, newOrder), 0, pinnedTids.splice(currentIndex, 1)[0]);
    }

    await db.sortedSetAddBulk(
        `cid:${cid}:tids:pinned`,
        pinnedTids.map((tid, index) => index),
        pinnedTids
    );

    return pinnedTids;
};

module.exports = Pin;
