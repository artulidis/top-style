from django.urls import path, include
from Services.views import index

urlpatterns = [
    path('', index)
]