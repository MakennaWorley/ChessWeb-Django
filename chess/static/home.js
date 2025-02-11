"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const form = document.getElementById('data-selection-form');
const playersTable = document.getElementById('ratings_sheet');
const gamesTable = document.getElementById('pairings_sheet');
const datePicker = document.getElementById('date-picker');
const gameDateSelect = document.getElementById('game-date');
const volunteerToggle = document.getElementById('volunteer-toggle');
const helpText = document.getElementById('help-text');
// Event listener for form changes
form === null || form === void 0 ? void 0 : form.addEventListener('change', () => {
    var _c, _d;
    if (!form)
        return;
    const selectedDataType = ((_c = form.elements.namedItem('data_type')) === null || _c === void 0 ? void 0 : _c.value) || '';
    const showVolunteers = ((_d = form.elements.namedItem('volunteer-toggle')) === null || _d === void 0 ? void 0 : _d.checked) || false;
    // Toggle table visibility based on selected data type
    if (playersTable)
        playersTable.style.display = selectedDataType === 'players' ? '' : 'none';
    if (gamesTable)
        gamesTable.style.display = selectedDataType === 'games' ? '' : 'none';
    // Handle specific cases for 'games' and 'players'
    if (selectedDataType === 'games') {
        handleGamesDisplay();
    }
    else if (selectedDataType === 'players') {
        handlePlayersDisplay(showVolunteers);
    }
});
// Event listener for date selection
gameDateSelect === null || gameDateSelect === void 0 ? void 0 : gameDateSelect.addEventListener('change', utils_1.fetchPairingsSheet);
// Initialize data on page load
document.addEventListener('DOMContentLoaded', () => {
    (0, utils_1.fetchRatingsSheet)(false);
});
// Helper function for handling games display logic
function handleGamesDisplay() {
    const selectedDate = (gameDateSelect === null || gameDateSelect === void 0 ? void 0 : gameDateSelect.value) || '';
    if (datePicker)
        datePicker.style.display = '';
    if (volunteerToggle)
        volunteerToggle.style.display = 'none';
    if (helpText) {
        helpText.textContent = `Here are the pairings from the selected date, ${selectedDate}, with the current results as stored in the database. If a result has been entered incorrectly, please contact Makenna.`;
    }
    (0, utils_1.fetchPairingsSheet)();
}
// Helper function for handling players display logic
function handlePlayersDisplay(showVolunteers) {
    if (datePicker)
        datePicker.style.display = 'none';
    if (volunteerToggle)
        volunteerToggle.style.display = '';
    if (helpText) {
        helpText.innerHTML = showVolunteers
            ? `Here are the ratings of the players as stored in the database. This is currently displaying volunteers' ratings.`
            : `Here are the ratings of the players as stored in the database. This is currently <strong>NOT</strong> displaying volunteers' ratings.`;
    }
    (0, utils_1.fetchRatingsSheet)(showVolunteers);
}
