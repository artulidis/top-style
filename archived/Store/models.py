from django.db import models

# Create your models here.


class Brand(models.Model):
    brand_name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'{self.brand_name}'


class Product(models.Model):
    name = models.CharField(max_length=200, blank=True)
    slug = models.CharField(max_length=200, blank=True)
    picture = models.ImageField(upload_to='images', blank=True)
    price = models.DecimalField(max_digits=5, decimal_places=2, blank=True)
    recommended = models.BooleanField(default=False, blank=True)
    topShelf = models.BooleanField(default=False, blank=True)
    bottomShelf = models.BooleanField(default=False, blank=True)
    brand = models.ForeignKey(Brand, default=None, on_delete=models.PROTECT)

    def __str__(self):
        return f'{self.name} - Recommended: {self.recommended} - Top Shelf: {self.topShelf}'