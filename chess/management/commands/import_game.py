import csv
import re

from django.core.management.base import BaseCommand
from chess.models import Player, Game
from django.contrib.auth.models import User
from django.utils import timezone

''' This file contains the custom function for importing game data via csv files to establish the database '''
class Command(BaseCommand):
    help = 'Import all games from CSV file and the date: games date'

    def add_arguments(self, parser):
        parser.add_argument('game_csv', type=str, help='The path to the Game CSV file')
        parser.add_argument('date_of_match', type=str, help='When were the games scheduled')

    def handle(self, *args, **kwargs):
        game_csv = kwargs['game_csv']
        date_of_match = kwargs['date_of_match']

        self.game_import(game_csv, date_of_match)

    # Imports games, must be run AFTER player_import since games reference Players
    def game_import(self, csv_file_path, date):
        self.stdout.write('Starting game import...')
        with open(csv_file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=',')

            pattern = re.compile(r'([A-Z])-([0-9]+)')

            for row in reader:
                match = pattern.match(row['Board#'])
                if match:
                    board_letter = match.group(1)
                    board_number = int(match.group(2))

                white = None
                if row['White']:
                    try:
                        last_name_white, first_name_white = row['White'].split(', ')
                        white = Player.objects.get(last_name=last_name_white, first_name=first_name_white)
                    except Player.DoesNotExist:
                        self.stdout.write(f"White player '{row['White']}' not found.")

                black = None
                if row['Black']:
                    try:
                        last_name_black, first_name_black = row['Black'].split(', ')
                        black = Player.objects.get(last_name=last_name_black, first_name=first_name_black)
                    except Player.DoesNotExist:
                        self.stdout.write(f"Black player '{row['Black']}' not found.")

                result = row.get('Results')
                if result is None or result.lower() in ['', 'NULL', 'None']:
                    result = ''

                game, created = Game.objects.get_or_create(
                    date_of_match=date,
                    white=white,
                    black=black,
                    board_number=board_number,
                    board_letter=board_letter,
                    defaults={
                        'result': result,
                        'modified_by': User.objects.get(username='m'),
                        'is_active': True,
                    }
                )

                if created:
                    self.stdout.write(f'Created game: {game}')
                    game.created_at = timezone.now()
                    game.save()

                    if result in ['White', 'Black', 'Draw']:
                        if white:
                            white.opponent_three = white.opponent_two
                            white.opponent_two = white.opponent_one
                            white.opponent_one = black
                            white.save()

                        if black:
                            black.opponent_three = black.opponent_two
                            black.opponent_two = black.opponent_one
                            black.opponent_one = white
                            black.save()
                else:
                    self.stdout.write(f'Game already exists: {game}')
        self.stdout.write('Game import completed.')
