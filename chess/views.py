import os
import json

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q, Count
from django.http import HttpResponseRedirect, HttpResponse, Http404, JsonResponse
from django.shortcuts import render, redirect
from django.utils import timezone

from .forms import SignUpForm, PairingDateForm, GameSaveForm
from .models import RegisteredUser, Player, Game
from .write_to_file import write_ratings, write_pairings, export_player_data


# Global Variables
CREATED_RATING_FILES_DIR = os.path.join(os.path.dirname(__file__), '../files', 'ratings')
CREATED_PAIRING_FILES_DIR = os.path.join(os.path.dirname(__file__), '../files', 'pairings')

BOARD_SORT_ORDER = ['G', 'H', 'I', 'J']
BOARDS = [
    *[f"G-{i + 1}" for i in range(5)],
    *[f"H-{i + 1}" for i in range(6)],
    *[f"I-{i + 1}" for i in range(22)],
    *[f"J-{i + 1}" for i in range(22)]
]

RATINGS_HELPER = lambda rating, result, expected: round(rating + 32 * (result - expected))
CALC_EXPECTED = lambda player_rating, opponent_rating: 1 / (1 + 10 ** ((opponent_rating - player_rating) / 400))


# Functions associated with the API calls to database
def get_players(request):
    players = Player.objects.filter(active_member=True, is_active=True).order_by('last_name', 'first_name')

    players_data = [
        {
            "id": player.id,
            "name": player.name(),
        }
        for player in players
    ]

    return JsonResponse({'players': players_data})


def get_games(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            game_date = body.get('game_date')

            if not game_date:
                return JsonResponse({'status': 'error', 'message': 'No game date provided'}, status=400)

            games = Game.objects.filter(date_of_match=game_date, is_active=True).all()

            if not games.exists():
                return JsonResponse({'status': 'error', 'message': f'No games found for date {game_date}'}, status=404)

            games_data = []
            board_index = {board: index for index, board in enumerate(BOARDS)}

            for game in games:
                result = '' if game.result in ['NONE', 'U'] else game.result

                games_data.append({
                    "id": game.id,
                    'board': game.get_board(),
                    'white_player': game.white.name() if game.white else 'N/A',
                    'result': result,
                    'black_player': game.black.name() if game.black else 'N/A',
                })

            games_data.sort(key=lambda game: board_index.get(game['board'], float('inf')))

            return JsonResponse({'games': games_data}, status=200)


        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)


def get_ratings_sheet(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            show_volunteers = body.get('show_volunteers')

            if show_volunteers:
                players = Player.objects.filter(active_member=True, is_active=True).order_by('-rating',
                                                                                             '-grade',
                                                                                             'last_name',
                                                                                             'first_name')
            else:
                players = Player.objects.filter(active_member=True, is_active=True, is_volunteer=False).order_by('-rating',
                                                                                                                 '-grade',
                                                                                                                 'last_name',
                                                                                                                 'first_name')
            player_data = []

            for player in players:
                player_data.append({
                    'id': player.id,
                    'name': player.name(),
                    'rating': str(player.rating),
                    'improved_rating': player.improved_rating() if player.beginning_rating else '',
                    'grade': str(player.grade) if player.grade else '',
                    'lesson_class': player.lesson_class.name if player.lesson_class else '',
                    'parent_or_guardian': player.parent_or_guardian if player.parent_or_guardian else '',
                    'email': player.email if player.email else '',
                    'phone': player.phone if player.phone else '',
                })

            return JsonResponse({'players': player_data})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)


# View relating to the login page
def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                next_url = request.GET.get('next')
                if next_url:
                    return HttpResponseRedirect(next_url)
                else:
                    return redirect('home')
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()
    return render(request, 'chess/login.html', {'form': form})


# View and Function relating to the signup page
def signup_view(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            if user:
                login(request, user)
                return redirect('home')
    else:
        form = SignUpForm()

    return render(request, 'chess/signup.html', {'form': form})


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            RegisteredUser.objects.create(user=user)
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'chess/signup.html', {'form': form})


# View relating to the home page
def home_view(request):
    games_by_date = Game.objects.filter(is_active=True).values('date_of_match').annotate(
        game_count=Count('id')).order_by('-date_of_match')

    context = {
        'games_by_date': games_by_date,
        "email": settings.MY_EMAIL,
        "phone": settings.MY_PHONE_NUMBER,
    }

    return render(request, 'chess/home.html', context)


# View and Functions relating to the input results page
def input_results_view(request):
    form = GameSaveForm()

    games_by_date = Game.objects.filter(is_active=True).values('date_of_match').annotate(
        game_count=Count('id')).order_by('-date_of_match')

    ratings_dir = os.path.join(settings.BASE_DIR, 'files', 'ratings')
    try:
        existing_files = os.listdir(ratings_dir)
    except FileNotFoundError:
        existing_files = []

    if ".DS_Store" in existing_files:
        existing_files.remove(".DS_Store")

    existing_files = sorted(
        existing_files,
        key=lambda f: os.path.getmtime(os.path.join(ratings_dir, f)),
        reverse=True
    )

    context = {
        'form': form,
        'games_by_date': games_by_date,
        'existing_files': existing_files,
        "email": settings.MY_EMAIL,
        "phone": settings.MY_PHONE_NUMBER,
    }
    return render(request, 'chess/input_results.html', context)


def save_games(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            game_date = data.get('game_date')
            games = data.get('games')

            if not games:
                return JsonResponse({'status': 'error', 'message': 'No games data received'}, status=400)

            games_keyed = {
                game['board']: {key: value for key, value in game.items() if key != 'board'} for game in games
                if not (game['white'] == "N/A" and game['black'] == "N/A")
            }

            games_db = Game.objects.filter(date_of_match=game_date)
            games_db_keyed = {
                game.get_board(): game for game in games_db
            }

            # Games not in the db
            new_games_to_db = {
                board: details for board, details in games_keyed.items() if board not in games_db_keyed
            }

            # Games not in data
            games_not_in_data = {
                board: game for board, game in games_db_keyed.items() if board not in games_keyed
            }

            updated_games = {}

            for board, details in games_keyed.items():
                if board in games_db_keyed:
                    db_game = games_db_keyed[board]

                    white_db = db_game.white.name() if db_game.white is not None else "N/A"
                    black_db = db_game.black.name() if db_game.black is not None else "N/A"
                    result_db = db_game.result or "NONE"

                    if white_db != details['white'] or black_db != details['black'] or result_db != details['result']:
                        updated_games[board] = details

            added_games_report = []
            deactivated_games_report = []
            updated_games_report = []

            games_with_results = {}

            user = request.user

            with transaction.atomic():
                # Add new games
                for board, details in new_games_to_db.items():
                    try:
                        white_player = Player.objects.get(first_name=details['white'].split(', ')[1],
                                                          last_name=details['white'].split(', ')[0]) if details[
                                                                                                            'white'] != "N/A" else None
                        black_player = Player.objects.get(first_name=details['black'].split(', ')[1],
                                                          last_name=details['black'].split(', ')[0]) if details[
                                                                                                            'black'] != "N/A" else None
                        if details['result'] != "NONE":
                            games_with_results[board] = [white_player, black_player, details['result']]
                        Game.add_game(
                            date_of_match=game_date,
                            board_letter=board[0],
                            board_number=int(board[2:]),
                            white=white_player,
                            black=black_player,
                            result=details['result'],
                            modified_by=user
                        )
                        added_games_report.append(f"Added game for board {board}")
                    except ValidationError as e:
                        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

                # Deactivate games
                for board, game in games_not_in_data.items():
                    game.is_active = False
                    game.end_at = timezone.now()
                    game.save()
                    deactivated_games_report.append(f"Deactivated game for board {board}")

                # Update existing games
                for board, details in updated_games.items():
                    db_game = games_db_keyed[board]
                    white_player = Player.objects.filter(first_name=details['white'].split(', ')[1],
                                                         last_name=details['white'].split(', ')[0],
                                                         is_active=True).first() if details[
                                                                                        'white'] != "N/A" else None
                    black_player = Player.objects.filter(first_name=details['black'].split(', ')[1],
                                                         last_name=details['black'].split(', ')[0],
                                                         is_active=True).first() if details[
                                                                                        'black'] != "N/A" else None
                    if details['result'] != "NONE":
                        games_with_results[board] = [white_player, black_player, details['result']]

                    db_game.update_game(
                        date_of_match=game_date,
                        board_letter=board[0],
                        board_number=int(board[2:]),
                        white=white_player,
                        black=black_player,
                        result=details['result'],
                        modified_by=user
                    )
                    updated_games_report.append(f"Updated game for board {board}")

            # Final response
            response_data = {
                'status': 'success',
                'message': 'Games processed successfully',
                'added_games': added_games_report,
                'deactivated_games': deactivated_games_report,
                'updated_games': updated_games_report
            }

            players = []

            with transaction.atomic():
                for game, details in games_with_results.items():

                    if details[0] in Player.objects.filter(is_active=True, is_volunteer=True).all(): # Volunteer on White
                        Player.update_rating(details[1], details[1].rating, details[0], user)

                    elif details[1] in Player.objects.filter(is_active=True, is_volunteer=True).all(): # Volunteer on Black
                        Player.update_rating(details[0], details[0].rating, details[1], user)
                    else:
                        if details[2] == 'White':
                            w_rating = RATINGS_HELPER(details[0].rating, 1,
                                                      CALC_EXPECTED(details[0].rating, details[1].rating))
                            b_rating = RATINGS_HELPER(details[1].rating, 0,
                                                      CALC_EXPECTED(details[1].rating, details[0].rating))
                        elif details[2] == 'Draw':
                            w_rating = RATINGS_HELPER(details[0].rating, .5,
                                                      CALC_EXPECTED(details[0].rating, details[1].rating))
                            b_rating = RATINGS_HELPER(details[1].rating, .5,
                                                      CALC_EXPECTED(details[1].rating, details[0].rating))
                        else:
                            w_rating = RATINGS_HELPER(details[0].rating, 0,
                                                      CALC_EXPECTED(details[0].rating, details[1].rating))
                            b_rating = RATINGS_HELPER(details[1].rating, 1,
                                                      CALC_EXPECTED(details[1].rating, details[0].rating))
                        # Add player's new rating
                        Player.update_rating(details[0], w_rating, details[1], user)
                        Player.update_rating(details[1], b_rating, details[0], user)

                    players.append(f"{details[0].last_name}, {details[0].first_name}")
                    players.append(f"{details[1].last_name}, {details[1].first_name}")

            response_data['ratings'] = players

            return JsonResponse(response_data, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)


def download_existing_ratings_sheet(request):
    file_name = request.GET.get('file')
    if file_name:
        file_path = os.path.join(CREATED_RATING_FILES_DIR, file_name)
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{file_name}"'
                return response
        else:
            raise Http404("File does not exist")
    return redirect('input_results')


def download_ratings(request):
    file_path = write_ratings()

    with open(file_path, 'rb') as excel_file:
        response = HttpResponse(excel_file.read(),
                                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response


def download_player_data(request):
    file_path = export_player_data()

    with open(file_path, 'rb') as excel_file:
        response = HttpResponse(excel_file.read(),
                                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response


# View and Functions relating to the pair page
def pair_view(request):
    form = PairingDateForm()
    context = {
        'form': form,
        "email": settings.MY_EMAIL,
        "phone": settings.MY_PHONE_NUMBER,
    }
    return render(request, 'chess/pair.html', context)


def new_pairings(request):
    if request.method == 'POST':
        try:
            unicode = request.body.decode('utf-8')
            data = json.loads(unicode)

            game_date = data.get('game_date')
            games = data.get('games')

            used_boards = []
            pairings = []
            paired_players = set()

            user = request.user

            # Manually created games
            with transaction.atomic():
                for game in games:
                    board = game.get('board')
                    white_player_name = game.get('whitePlayer')
                    black_player_name = game.get('blackPlayer')

                    white_player = Player.objects.filter(first_name=white_player_name.split(', ')[1],
                                                         last_name=white_player_name.split(', ')[0],
                                                         is_active=True).first()
                    black_player = Player.objects.filter(first_name=black_player_name.split(', ')[1],
                                                         last_name=black_player_name.split(', ')[0],
                                                         is_active=True).first()

                    used_boards.append(board)
                    paired_players.add(white_player)
                    paired_players.add(black_player)

                    Game.add_game(
                        date_of_match=game_date,
                        board_letter=board[0],
                        board_number=int(board[2:]),
                        white=white_player,
                        black=black_player,
                        result='',
                        modified_by=user
                    )

            message = "All manual pairings were successfully created."
            unused_boards = [board for board in BOARDS if board not in used_boards]
            unpaired_players = list(Player.objects.filter(is_active=True, is_volunteer=False).exclude(
                id__in=[player.id for player in paired_players]).order_by('-rating', '-grade', 'last_name',
                                                                          'first_name'))

            # Computer's paired games
            pairings = pair(unpaired_players, pairings)

            with transaction.atomic():
                for i, pairing in enumerate(pairings):
                    board = unused_boards[i]
                    white_player_name, black_player_name = pairing.split(':')

                    if white_player_name:
                        white_player = Player.objects.filter(first_name=white_player_name.split(', ')[1],
                                                         last_name=white_player_name.split(', ')[0],
                                                         is_active=True).first()
                    else:
                        white_player = None

                    if black_player_name:
                        black_player = Player.objects.filter(first_name=black_player_name.split(', ')[1],
                                                             last_name=black_player_name.split(', ')[0],
                                                             is_active=True).first()
                    else:
                        black_player = None

                    Game.add_game(
                        date_of_match=game_date,
                        board_letter=board[0],
                        board_number=int(board[2:]),
                        white=white_player,
                        black=black_player,
                        result='',
                        modified_by=user
                    )

            return JsonResponse({'status': 'success', 'message': message}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)


def pair(unpaired_players, pairings):
    if not unpaired_players:
        return pairings
    elif len(unpaired_players) == 1:
        pairings.append(unpaired_players[0].name() + ':')
        return pairings

    found_opponent = False
    player = unpaired_players[0]
    opponent_list = [player.opponent_one, player.opponent_two, player.opponent_three]

    for i in range(1, len(unpaired_players)):
        if unpaired_players[i] not in opponent_list and abs(unpaired_players[i].rating - player.rating) < 21:
            pairings.append(get_pair_placement(player, unpaired_players[i]))
            unpaired_players.remove(unpaired_players[i])
            unpaired_players.remove(player)
            found_opponent = True
            break

    if found_opponent is False:
        pairings.append(player.name() + ':')
        unpaired_players.remove(player)

    return pair(unpaired_players, pairings)


def get_pair_placement(player, opponent):
    if get_player_placement(player) == get_player_placement(opponent):
        if player.rating < opponent.rating:
            return "" + player.name() + ":" + opponent.name()
        else:
            return opponent.name() + ":" + player.name()
    else:
        if get_player_placement(player) == "white":
            return player.name() + ":" + opponent.name()
        else:
            return opponent.name() + ":" + player.name()


def get_player_placement(player):
    last_game = Game.objects.filter(
        (Q(white=player)) |
        (Q(black=player))
    ).order_by('-date_of_match').first()

    if last_game:
        if last_game.white == player:
            return "black"
        else:
            return "white"
    else:
        return "white"


def download_pairings(request):
    if request.method == 'POST':
        form = PairingDateForm(request.POST)
        if form.is_valid():
            date_of_match = form.cleaned_data['date']

            try:
                file_path = write_pairings(date_of_match)
                file_name = f'Pairings_{date_of_match}.xlsx'

                with open(file_path, 'rb') as f:
                    response = HttpResponse(
                        f.read(),
                        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    )
                    response['Content-Disposition'] = f'attachment; filename={file_name}'
                    return response
            except FileNotFoundError:
                raise Http404("File not found")
            except Exception as e:
                raise Http404("An error occurred while creating the pairing file.")
    else:
        form = PairingDateForm()

    return render(request, 'chess/pair.html', {'form': form})