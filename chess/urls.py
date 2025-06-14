from django.urls import path
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required

from .views import (login_view, signup_view,
                    home_view,
                    get_players, add_player, update_player, delete_player,
                    get_games, add_game, update_game, delete_game,
                    add_class, update_class, delete_class,
                    get_ratings_sheet, export_player_data,
                    input_results_view, save_games, download_ratings, download_existing_ratings_sheet,
                    download_player_data,
                    pair_view, new_pairings, download_pairings,
                    manual_view, get_object_data)

urlpatterns = [
    path('', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    path('home/', login_required(home_view), name='home'),

    # --- API urls protected ---
    path('api/get_players', login_required(get_players), name='get_players'),
    path('api/player/add/', login_required(add_player), name='add_player'),
    path('api/player/update/<int:player_id>/', login_required(update_player), name='update_player'),
    path('api/player/delete/<int:player_id>/', login_required(delete_player), name='delete_player'),
    path('api/get_games', login_required(get_games), name='get_games'),
    path('api/game/add/', login_required(add_game), name='add_game'),
    path('api/game/update/<int:game_id>/', login_required(update_game), name='update_game'),
    path('api/game/delete/<int:game_id>/', login_required(delete_game), name='delete_game'),
    path('api/class/add/', login_required(add_class), name='add_class'),
    path('api/class/update/<int:class_id>/', login_required(update_class), name='update_class'),
    path('api/class/delete/<int:class_id>/', login_required(delete_class), name='delete_class'),
    path('api/get_ratings_sheet', login_required(get_ratings_sheet), name='get_ratings_sheet'),
    path('api/export_player_data', login_required(export_player_data), name='export_player_data'),
    path('api/get-object-data/', login_required(get_object_data), name='get_object_data'),

    # --- Pages protected ---
    path('input_results/', login_required(input_results_view), name='input_results'),
    path('save_games/', login_required(save_games), name='save_games'),
    path('download_ratings/', login_required(download_ratings), name='download_ratings'),
    path('download_existing_ratings_sheet/', login_required(download_existing_ratings_sheet),
         name='download_existing_ratings_sheet'),
    path('download_player_data', login_required(download_player_data), name='download_player_data'),

    path('pair/', login_required(pair_view), name='pair'),
    path('new_pairings/', login_required(new_pairings), name='new_pairings'),
    path('download_pairings/', login_required(download_pairings), name='download_pairings'),

    # --- Password reset pages ---
    path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

    path('manual/', login_required(manual_view), name='manual'),
]
