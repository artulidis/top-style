from django.shortcuts import render
from . import models
from django.core.mail import send_mail

# Create your views here.


def index(request):

    mediaPhotoGallery = models.Media_Gallery_Pic.objects.all()

    context = {
        "photoGallery": [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 9, 6, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 9, 6],
        "mediaPhotoGallery": mediaPhotoGallery
    }

    if request.method == "POST":
        name = request.POST.get('name'),
        email = request.POST.get('email'),
        message = request.POST.get('message')

        form_data = {
            'name': name,
            'email': email,
            'message': message,
        }
        
        message = 'You have a new message from {} {} saying: {}'.format(form_data['name'], form_data['email'], form_data['message'])
        send_mail('TopStyle Feedback', message, '', ['artulidis@gmail.com'])

    return render(request, 'Home/Home.html', context)