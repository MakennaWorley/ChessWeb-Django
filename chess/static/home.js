const form = document.getElementById('data-selection-form');
const playersTable = document.getElementById('ratings_sheet');
const gamesTable = document.getElementById('pairings_sheet');
const datePicker = document.getElementById('date-picker');
const gameDateSelect = document.getElementById('game-date');
const volunteerToggle = document.getElementById('volunteer-toggle');
const helpText = document.getElementById('help-text');

form.addEventListener('change', function (event) {
    const selectedDataType = form.elements['data_type'].value;
    const showVolunteers = form.elements['volunteer-toggle'].value;

    playersTable.style.display = selectedDataType === 'players' ? '' : 'none';
    gamesTable.style.display = selectedDataType === 'games' ? '' : 'none';

    if (selectedDataType === 'games')  {
        const selectedDate = gameDateSelect.value;
        datePicker.style.display = '';
        volunteerToggle.style.display = 'none';
        helpText.textContent = `Here are the pairings from the selected date, ${selectedDate} with the current results as stored in the database. If a result has been entered incorrectly, please contact Makenna.`;
        fetchPairingsSheet();
    } else {
        datePicker.style.display = 'none';
        volunteerToggle.style.display = '';
        if (showVolunteers === 'true') {
            helpText.textContent = 'Here are the ratings of the players as stored in the database. This is currently displaying volunteers\' ratings.';
            fetchRatingsSheet(true)
        } else {
            helpText.textContent = 'Here are the ratings of the players as stored in the database. This is currently not displaying volunteers\' ratings.';
            fetchRatingsSheet(false)
        }
    }
});

gameDateSelect.addEventListener('change', fetchPairingsSheet);

document.addEventListener('DOMContentLoaded', function () {
    fetchRatingsSheet(false);
});