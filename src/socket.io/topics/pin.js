'use strict';

const topics = require('../../topics');
const privileges = require('../../privileges');
const Pin = require('../../pin');
// I think we need to use this in some central socket file but don't know where that is.
module.exports = function (SocketTopics) {
    // Handler for pinning/unpinning topics
    SocketTopics.pinTopic = async function (socket, data) {
        // Check if the user is authenticated
        if (!socket.uid) {
            throw new Error('[[error:no-privileges]]');
        }
        
        // Validate data
        if (!data || !data.tid || typeof data.pin === 'undefined') {
            throw new Error('[[error:invalid-data]]');
        }

        // Check privileges
        const isAdminOrMod = await privileges.topics.isAdminOrMod(data.tid, socket.uid);
        if (!isAdminOrMod) {
            throw new Error('[[error:no-privileges]]');
        }

        // Toggle pin/unpin
        const result = await Pin.togglePin(data.tid, socket.uid, data.pin);
        return { tid: data.tid, pinned: result.pinned };
    };
};
