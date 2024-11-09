const form = document.getElementById('data-selection-form');
const playersTable = document.getElementById('ratings_sheet');
const gamesTable = document.getElementById('pairings_sheet');
const datePicker = document.getElementById('date-picker');
const gameDateSelect = document.getElementById('game-date');

form.addEventListener('change', function (event) {
    const selectedDataType = form.elements['data_type'].value;

    playersTable.style.display = selectedDataType === 'players' ? '' : 'none';
    gamesTable.style.display = selectedDataType === 'games' ? '' : 'none';

    if (selectedDataType === 'games') {
        datePicker.style.display = '';
        fetchPairingsSheet();
    } else {
        datePicker.style.display = 'none';
    }
});

gameDateSelect.addEventListener('change', fetchPairingsSheet);

document.addEventListener('DOMContentLoaded', function () {
    fetchRatingsSheet();
});