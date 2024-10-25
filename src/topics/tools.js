
'use strict';

const _ = require('lodash');

const db = require('../database');
const topics = require('.');
const categories = require('../categories');
const user = require('../user');
const plugins = require('../plugins');
const privileges = require('../privileges');


module.exports = function (Topics) {
	const topicTools = {};
	Topics.tools = topicTools;

	topicTools.delete = async function (tid, uid) {
		return await toggleDelete(tid, uid, true);
	};

	topicTools.restore = async function (tid, uid) {
		return await toggleDelete(tid, uid, false);
	};

	async function toggleDelete(tid, uid, isDelete) {
		const topicData = await Topics.getTopicData(tid);
		if (!topicData) {
			throw new Error('[[error:no-topic]]');
		}
		// Scheduled topics can only be purged
		if (topicData.scheduled) {
			throw new Error('[[error:invalid-data]]');
		}
		const canDelete = await privileges.topics.canDelete(tid, uid);

		const hook = isDelete ? 'delete' : 'restore';
		const data = await plugins.hooks.fire(`filter:topic.${hook}`, { topicData: topicData, uid: uid, isDelete: isDelete, canDelete: canDelete, canRestore: canDelete });

		if ((!data.canDelete && data.isDelete) || (!data.canRestore && !data.isDelete)) {
			throw new Error('[[error:no-privileges]]');
		}
		if (data.topicData.deleted && data.isDelete) {
			throw new Error('[[error:topic-already-deleted]]');
		} else if (!data.topicData.deleted && !data.isDelete) {
			throw new Error('[[error:topic-already-restored]]');
		}
		if (data.isDelete) {
			await Topics.delete(data.topicData.tid, data.uid);
		} else {
			await Topics.restore(data.topicData.tid);
		}
		const events = await Topics.events.log(tid, { type: isDelete ? 'delete' : 'restore', uid });

		data.topicData.deleted = data.isDelete ? 1 : 0;

		if (data.isDelete) {
			plugins.hooks.fire('action:topic.delete', { topic: data.topicData, uid: data.uid });
		} else {
			plugins.hooks.fire('action:topic.restore', { topic: data.topicData, uid: data.uid });
		}
		const userData = await user.getUserFields(data.uid, ['username', 'userslug']);
		return {
			tid: data.topicData.tid,
			cid: data.topicData.cid,
			isDelete: data.isDelete,
			uid: data.uid,
			user: userData,
			events,
		};
	}

	topicTools.purge = async function (tid, uid) {
		const topicData = await Topics.getTopicData(tid);
		if (!topicData) {
			throw new Error('[[error:no-topic]]');
		}
		const canPurge = await privileges.topics.canPurge(tid, uid);
		if (!canPurge) {
			throw new Error('[[error:no-privileges]]');
		}

		await Topics.purgePostsAndTopic(tid, uid);
		return { tid: tid, cid: topicData.cid, uid: uid };
	};

	topicTools.lock = async function (tid, uid) {
		return await toggleLock(tid, uid, true);
	};

	topicTools.unlock = async function (tid, uid) {
		return await toggleLock(tid, uid, false);
	};

	async function toggleLock(tid, uid, lock) {
		const topicData = await Topics.getTopicFields(tid, ['tid', 'uid', 'cid']);
		if (!topicData || !topicData.cid) {
			throw new Error('[[error:no-topic]]');
		}
		const isAdminOrMod = await privileges.categories.isAdminOrMod(topicData.cid, uid);
		if (!isAdminOrMod) {
			throw new Error('[[error:no-privileges]]');
		}
		await Topics.setTopicField(tid, 'locked', lock ? 1 : 0);
		topicData.events = await Topics.events.log(tid, { type: lock ? 'lock' : 'unlock', uid });
		topicData.isLocked = lock; // deprecate in v2.0
		topicData.locked = lock;

		plugins.hooks.fire('action:topic.lock', { topic: _.clone(topicData), uid: uid });
		return topicData;
	}

	const max_pinned = 5;

	// Pin a topic
	topicTools.pin = async (tid, uid) => togglePin(tid, uid, true);

	// Unpin a topic
	topicTools.unpin = async (tid, uid) => togglePin(tid, uid, false);

	// Toggle pin state
	async function togglePin(tid, uid, pin) {
		const { cid, scheduled } = await Topics.getTopicData(tid);

		// validate whether pinning is possible
		if (!cid) throw new Error('[[error:no-topic]]');
		if (scheduled) throw new Error('[[error:cant-pin-scheduled]]');
		if (uid !== 'system' && !await privileges.topics.isAdminOrMod(tid, uid)) throw new Error('[[error:no-privileges]]');

		// Get the current number of pinned topics in the category
		const pinnedTopicsCount = await db.sortedSetCard(`cid:${cid}:tids:pinned`);
		if (pin && pinnedTopicsCount >= max_pinned) {
			throw new Error(`[[error:max-pinned-limit-reached]]`);
		}

		// Set the 'pinned' field for the topic and log action in event log
		await Topics.setTopicField(tid, 'pinned', pin ? 1 : 0);
		Topics.events.log(tid, { type: pin ? 'pin' : 'unpin', uid });

		// Update database
		if (pin) {
			await pinActions(cid, tid);
		} else {
			await unpinActions(cid, tid);
		}

		// Track count
		if (pin) {
			const pinCount = await Topics.getTopicField(tid, 'pinCount') || 0;
			await Topics.setTopicField(tid, 'pinCount', pinCount + 1);
		}
		// Track pin history
		await db.listAppend(`topic:${tid}:pinHistory`, JSON.stringify({
			uid,
			action: pin ? 'pinned' : 'unpinned',
			timestamp: Date.now(),
		}));
		// Update db with user who pinned topic
		await Topics.setTopicField(tid, pin ? 'pinnedBy' : 'unpinnedBy', uid);

		// Trigger hook
		plugins.hooks.fire('action:topic.pin', { tid, uid });
		return { tid, pinned: pin };
	}

	// Set pin expiry
	topicTools.setPinExpiry = async (tid, expiry, uid) => {
		// Ensure timestamp is valid
		if (isNaN(expiry) || expiry <= Date.now()) {
			throw new Error('[[error:invalid-data]]');
		}
		const { cid } = await Topics.getTopicFields(tid, ['cid']);
		await checkAdminOrModPrivileges(cid, uid);

		// Set pin exipiry and trigger hook for the same
		await Topics.setTopicField(tid, 'pinExpiry', expiry);
		plugins.hooks.fire('action:topic.setPinExpiry', { tid, uid });
	};

	// Check pin expiry
	topicTools.checkPinExpiry = async (tids) => {
		// Get current timstamp and expirty time for tids
		const now = Date.now();
		const expiry = await topics.getTopicsFields(tids, ['pinExpiry']);

		// Check if any topics have expired - if so unpin it
		tids = await Promise.all(tids.map(async (tid, idx) => {
			if (expiry[idx] && expiry[idx] <= now) {
				await togglePin(tid, 'system', false);
				return null;
			}
			return tid;
		}));

		// Filter out unpinned topics
		return tids.filter(Boolean);
	};

	// Order pinned topics
	topicTools.orderPinnedTopics = async (uid, { tid, order }) => {
		// Get category of the topic
		const cid = await Topics.getTopicField(tid, 'cid');
		if (!cid || order < 0) throw new Error('[[error:invalid-data]]');

		await checkAdminOrModPrivileges(cid, uid);

		// Get current order of topics
		const pinnedTids = await db.getSortedSetRange(`cid:${cid}:tids:pinned`, 0, -1);
		const currentIndex = pinnedTids.indexOf(String(tid));
		if (currentIndex === -1) return;

		// Calculate new order position
		const newOrder = Math.max(0, pinnedTids.length - order - 1);
		if (pinnedTids.length > 1) {
			pinnedTids.splice(newOrder, 0, pinnedTids.splice(currentIndex, 1)[0]);
		}

		// Only reorder if necessary
		if (currentIndex !== newOrder && pinnedTids.length > 1) {
			const [movedTid] = pinnedTids.splice(currentIndex, 1);
			pinnedTids.splice(newOrder, 0, movedTid);
		}

		// Update pinned topics list with new order
		await db.sortedSetAdd(`cid:${cid}:tids:pinned`, pinnedTids.map((_, index) => index), pinnedTids);
	};

	async function pinActions(cid, tid) {
		await db.sortedSetAdd(`cid:${cid}:tids:pinned`, Date.now(), tid);
		await db.sortedSetsRemove([`cid:${cid}:tids`, `cid:${cid}:tids:create`, `cid:${cid}:tids:posts`, `cid:${cid}:tids:votes`, `cid:${cid}:tids:views`], tid);
	}

	async function unpinActions(cid, tid) {
		const { lastposttime, timestamp, postcount, votes, viewcount } = await Topics.getTopicData(tid);
		await db.sortedSetRemove(`cid:${cid}:tids:pinned`, tid);
		await db.sortedSetAddBulk([
			[`cid:${cid}:tids`, lastposttime, tid],
			[`cid:${cid}:tids:create`, timestamp, tid],
			[`cid:${cid}:tids:posts`, postcount, tid],
			[`cid:${cid}:tids:votes`, votes || 0, tid],
			[`cid:${cid}:tids:views`, viewcount, tid],
		]);
		await Topics.deleteTopicField(tid, 'pinExpiry');
	}

	// Helper function to check admin or moderator privileges
	async function checkAdminOrModPrivileges(cid, uid) {
		const isAdminOrMod = await privileges.categories.isAdminOrMod(cid, uid);
		if (!isAdminOrMod) {
			throw new Error('[[error:no-privileges]]');
		}
	}

	topicTools.move = async function (tid, data) {
		const cid = parseInt(data.cid, 10);
		const topicData = await Topics.getTopicData(tid);
		if (!topicData) {
			throw new Error('[[error:no-topic]]');
		}
		if (cid === topicData.cid) {
			throw new Error('[[error:cant-move-topic-to-same-category]]');
		}
		const tags = await Topics.getTopicTags(tid);
		await db.sortedSetsRemove([
			`cid:${topicData.cid}:tids`,
			`cid:${topicData.cid}:tids:create`,
			`cid:${topicData.cid}:tids:pinned`,
			`cid:${topicData.cid}:tids:posts`,
			`cid:${topicData.cid}:tids:votes`,
			`cid:${topicData.cid}:tids:views`,
			`cid:${topicData.cid}:tids:lastposttime`,
			`cid:${topicData.cid}:recent_tids`,
			`cid:${topicData.cid}:uid:${topicData.uid}:tids`,
			...tags.map(tag => `cid:${topicData.cid}:tag:${tag}:topics`),
		], tid);

		topicData.postcount = topicData.postcount || 0;
		const votes = topicData.upvotes - topicData.downvotes;

		const bulk = [
			[`cid:${cid}:tids:lastposttime`, topicData.lastposttime, tid],
			[`cid:${cid}:uid:${topicData.uid}:tids`, topicData.timestamp, tid],
			...tags.map(tag => [`cid:${cid}:tag:${tag}:topics`, topicData.timestamp, tid]),
		];
		if (topicData.pinned) {
			bulk.push([`cid:${cid}:tids:pinned`, Date.now(), tid]);
		} else {
			bulk.push([`cid:${cid}:tids`, topicData.lastposttime, tid]);
			bulk.push([`cid:${cid}:tids:create`, topicData.timestamp, tid]);
			bulk.push([`cid:${cid}:tids:posts`, topicData.postcount, tid]);
			bulk.push([`cid:${cid}:tids:votes`, votes, tid]);
			bulk.push([`cid:${cid}:tids:views`, topicData.viewcount, tid]);
		}
		await db.sortedSetAddBulk(bulk);

		const oldCid = topicData.cid;
		await categories.moveRecentReplies(tid, oldCid, cid);

		await Promise.all([
			Topics.setTopicFields(tid, {
				cid: cid,
				oldCid: oldCid,
			}),
			Topics.updateCategoryTagsCount([oldCid, cid], tags),
			Topics.events.log(tid, { type: 'move', uid: data.uid, fromCid: oldCid }),
		]);
		const hookData = _.clone(data);
		hookData.fromCid = oldCid;
		hookData.toCid = cid;
		hookData.tid = tid;

		plugins.hooks.fire('action:topic.move', hookData);
	};
};
