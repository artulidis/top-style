from django.shortcuts import render
from .models import Service
from .models import Gallery_Image

# Create your views here.


def index(response):

    # Service Items
    services = Service.objects.all()
    cutting_services = services.filter(category="Cutting")
    coloring_services = services.filter(category="Coloring")
    bridal_services = services.filter(category="Bridal")
    extra_services = services.filter(category="Extra")

    # Service Images
    service_images = Gallery_Image.objects.all()
    cutting_images = service_images.filter(category="Cutting")
    coloring_images = service_images.filter(category="Coloring")
    bridal_images = service_images.filter(category="Bridal")
    extra_images = service_images.filter(category="Extra")

    # Duplicate Images
    cutting_duplicates = cutting_images.filter(is_duplicate="Yes")
    coloring_duplicates = coloring_images.filter(is_duplicate="Yes")
    bridal_duplicates = bridal_images.filter(is_duplicate="Yes")
    extra_duplicates = extra_images.filter(is_duplicate="Yes")

    context = {
        "cutting_services": cutting_services,
        "cutting_images": cutting_images,
        "cutting_duplicates": cutting_duplicates,

        "coloring_services": coloring_services,
        "coloring_images": coloring_images,
        "coloring_duplicates": coloring_duplicates,

        "bridal_services": bridal_services,
        "bridal_images": bridal_images,
        "bridal_duplicates": bridal_duplicates,

        "extra_services": extra_services,
        "extra_images": extra_images,
        "extra_duplicates": extra_duplicates
    }

    return render(response, "Services/services.html", context)