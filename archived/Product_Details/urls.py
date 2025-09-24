from django.urls import path, include
from Product_Details.views import index

urlpatterns = [
    path('/<product_slug>', index)
]