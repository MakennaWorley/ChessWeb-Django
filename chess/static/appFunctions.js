"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCsrfToken = exports.newPairingsUrl = exports.saveGamesUrl = exports.getGamesUrl = exports.getRatingsSheetUrl = exports.getPairingsSheetUrl = exports.getPlayersUrl = exports.cachedGameDate = exports.cachedGames = exports.cachedPlayers = exports.cachedRatingsVolunteers = exports.cachedRatings = exports.BOARDS = void 0;
exports.formatDate = formatDate;
exports.fetchPlayers = fetchPlayers;
exports.fetchGames = fetchGames;
exports.fetchRatingsSheet = fetchRatingsSheet;
exports.fetchPairingsSheet = fetchPairingsSheet;
exports.populatePlayerDropdown = populatePlayerDropdown;
exports.handlePlayerSelection = handlePlayerSelection;
exports.generateRatingsSheetHTML = generateRatingsSheetHTML;
exports.generatePairingsSheetHTML = generatePairingsSheetHTML;
var gameDateSelect = document.getElementById('game-date');
exports.BOARDS = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], Array.from({ length: 5 }, function (_, i) { return "G-".concat(i + 1); }), true), Array.from({ length: 6 }, function (_, i) { return "H-".concat(i + 1); }), true), Array.from({ length: 22 }, function (_, i) { return "I-".concat(i + 1); }), true), Array.from({ length: 22 }, function (_, i) { return "J-".concat(i + 1); }), true);
exports.cachedRatings = [];
exports.cachedRatingsVolunteers = false;
exports.cachedPlayers = [];
exports.cachedGames = [];
exports.cachedGameDate = "";
exports.getPlayersUrl = "{% url 'get_players' %}";
exports.getPairingsSheetUrl = "{% url 'get_games' %}";
exports.getRatingsSheetUrl = "{% url 'get_ratings_sheet' %}";
exports.getGamesUrl = "{% url 'get_games' %}";
exports.saveGamesUrl = "{% url 'save_games' %}";
exports.newPairingsUrl = "{% url 'new_pairings' %}";
var getCsrfToken = function () { var _a; return ((_a = document.querySelector('[name=csrfmiddlewaretoken]')) === null || _a === void 0 ? void 0 : _a.value) || ''; };
exports.getCsrfToken = getCsrfToken;
function formatDate(dateStr) {
    var date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}
function fetchPlayers() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (exports.cachedPlayers) {
                        return [2 /*return*/, exports.cachedPlayers];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(exports.getPlayersUrl)];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Error reading data');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    exports.cachedPlayers = data.players;
                    return [2 /*return*/, exports.cachedPlayers];
                case 4:
                    error_1 = _a.sent();
                    console.error('There was a problem fetching player data:', error_1);
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchGames() {
    return __awaiter(this, void 0, void 0, function () {
        var gameDate, response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!gameDateSelect) {
                        throw new Error("game-date element not found");
                    }
                    gameDate = formatDate(gameDateSelect.value);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(exports.getGamesUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': (0, exports.getCsrfToken)(),
                            },
                            body: JSON.stringify({ game_date: gameDate }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Bad Request');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data.status === "error") {
                        console.error("Server response:", data.message);
                    }
                    return [2 /*return*/, data];
                case 4:
                    error_2 = _a.sent();
                    console.error('Error fetching pairings data:', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchRatingsSheet(showVolunteers) {
    return __awaiter(this, void 0, void 0, function () {
        var ratingsSheetDiv, response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ratingsSheetDiv = document.getElementById('ratings_sheet');
                    if (exports.cachedRatings && exports.cachedRatingsVolunteers === showVolunteers) {
                        ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(exports.cachedRatings);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(exports.getRatingsSheetUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': (0, exports.getCsrfToken)(),
                            },
                            body: JSON.stringify({ show_volunteers: showVolunteers }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Error reading data');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    exports.cachedRatings = data.players;
                    ratingsSheetDiv.innerHTML = generateRatingsSheetHTML(exports.cachedRatings);
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('There was a problem fetching player data:', error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchPairingsSheet() {
    return __awaiter(this, void 0, void 0, function () {
        var pairingsSheetDiv, gameDateSelect, gameDate, response, data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pairingsSheetDiv = document.getElementById('pairings_sheet');
                    gameDateSelect = document.getElementById('game-date');
                    if (!gameDateSelect) {
                        throw new Error("game-date element not found");
                    }
                    gameDate = formatDate(gameDateSelect.value);
                    if (exports.cachedGames && exports.cachedGameDate === gameDate) {
                        pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(exports.cachedGames);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(exports.getPairingsSheetUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': (0, exports.getCsrfToken)(),
                            },
                            body: JSON.stringify({ game_date: gameDate }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Bad Request');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data.status === "error") {
                        console.error("Server response:", data.message);
                    }
                    exports.cachedGames = data.games || [];
                    exports.cachedGameDate = gameDate;
                    pairingsSheetDiv.innerHTML = generatePairingsSheetHTML(data.games || []);
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    console.error('Error fetching pairings data:', error_4);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function populatePlayerDropdown(selectedPlayer) {
    return __awaiter(this, void 0, void 0, function () {
        var dropdownHTML;
        return __generator(this, function (_a) {
            dropdownHTML = '';
            if (Array.isArray(exports.cachedPlayers)) {
                exports.cachedPlayers.forEach(function (player) {
                    var playerName = "".concat(player.name);
                    dropdownHTML += "<option value=\"".concat(playerName, "\" ").concat(playerName === selectedPlayer.name ? 'selected' : '', ">").concat(playerName, "</option>");
                });
            }
            dropdownHTML += "<option value=\"N/A\" ".concat(selectedPlayer.name === 'N/A' ? 'selected' : '', ">N/A</option>");
            return [2 /*return*/, dropdownHTML];
        });
    });
}
// Function to handle player selection and set other occurrences of that player to N/A
function handlePlayerSelection(selectedDropdown) {
    var selectedPlayer = selectedDropdown.value;
    var playerDropdowns = document.querySelectorAll('.player-select');
    playerDropdowns.forEach(function (dropdown) {
        if (dropdown !== selectedDropdown && dropdown.value === selectedPlayer) {
            dropdown.value = 'N/A';
        }
    });
}
function generateRatingsSheetHTML(players) {
    var html = "\n    <table>\n        <thead>\n            <tr>\n                <th>Name</th>\n                <th>Rating</th>\n                <th>Rating Change</th>\n                <th>Grade</th>\n                <th>Coach(s)</th>\n                <th>Parent or Guardian</th>\n                <th>Parent Email</th>\n                <th>Parent Phone Number</th>\n            </tr>\n        </thead>\n        <tbody>\n    ";
    players.forEach(function (player) {
        html += "\n            <tr>\n                <td>".concat(player.name, "</td>\n                <td>").concat(player.rating, "</td>\n                <td>").concat(player.improvedRating, "</td>\n                <td>").concat(player.grade, "</td>\n                <td>").concat(player.lessonClass, "</td>\n                <td>").concat(player.parentOrGuardian, "</td>\n                <td>").concat(player.email, "</td>\n                <td>").concat(player.phone, "</td>\n            </tr>\n        ");
    });
    html += "\n        </tbody>\n    </table>";
    return html;
}
function generatePairingsSheetHTML(games) {
    var html = "\n    <table>\n        <thead>\n            <tr>\n                <th>Board</th>\n                <th>White Player</th>\n                <th>Result</th>\n                <th>Black Player</th>\n            </tr>\n        </thead>\n    <tbody>";
    var gamesMap = {};
    games.forEach(function (game) {
        var key = "".concat(game.boardLetter, "-").concat(game.boardNumber);
        gamesMap[key] = game;
    });
    exports.BOARDS.forEach(function (board) {
        var game = gamesMap[board];
        html += "\n            <tr>\n                <td>".concat(board, "</td>\n                <td>").concat(game ? game.white : 'N/A', "</td>\n                <td>").concat(game ? game.result : '', "</td>\n                <td>").concat(game ? game.black : 'N/A', "</td>\n            </tr>\n        ");
    });
    html += "\n        </tbody>\n    </table>";
    return html;
}
