#!/usr/bin/env bash

python3 manage.py makemigrations chess
python3 manage.py migrate
python3 manage.py createsuperuser

python3 manage.py import_data files/volunteers2024.csv files/classes2024.csv files/players2024.csv

python3 manage.py import_game files/pairings9-26-2024.csv 2024-09-26
python3 manage.py import_game files/pairings10-3-2024.csv 2024-10-03
python3 manage.py import_game files/pairings10-17-2024.csv 2024-10-17
python3 manage.py import_game files/pairings10-24-2024.csv 2024-10-24