import { fetchRatingsSheet, fetchPairingsSheet } from './appFunctions';

const form = document.getElementById('data-selection-form') as HTMLFormElement;
const playersTable = document.getElementById('ratings_sheet') as HTMLElement;
const gamesTable = document.getElementById('pairings_sheet') as HTMLElement;
const datePicker = document.getElementById('date-picker') as HTMLElement;
const gameDateSelect = document.getElementById('game-date') as HTMLSelectElement;
const volunteerToggle = document.getElementById('volunteer-toggle') as HTMLElement;
const helpText = document.getElementById('help-text') as HTMLElement;

// Event listener for form changes
form?.addEventListener('change', () => {
    if (!form) return;

    const selectedDataType = (form.elements.namedItem('data_type') as HTMLInputElement)?.value || '';
    const showVolunteers = (form.elements.namedItem('volunteer-toggle') as HTMLInputElement)?.checked || false;

    // Toggle table visibility based on selected data type
    if (playersTable) playersTable.style.display = selectedDataType === 'players' ? '' : 'none';
    if (gamesTable) gamesTable.style.display = selectedDataType === 'games' ? '' : 'none';

    // Handle specific cases for 'games' and 'players'
    if (selectedDataType === 'games') {
        handleGamesDisplay();
    } else if (selectedDataType === 'players') {
        handlePlayersDisplay(showVolunteers);
    }
});

// Event listener for date selection
gameDateSelect?.addEventListener('change', fetchPairingsSheet);

// Initialize data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchRatingsSheet(false);
});

// Helper function for handling games display logic
function handleGamesDisplay() {
    const selectedDate = gameDateSelect?.value || '';

    if (datePicker) datePicker.style.display = '';
    if (volunteerToggle) volunteerToggle.style.display = 'none';

    if (helpText) {
        helpText.textContent = `Here are the pairings from the selected date, ${selectedDate}, with the current results as stored in the database. If a result has been entered incorrectly, please contact Makenna.`;
    }

    fetchPairingsSheet();
}

// Helper function for handling players display logic
function handlePlayersDisplay(showVolunteers: boolean) {
    if (datePicker) datePicker.style.display = 'none';
    if (volunteerToggle) volunteerToggle.style.display = '';

    if (helpText) {
        helpText.innerHTML = showVolunteers
            ? `Here are the ratings of the players as stored in the database. This is currently displaying volunteers' ratings.`
            : `Here are the ratings of the players as stored in the database. This is currently <strong>NOT</strong> displaying volunteers' ratings.`;
    }

    fetchRatingsSheet(showVolunteers);
}