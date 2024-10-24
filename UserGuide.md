# User Guide

## Feature Overview

This user guide provides detailed instructions on how to use the following new/improved features implemented over the past two sprints:

- Pin Topics
- Search Topics
- Limit Topic Visibility to Specific User Groups

### 1. Pin Topics

#### Overview:

The Pin Topics feature allows admin users to pin important topics to the top of the list for easy access and visibility. Pinned topics remain at the top of the list, even when new topics are added or existing topics are updated. The feature also persists across user sessions and accounts, ensuring that topics an admin user wishes to pin are always visible to all users.

#### How to Use:

Pin a Topic:

1. Navigate to any category to view the list of topics.
2. Locate the topic you want to pin.
3. Hover over the post so that the square icon appears next to the topic, then click on the square icon.
4. Click the Pin icon that appears to the right of the topic timestamp.
5. The topic will move to the top of the list and remain there until unpinned.

Unpin a Topic:

1. Click the Unpin icon next to the topic you want to unpin.
2. The topic will return to its original position in the list.

#### Use Case:

This feature is beneficial for keeping critical topics visible for easy access during discussions or for new members joining the conversation. Only admin users can pin and unpin topics, ensuring that the list remains organized and relevant for all users.

#### Manual User Testing:

To manually test the Pin Topics feature:

1. Log in as an admin user.
2. Navigate to a topic in any category.
3. Pin the topic using the steps above and ensure it moves to the top.
4. Log out, then log back in to confirm the topic remains pinned.
5. Unpin the topic and verify it returns to its original position.

Ensure that only admins can see the pin/unpin button by logging in with a non-admin account and verifying that the buttons are not visible.

#### Automated Tests

Test Scenario 1: Pinned topics remain at the top of the list after applying filters to a page (SPRINT 1 IMPLEMENTATION/TESTING ATTEMPT)

- Test Steps:
  1. Pin a topic to the top of the list.
  2. Apply a filter to the page.
  3. Verify that the pinned topic remains at the top of the list.
- Expected Result: The pinned topic should remain at the top of the list after applying filters to the page.
- Automated Tests Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/05d7d39c4e63629d040ded6889cbe497c1f195dd/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/35/files#diff-9b41ba0f5d4d9a50e83e3539b03713f873869a24a0119f43698e052c584cb50c)

Test Scenario 2: Non admin users will not be able to see or use pin button functionality

- Test Steps:
  1. Created user with no admin priviliges
  2. Created test topic
  3. Verify that user won't be able to pin topic
- Expected Result: The user does not have access to see the pin button, so they should not be able to use any of the functionality.
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/44)

Test Scenario 3: Pinned posts persist after filtering over topics

- Test Steps:
  1. Pin a topic
  2. Apply topics filters over all the topics
  3. Verify that topic is still pinned
- Expected Result: The topic remians pinned regardless of filter applied.
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/47)

Test Scenario 4: Pinned posts persist after session changes

- Test Steps:
  1. Log in with a user
  2. Pin a topic
  3. Log out the user
  4. Verify that topic is still pinned
- Expected Result: The topic remians pinned regardless of session changes (login/logout)
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/47)

Test Scenario 5: Pinned posts persist after change in user account

- Test Steps:
  1. Log in with a non-admin user
  2. Pin a topic
  3. Log in with different user
  4. Verify that topic is still pinned
- Expected Result: The topic remians pinned regardless of changes in user account
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/47)

Test Scenario 6: Non-admins cannot pin a topic

- Test Steps:
  1. Log in with a user
  2. Attempt to pin a topic
  3. Assert that no privileges error is thrown.
- Expected Result: The topic cannot be pinned by non-admin users
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/47)

Test Scenario 7: Topics are automatically unpinned after expiry

- Test Steps:
  1. Set expiry date to 1 second from now
  2. Pin a topic with this expiry
  3. Stop execution for 1.1 seconds
  4. Verify topic gets unpinned
- Expected Result: The topic is automatically unpinned after expiry is passed
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/47)

Test Scenario 8: Lastest pinned topic is on top of list

- Test Steps:
  1. Unpin existing topics
  2. Pin a new topic
  3. Verify that the pinned topic remains at the top of the list.
- Expected Result: The newest pinned topic is on top of the list
- Automated Test Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/sprint2-main/test/topics.js), see [in PR](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/47)

#### Test Sufficiency Explanation:

The automated tests cover a comprehensive set of scenarios to ensure that the Pin Topics feature functions as intended under various conditions:

1.  Pinned Topics Behavior: Multiple scenarios test that pinned topics persist, even after actions such as applying filters (Scenario 3), changing user sessions (Scenario 4), and switching between user accounts (Scenario 5). This ensures that the feature maintains its core functionality regardless of how the user interacts with the interface.
2.  Admin Privileges and Access Control: The scenarios verify that only admin users have access to pinning functionality, and non-admin users cannot pin topics (Scenarios 2 & 6). This ensures proper access control and reinforces that the pinning feature is restricted to authorized users only.
3.  Topic Expiry: By testing the automatic unpinning of topics after expiration (Scenario 7), the suite ensures that the expiry feature is reliable and functions as designed.
4.  Order of Pinned Topics: Scenario 8 and Scenario 1 verify that the most recently pinned topic stays at the top of the list even if there are filters or sorting methods applied, ensuring the proper organization and prioritization of pinned topics.

These scenarios provide robust coverage for both functionality and permission validation. They not only ensure all the acceptance criteria (pinned posts remain on top of list, only selected users can pin posts) are mainted but also test this criteria in a number of scenarios to ensure their coverage. Additionally extra functionality such as the automatic unpinning of expired topics is also tested successfully.

### 2. Search Topics

#### Overview:

The Search Topics feature enables users to find specific topics quickly by entering keywords or phrases. The search functionality filters the list of topics dynamically based on the user's input, displaying any topics with titles that match the search criteria. This feature is particularly useful for users who want to locate specific information without scrolling through the entire list of topics.

#### How to Use:

1. Locate the search bar at the right corner of the topic list header bar (next to New Topic button).
2. Enter the title of the topic you want to find in the search bar.
3. The application will display a filtered list of topics that match your search criteria as you type.

#### Use Case:

This feature is particularly useful for users who want to locate specific information quickly without scrolling through the entire list of topics.

#### Manual User Testing:

To manually test the Search Topics feature:

1. Create a few topics with distinct titles.
2. Enter a keyword from one of the topic titles into the search bar.
3. Ensure that only topics matching the keyword appear in the list.
4. Test with partial matches and confirm the search updates in real-time.

#### Automated Tests

The search functionality is implemented using jQuery to manipulate the DOM based on the topics rendered on the page, and it does not interact with any backend API endpoints. Due to the client-side nature of the search, writing automated tests for this feature was not applicable. We considered using JSDOM to create a simulated browser environment where the DOM manipulations could be tested directly. However, this conflicted with the existing test setup and required significant changes to the testing framework. As a result, manual testing was the most effective way to validate the search functionality. For more details on the decision to perform manual testing, please refer to the PR discussion for this feature [here](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/41).

To demonstrate the functional client-side search, please see the [recorded demo](https://github.com/user-attachments/assets/2ba732c8-b89c-44af-b631-f0d1105a9fa1) of manual tests for the fully functional post search feature.

Test Scenario: Search for a topic using specific keywords

- Test Steps:
  1. Enter a keyword or phrase in the search bar.
  2. Observe the list of topics displayed.
  3. Verify that only topics containing the keyword or phrase are shown.
- Expected Result: The list of topics should be filtered to display only topics that match the search criteria.
- Automated Tests Location: N/A, see [recorded demo](https://github.com/user-attachments/assets/2ba732c8-b89c-44af-b631-f0d1105a9fa1)

#### Test Sufficiency Explanation:

While automated tests for the search feature were not applicable due to the client-side implementation, manual testing has been thorough. Real-time keyword filtering has been validated through multiple test cases. A recorded demo of this feature is also provided to confirm the functional behavior.

### 3. Post Views By User Group

#### Overview:

The Limit Topic Visibility feature allows the visibility of specific posts or topics to be restricted based on user group permissions. Admins and moderators can set the visibility of posts to be viewed only by designated groups such as 'Admin,' 'Moderators,' or 'All.' This feature enhances privacy and ensures that sensitive or important posts are only accessible to the intended user groups.

#### How to Use:

1. Setting Post Visibility:

   1. Sign in as any user
   2. Navigate to popular or recent posts page and click on "new topic"
   3. Notice the "Viewed By..." button and click it to choose user group from dropdown (e.g., Admin, Moderators, All)
   4. Save the post, and its visibility will be updated according to the selected group.

2. Rendering Posts for Different User Groups:
   1. Users who are part of the designated groups will automatically see the posts that are set to their group.
   2. Posts not visible to a user’s group will not be shown in their topic list.

#### Use Case:

This feature is particularly useful for Nodebb in the context of courses and education. This can be used for users who are posing certain information that they want or is required to be restricted to specific user groups. For instance, moderators (instructures) may want to discuss administrative actions without the general user base (students) having access to those conversations.

#### Manual User Testing:

1. Create a post and set its visibility to a specific group (e.g., Admin or Moderators or All).
2. Log in with a user account that belongs to the designated group and verify that the post is visible.
3. Log in with a user account that does not belong to the designated group and verify that the post is not visible.
4. Repeat the test for each group setting to ensure posts are correctly filtered by group.

#### Automated Tests

Test Scenario 1: Database correctly stores visibility settings for posts when user chooses it

- Test Steps:
  1. Create a new post and set the visibility to 'Admin.'
  2. Check the database to verify that the visibility field is stored correctly for the post.
- Expected Result: The database should correctly store the visibility field with the appropriate user group for the post.
- Automated Tests Location: [test/topics-viewers.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/commit/bab5c2e3e87ede66b393edb8a21625ec7fbaae9d#diff-30dcabcf5275851208c62815618cb983d7809dbcc498612a8b7c77eeb03f0f5f)

Test Scenario 2: Correct posts are rendered based on user group permissions

- Test Steps:
  1. Log in as a user belonging to the 'Admin' group.
  2. Verify that posts marked as visible to 'Admin' are rendered.
  3. Log in as a user from a different group (e.g., 'Moderators') and verify that posts for 'Admin' are not rendered for this user.
- Expected Result: Posts are filtered correctly based on user permissions, and only posts the user is authorized to view are rendered.
- Automated Tests Location: [test/topics-viewers.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/commit/bab5c2e3e87ede66b393edb8a21625ec7fbaae9d#diff-30dcabcf5275851208c62815618cb983d7809dbcc498612a8b7c77eeb03f0f5f)

#### Test Sufficiency Explanation:

These tests ensure that the system correctly manages the visibility of posts at both the database level and when posts are rendered for users. Many tests for post creation pre-existed in the tests/topics.js file, but our implementation added two major steps (adding/setting new feild in database and rendering posts by current user group). The two test scenarios—checking database storage of visibility fields and verifying post rendering based on permissions—provide comprehensive coverage of the feature’s functionality.
