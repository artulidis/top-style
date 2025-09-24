from django.db import models

# Create your models here.

class Media_Gallery_Pic(models.Model):
    picture = models.ImageField(upload_to='images', blank=True)

    def __str__(self):
        return f'{self.picture}'