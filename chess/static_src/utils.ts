/**
 * Shared fetch/render/state helpers used by home.ts, pair.ts, and input_results.ts.
 * 1:1 port of chess/static/utils.js — see /convert_to_type.md before changing this file.
 */
import type { PlayerOption, RatingsPlayerRow, GameRow, BoardLabel, GetGamesResponse } from "./types";

export let cachedRatings: RatingsPlayerRow[] | null = null;
export let cachedRatingsVolunteers = false;
export let cachedPlayers: PlayerOption[] | null = null;
export let cachedGames: GameRow[] | null = null;
export let cachedGameDate: string | null = null;

export const BOARDS: BoardLabel[] = [
    ...Array.from({ length: 5 }, (_, i) => `G-${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `H-${i + 1}`),
    ...Array.from({ length: 22 }, (_, i) => `I-${i + 1}`),
    ...Array.from({ length: 22 }, (_, i) => `J-${i + 1}`),
];

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]!;
}

/** Same selector every page uses for the CSRF token; centralized to avoid repeating the null check. */
export function getCsrfToken(): string {
    const input = document.querySelector<HTMLInputElement>('[name=csrfmiddlewaretoken]');
    return input?.value || '';
}

export async function fetchPlayers(): Promise<PlayerOption[]> {
    if (cachedPlayers) {
        return cachedPlayers;
    }

    try {
        const response = await fetch(getPlayersUrl);
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data: { players: PlayerOption[] } = await response.json();
        cachedPlayers = data.players;
        return cachedPlayers;
    } catch (error) {
        console.error('There was a problem fetching player data:', error);
        return [];
    }
}

/**
 * Unused by any page today (verified against chess/static/*.js and chess/templates) —
 * ported as-is per convert_to_type.md's "don't remove unilaterally" rule. The original
 * relied on a `gameDateSelect` global only declared in home.js; that cross-file coupling
 * is replaced here with the same `document.getElementById('game-date')` lookup home.js
 * itself used, which is the deliberate fix convert_to_type.md calls for — same element,
 * same behavior, no more load-order dependency on another page's script.
 */
export async function fetchGames(): Promise<GetGamesResponse | undefined> {
    const gameDateSelect = document.getElementById('game-date') as HTMLInputElement | null;
    if (!gameDateSelect) {
        throw new Error('game-date element not found');
    }
    const gameDate = formatDate(gameDateSelect.value);

    try {
        const response = await fetch(getGamesUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({ game_date: gameDate }),
        });

        if (!response.ok) {
            throw new Error('Bad Request');
        }

        const data: GetGamesResponse = await response.json();
        if ('status' in data && data.status === 'error') {
            console.error('Server response:', data.message);
        }

        return data;
    } catch (error) {
        console.error('Error fetching pairings data:', error);
        return undefined;
    }
}

export async function fetchRatingsSheet(showVolunteers: boolean): Promise<void> {
    const ratingsSheetDiv = document.getElementById('ratings_sheet')!;

    if (cachedRatings && cachedRatingsVolunteers === showVolunteers) {
        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(cachedRatings);
    }

    try {
        const response = await fetch(getRatingsSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({ show_volunteers: showVolunteers }),
        });
        if (!response.ok) {
            throw new Error('Error reading data');
        }
        const data: { players: RatingsPlayerRow[] } = await response.json();
        cachedRatings = data.players;
        cachedRatingsVolunteers = showVolunteers;

        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(cachedRatings);
    } catch (error) {
        console.error('There was a problem fetching player data:', error);
    }
}

export async function fetchPairingsSheet(): Promise<void> {
    const pairingsSheetDiv = document.getElementById('pairings_sheet')!;
    const gameDateSelect = document.getElementById('game-date') as HTMLInputElement;
    const gameDate = formatDate(gameDateSelect.value);

    if (cachedGames && cachedGameDate === gameDate) {
        pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(cachedGames);
        return;
    }

    try {
        const response = await fetch(getPairingsSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({ game_date: gameDate }),
        });

        if (!response.ok) {
            throw new Error('Bad Request');
        }

        const data: GetGamesResponse = await response.json();
        if ('status' in data && data.status === 'error') {
            console.error('Server response:', data.message);
        }

        const games = 'games' in data ? data.games : [];
        cachedGames = games;
        cachedGameDate = gameDate;

        pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(games);
    } catch (error) {
        console.error('Error fetching pairings data:', error);
    }
}

export async function populatePlayerDropdown(selectedPlayer: string): Promise<string> {
    let dropdownHTML = '';

    if (Array.isArray(cachedPlayers)) {
        cachedPlayers.forEach(player => {
            const playerName = `${player.name}`;
            dropdownHTML += `<option value="${playerName}" ${playerName === selectedPlayer ? 'selected' : ''}>${playerName}</option>`;
        });
    }

    dropdownHTML += `<option value="N/A" ${selectedPlayer === 'N/A' ? 'selected' : ''}>N/A</option>`;
    return dropdownHTML;
}

// Function to handle player selection and set other occurrences of that player to N/A
export function handlePlayerSelection(selectedDropdown: HTMLSelectElement): void {
    const selectedPlayer = selectedDropdown.value;
    const playerDropdowns = document.querySelectorAll<HTMLSelectElement>('.player-select');

    playerDropdowns.forEach(dropdown => {
        if (dropdown !== selectedDropdown && dropdown.value === selectedPlayer) {
            dropdown.value = 'N/A';
        }
    });
}

export function generateRatingsSheetHTML(players: RatingsPlayerRow[]): string {
    let html = `
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Rating Change</th>
                <th>Grade</th>
                <th>Coach(s)</th>
                <th>Parent or Guardian</th>
                <th>Parent Email</th>
                <th>Parent Phone Number</th>
            </tr>
        </thead>
        <tbody>
    `;

    players.forEach(player => {
        html += `
            <tr>
                <td>${player.name}</td>
                <td>${player.rating}</td>
                <td>${player.improved_rating}</td>
                <td>${player.grade}</td>
                <td>${player.lesson_class}</td>
                <td>${player.parent_or_guardian}</td>
                <td>${player.email}</td>
                <td>${player.phone}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}

export function generatePairingsSheetHTML(games: GameRow[]): string {
    let html = `
    <table>
        <thead>
            <tr>
                <th>Board</th>
                <th>White Player</th>
                <th>Result</th>
                <th>Black Player</th>
            </tr>
        </thead>
    <tbody>`;

    const gamesMap = Object.fromEntries(games.map(game => [game.board, game]));

    BOARDS.forEach(board => {
        const game = gamesMap[board];
        html += `
            <tr>
                <td>${board}</td>
                <td>${game ? game.white_player : 'N/A'}</td>
                <td>${game ? game.result : ''}</td>
                <td>${game ? game.black_player : 'N/A'}</td>
            </tr>
        `;
    });

    html += `
        </tbody>
    </table>`;

    return html;
}
