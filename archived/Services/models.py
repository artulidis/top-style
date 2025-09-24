from django.db import models

# Create your models here.


class Service(models.Model):

    Categories = (
        ("Cutting", "Cutting"),
        ("Coloring", "Coloring"),
        ("Bridal", "Bridal"),
        ("Extra", "Extra")
    )

    service_name = models.CharField(max_length=100, blank=True)
    subtext = models.CharField(max_length=100, blank=True)
    number_of_prices = models.IntegerField(blank=True, default=1)

    category = models.CharField(max_length=10, choices=Categories, default='Cutting')

    price_one = models.CharField(max_length=100, blank=True)
    price_two = models.CharField(max_length=100, blank=True)
    price_three = models.CharField(max_length=100, blank=True)

    price_explanation_one = models.CharField(max_length=200, blank=True)
    price_explanation_two = models.CharField(max_length=200, blank=True)
    price_explanation_three = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f'{self.service_name}'


class Gallery_Image(models.Model):

    Categories = (
        ("Cutting", "Cutting"),
        ("Coloring", "Coloring"),
        ("Bridal", "Bridal"),
        ("Extra", "Extra")
    )

    YesNo = (
        ("Yes", "Yes"),
        ("No", "No")
    )

    category = models.CharField(max_length=10, choices=Categories, default='Cutting', blank=True)
    image = models.ImageField(upload_to='images', blank=True)
    is_duplicate = models.CharField(max_length=3, choices=YesNo, blank=True)

    def __str__(self):
        return f'{self.category} - {self.image} - {self.is_duplicate}'