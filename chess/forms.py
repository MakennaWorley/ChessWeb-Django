from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import AuthenticationForm

from .models import RegisteredUser, Player, Game, LessonClass


class LoginForm(AuthenticationForm):
    username = forms.CharField(max_length=254, widget=forms.TextInput(attrs={'autofocus': True}))
    password = forms.CharField(label=("Password"), widget=forms.PasswordInput)


class SignUpForm(forms.ModelForm):
    first_name = forms.CharField(label='First Name', max_length=100, required=True)
    last_name = forms.CharField(label='Last Name', max_length=100, required=True)
    username = forms.CharField(max_length=100, required=True)
    email = forms.EmailField(required=True)
    password1 = forms.CharField(widget=forms.PasswordInput(), label="Password")
    password2 = forms.CharField(widget=forms.PasswordInput(), label="Confirm Password")

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])

        # Save the user to create an instance in the database
        if commit:
            user.save()

        registered_user, created = RegisteredUser.objects.get_or_create(user=user)

        registered_user.save()
        return user


RESULTS = [
    ('', ''),
    ('White', 'White'),
    ('Black', 'Black'),
    ('Draw', 'Draw'),
]

class GameSaveForm(forms.Form):
    board = forms.CharField(max_length=100)
    white_player = forms.ModelChoiceField(queryset=Player.objects.filter(is_active=True),
                                          widget=forms.Select,
                                          label="White Player")
    result = forms.ChoiceField(choices=RESULTS, widget=forms.Select)
    black_player = forms.ModelChoiceField(
                                          queryset=Player.objects.filter(is_active=True),
                                          widget=forms.Select,
                                          label="Black Player")


class PairingDateForm(forms.Form):
    date = forms.ChoiceField(choices=[], widget=forms.Select())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        game_dates = Game.objects.values_list('date_of_match', flat=True).distinct().order_by('-date_of_match')
        self.fields['date'].choices = [(date, date) for date in game_dates]


SEARCH_CHOICES = [
    ('Player', 'Player'),
    ('Board', 'Board'),
    ('Class', 'Class')
]

class SearchForm(forms.Form):
    search_board = forms.ChoiceField(
        choices=SEARCH_CHOICES,
        widget=forms.RadioSelect(),
        initial='Player',
        required=True,
        label='Searching for:')
    query = forms.CharField(
        label='Keyword:',
        max_length=100,
        required=True,
    )


class PlayerForm(forms.ModelForm):
    class Meta:
        model = Player
        fields = [
            "last_name", "first_name", "rating", "grade", "lesson_class",
            "active_member", "is_volunteer", "parent_or_guardian", "email",
            "phone", "additional_info"
        ]


class GameForm(forms.ModelForm):
    class Meta:
        model = Game
        fields = [
            "date_of_match", "board_letter", "board_number", "white",
            "black", "result"
        ]


class LessonClassForm(forms.ModelForm):
    class Meta:
        model = LessonClass
        fields = ["name", "teacher", "co_teacher"]


class AdminActionForm(forms.Form):
    ACTION_CHOICES = [
        ('add', 'Add'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    MODEL_CHOICES = [
        ('player', 'Player'),
        ('game', 'Game'),
        ('class', 'LessonClass'),
    ]

    action = forms.ChoiceField(choices=ACTION_CHOICES, widget=forms.RadioSelect)
    model = forms.ChoiceField(choices=MODEL_CHOICES, widget=forms.RadioSelect)
    target_id = forms.IntegerField(required=False, help_text="ID (required for update/delete)")

    # Dynamic model forms
    player_data = forms.ModelChoiceField(queryset=Player.objects.all(), required=False)
    game_data = forms.ModelChoiceField(queryset=Game.objects.all(), required=False)
    class_data = forms.ModelChoiceField(queryset=LessonClass.objects.all(), required=False)
