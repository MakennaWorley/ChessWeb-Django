/**
 * Home page: toggles between the ratings sheet and the pairings sheet.
 * 1:1 port of chess/static/home.js — see /convert_to_type.md before changing this file.
 */
import { fetchPairingsSheet, fetchRatingsSheet } from "./utils";

const form = document.getElementById('data-selection-form') as HTMLFormElement;
const playersTable = document.getElementById('ratings_sheet')!;
const gamesTable = document.getElementById('pairings_sheet')!;
const datePicker = document.getElementById('date-picker')!;
const gameDateSelect = document.getElementById('game-date') as HTMLSelectElement;
const volunteerToggle = document.getElementById('volunteer-toggle')!;
const helpText = document.getElementById('help-text')!;

form.addEventListener('change', function (): void {
    const selectedDataType = (form.elements.namedItem('data_type') as RadioNodeList).value;
    const showVolunteers = (form.elements.namedItem('volunteer-toggle') as RadioNodeList).value;

    playersTable.style.display = selectedDataType === 'players' ? '' : 'none';
    gamesTable.style.display = selectedDataType === 'games' ? '' : 'none';

    if (selectedDataType === 'games') {
        const selectedDate = gameDateSelect.value;
        datePicker.style.display = '';
        volunteerToggle.style.display = 'none';
        helpText.textContent = `Here are the pairings from the selected date, ${selectedDate} with the current results
        as stored in the database. If a result has been entered incorrectly, please contact Makenna.`;
        fetchPairingsSheet();
    } else {
        datePicker.style.display = 'none';
        volunteerToggle.style.display = '';
        if (showVolunteers === 'true') {
            helpText.innerHTML = 'Here are the ratings of the players as stored in the database. This is currently displaying volunteers\' ratings.';
            fetchRatingsSheet(true);
        } else {
            helpText.innerHTML = 'Here are the ratings of the players as stored in the database. This is currently <strong>NOT</strong> displaying volunteers\' ratings.';
            fetchRatingsSheet(false);
        }
    }
});

gameDateSelect.addEventListener('change', () => fetchPairingsSheet());

document.addEventListener('DOMContentLoaded', function (): void {
    fetchRatingsSheet(false);
});
