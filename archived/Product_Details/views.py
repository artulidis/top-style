from django.shortcuts import render
from Store import models

# Create your views here.


def index(request, product_slug):

    product = models.Product.objects.get(slug=product_slug)
    
    context = {
        "product": product
    }

    return render(request, "Product_Details/Product_Details.html", context)