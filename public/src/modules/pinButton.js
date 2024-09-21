// 'use strict';
// // ALL CODE IN FILE WRITTEN BY CHATGPT
// define('pinButton', ['components'], function (components) {
//     const PinButton = {};

//     let pinButtonContainer;

//     // Initialize the button component
//     PinButton.init = function (onPin) {
//         pinButtonContainer = $('[component="pin/button"]');
        
//         // Prevent text selection when clicking the button
//         pinButtonContainer.on('selectstart', function (ev) {
//             ev.preventDefault();
//         });

//         // Handle button click
//         pinButtonContainer.on('click', function (ev) {
//             const buttonEl = $(this);
//             togglePin(buttonEl);
//             if (typeof onPin === 'function') {
//                 onPin();
//             }
//         });
//     };

//     function togglePin(buttonEl) {
//         const isPinned = buttonEl.hasClass('pinned');
//         buttonEl.toggleClass('pinned', !isPinned);
//         buttonEl.text(isPinned ? 'Pin' : 'Unpin'); // Change button text based on state
//     }

//     return PinButton;
// });
