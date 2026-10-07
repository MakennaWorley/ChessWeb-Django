/**
 * Pair page: builds a new pairing sheet for a chosen date and submits it to /new_pairings/.
 * 1:1 port of chess/static/pair.js — see /convert_to_type.md before changing this file.
 */
import type { NewPairingsRequest, NewPairingsRequestGame } from "./types";
import { BOARDS, cachedPlayers, fetchPlayers, formatDate, getCsrfToken, handlePlayerSelection, populatePlayerDropdown } from "./utils";

const csrfToken = getCsrfToken();

document.addEventListener('DOMContentLoaded', function (): void {
    const dateSubmitBtn = document.getElementById('dateSubmitBtn')!;
    const gameModal = document.getElementById('gameModal') as HTMLElement;
    const closeModal = document.getElementsByClassName('close')[0] as HTMLElement;
    const newGamesTableBody = document.getElementById('newGamesTableBody')!;
    const selectedDateSpan = document.getElementById('selectedDateDisplay')!;

    dateSubmitBtn.addEventListener('click', async function (event: Event): Promise<void> {
        event.preventDefault();
        const selectedDate = (document.getElementById('selectedDate') as HTMLInputElement).value;

        if (!selectedDate) {
            alert('Please select a date before continuing.');
            return;
        }

        const formattedDate = formatDate(selectedDate);

        if (formattedDate) {
            if (!cachedPlayers) {
                await fetchPlayers();
            }

            newGamesTableBody.innerHTML = '';

            selectedDateSpan.textContent = formattedDate;

            for (const board of BOARDS) {
                const row = `
                        <tr>
                            <td>${board}</td>
                            <td>
                                <select class="player-select" data-player="white_player">
                                    ${await populatePlayerDropdown('N/A')}
                                </select>
                            </td>
                            <td>
                                <select class="player-select" data-player="black_player">
                                    ${await populatePlayerDropdown('N/A')}
                                </select>
                            </td>
                        </tr>
                        `;
                newGamesTableBody.insertAdjacentHTML('beforeend', row);
            }

            document.querySelectorAll<HTMLSelectElement>('.player-select').forEach(select => {
                select.addEventListener('change', function (this: HTMLSelectElement) {
                    handlePlayerSelection(this);
                });
            });

            selectedDateSpan.textContent = selectedDate;
            gameModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    });

    document.getElementById('newGamesForm')!.addEventListener('submit', function (event: Event): void {
        event.preventDefault();

        const selectedDate = (document.getElementById('selectedDate') as HTMLInputElement).value;
        const formattedDate = formatDate(selectedDate);
        const separateClassesChecked = (document.getElementById('separateClasses') as HTMLInputElement).checked;
        const pairJaniceClassChecked = (document.getElementById('pairJaniceClass') as HTMLInputElement).checked;

        const gamesData: NewPairingsRequestGame[] = [];

        document.querySelectorAll('#newGamesTableBody tr').forEach(row => {
            const board = row.querySelector('td:nth-child(1)')!.textContent!;
            const whitePlayer = (row.querySelector('td:nth-child(2) select') as HTMLSelectElement).value;
            const blackPlayer = (row.querySelector('td:nth-child(3) select') as HTMLSelectElement).value;

            if (whitePlayer !== "N/A" && blackPlayer !== "N/A") {
                gamesData.push({ board, whitePlayer, blackPlayer });
            }
        });

        const requestBody: NewPairingsRequest = {
            game_date: formattedDate,
            games: gamesData,
            separate_classes: separateClassesChecked,
            pair_janice_class: pairJaniceClassChecked,
        };

        fetch(newPairingsUrl, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(requestBody),
        }).then(response => {
            if (response.ok) {
                alert('Pairings saved successfully!');
                gameModal.style.display = 'none';
            } else {
                alert('Error pairing games');
            }
        });
    });

    // Close the modal when the "close" button is clicked
    closeModal.addEventListener('click', function (): void {
        gameModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    // Close the modal when clicking outside of the modal content
    window.addEventListener('click', function (event: MouseEvent): void {
        if (event.target === gameModal) {
            gameModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});
