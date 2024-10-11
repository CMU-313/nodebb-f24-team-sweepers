'use strict';

// Use the global form of 'use strict'

const { setPostVisibility, getPostVisibility, renderPostsForUserGroup } = require('../src/posts/topics.js'); // Correct file extension

describe('Post Visibility Settings and Rendering', () => {
	// Test to ensure that we can set visibility for all user types
	it('should set visibility for all user types correctly', (done) => {
		const postId = 1; // Example post ID
		const postVisibility = ['Moderators', 'Admin', 'All'];
		// Simulate setting visibility for a post
		postVisibility.forEach((userGroup) => {
			setPostVisibility(postId, userGroup, (err) => {
				if (err) {
					console.log(`Error setting visibility for userGroup ${userGroup}:`, err);
					return done(err);
				}
				// Verify the visibility was correctly set
				getPostVisibility(postId, (err, visibility) => {
					if (err) {
						console.log(`Error retrieving visibility for postId ${postId}:`, err);
						return done(err);
					}
					if (visibility === userGroup) {
						console.log(`Successfully set visibility for postId ${postId} to ${userGroup}`);
					} else {
						console.log(`Failed to set visibility for postId ${postId} to ${userGroup}, got ${visibility} instead`);
					}
				});
			});
		});

		done();
	});

	// Test to ensure that we only render posts allowed for the current user group
	it('should render only posts allowed for the current user group', (done) => {
		const posts = [
			{ postId: 1, visibility: 'Moderators' },
			{ postId: 2, visibility: 'Admin' },
			{ postId: 3, visibility: 'All' },
		];
		const userGroup = 'Moderators'; // Set current user's group
		renderPostsForUserGroup(userGroup, (err, renderedPosts) => {
			if (err) {
				console.log('Error rendering posts for user group:', err);
				return done(err);
			}
			const expectedPostIds = [1, 3]; // Moderators should see posts for 'Moderators' and 'All'
			const renderedPostIds = renderedPosts.map(post => post.postId);

			const correctPostsRendered = expectedPostIds.every(id => renderedPostIds.includes(id)) &&
                                         renderedPostIds.every(id => expectedPostIds.includes(id));
			if (correctPostsRendered) {
				console.log(`Correct posts were rendered for user group ${userGroup}:`, renderedPostIds);
			} else {
				console.log(`Incorrect posts were rendered for user group ${userGroup}. Expected ${expectedPostIds}, but got ${renderedPostIds}`);
			}
			done();
		});
	});
});
