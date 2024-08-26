# Generated by Django 5.0.4 on 2024-08-26 01:26

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Club',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('code', models.CharField(max_length=15, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('current_rating', models.IntegerField()),
                ('previous_rating', models.IntegerField()),
                ('grade', models.IntegerField(default=0)),
                ('parent_name', models.CharField(max_length=100)),
                ('parent_email', models.EmailField(max_length=200)),
                ('club', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to='chess.club')),
                ('opponent_one', models.ForeignKey(blank=True, on_delete=django.db.models.deletion.RESTRICT, related_name='last_time_opponent', to='chess.player')),
                ('opponent_three', models.ForeignKey(blank=True, on_delete=django.db.models.deletion.RESTRICT, related_name='three_times_ago_opponent', to='chess.player')),
                ('opponent_two', models.ForeignKey(blank=True, on_delete=django.db.models.deletion.RESTRICT, related_name='two_times_ago_opponent', to='chess.player')),
            ],
        ),
        migrations.CreateModel(
            name='LessonClass',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('level', models.CharField(max_length=100)),
                ('club', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to='chess.club')),
                ('co_teacher', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='co_teacher', to='chess.player')),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teacher', to='chess.player')),
            ],
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_number', models.IntegerField()),
                ('date_of_match', models.DateField()),
                ('board_letter', models.CharField(max_length=1)),
                ('board_number', models.IntegerField()),
                ('result', models.CharField(choices=[('W', 'White'), ('B', 'Black'), ('D', 'Draw')], default='D', max_length=1)),
                ('club', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to='chess.club')),
                ('black', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, related_name='games_as_black', to='chess.player')),
                ('white', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, related_name='games_as_white', to='chess.player')),
            ],
        ),
        migrations.CreateModel(
            name='RegisteredUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_director', models.BooleanField(default=False)),
                ('club', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.RESTRICT, to='chess.club')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
