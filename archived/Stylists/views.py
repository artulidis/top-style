from django.shortcuts import render
from .models import Stylist

# Create your views here.


def index(response):

    stylists = Stylist.objects.all()

    context = {
        "stylists" : stylists
    }

    return render(response, 'Stylists/Stylists.html', context)
