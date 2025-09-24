from django.db import models

# Create your models here.

class Stylist(models.Model):
    name = models.CharField(max_length=200, blank=True)
    picture = models.ImageField(upload_to='images', blank=True)
    bio = models.CharField(max_length=10000, blank=True)
    instagram = models.CharField(max_length=1000, blank=True)

    def __str__(self):
        return f'{self.name}'