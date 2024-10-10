# User Guide
## Feature Overview
This user guide provides detailed instructions on how to use the following new/improved features implemented over the past two sprints:

- Pin Topics
- Search Topics
- Limit Topic Visibility to Specific User Groups

**** TO DOs: ****
- Add screenshots for each feature
- Add pin topics info for your contributions
- Sofian adds limit topic visibility related notes
    - Overview, How to Use, Use Case, Automated Tests


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


#### Automated Tests
Test Scenario: Pinned topics remain at the top of the list after applying filters to a page
- Test Steps:
    1. Pin a topic to the top of the list.
    2. Apply a filter to the page.
    3. Verify that the pinned topic remains at the top of the list.
- Expected Result: The pinned topic should remain at the top of the list after applying filters to the page.
- Automated Tests Location: [test/topics.js](https://github.com/CMU-313/nodebb-f24-team-sweepers/blob/05d7d39c4e63629d040ded6889cbe497c1f195dd/test/topics.js)



### 2. Search Topics
#### Overview:
The Search Topics feature enables users to find specific topics quickly by entering keywords or phrases. The search functionality filters the list of topics dynamically based on the user's input, displaying any topics with titles that match the search criteria. This feature is particularly useful for users who want to locate specific information without scrolling through the entire list of topics.

#### How to Use:
1. Locate the search bar at the right corner of the topic list header bar (next to New Topic button).
2. Enter the title of the topic you want to find in the search bar.
4. The application will display a filtered list of topics that match your search criteria as you type.

#### Use Case:
This feature is particularly useful for users who want to locate specific information quickly without scrolling through the entire list of topics.

#### Automated Tests
The search functionality is implemented using jQuery to manipulate the DOM based on the topics rendered on the page, and it does not interact with any backend API endpoints. Due to the client-side nature of the search, writing automated tests for this feature was not applicable. We considered using JSDOM to create a simulated browser environment where the DOM manipulations could be tested directly. However, this conflicted with the existing test setup and required significant changes to the testing framework. As a result, manual testing was the most effective way to validate the search functionality. For more details on the decision to perform manual testing, please refer to the PR discussion for this feature [here](https://github.com/CMU-313/nodebb-f24-team-sweepers/pull/41).

To demonstrate the functional client-side search, please see the [recorded demo](https://github.com/user-attachments/assets/2ba732c8-b89c-44af-b631-f0d1105a9fa1) of manual tests for the fully functional post search feature.

Test Scenario: Search for a topic using specific keywords
- Test Steps:
    1. Enter a keyword or phrase in the search bar.
    2. Observe the list of topics displayed.
    3. Verify that only topics containing the keyword or phrase are shown.
- Expected Result: The list of topics should be filtered to display only topics that match the search criteria.
- Automated Tests Location: N/A