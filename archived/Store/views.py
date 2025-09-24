from django.shortcuts import render
from . import models
from .forms import BrandForm

# Create your views here.


def index(request):

    all_products = models.Product.objects.all()
    topshelf = models.Product.objects.filter(recommended=True, topShelf=True)
    bottomshelf = models.Product.objects.filter(recommended=True, bottomShelf=True)

    brands = models.Brand.objects.all()

    form = BrandForm()

    if request.method == 'POST':
        form = BrandForm(request.POST)
        desired_brand = form.data.get("btn")
        if form.is_valid() and desired_brand != "View All":
            mapped_brand = models.Brand.objects.filter(brand_name=desired_brand)
            all_products = models.Product.objects.filter(brand=mapped_brand[0])
        else:
            all_products = models.Product.objects.all()

    context = {
        "all_products": all_products,
        "topshelf": topshelf,
        "bottomshelf": bottomshelf,

        "brands": brands

    }

    return render(request, "Store/Shop.html", context)