from django.urls import path
from Store.views import index

urlpatterns = [
    path('', index)
]