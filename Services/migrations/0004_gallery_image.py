# Generated by Django 3.2.6 on 2021-11-14 19:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Services', '0003_auto_20211112_1538'),
    ]

    operations = [
        migrations.CreateModel(
            name='Gallery_Image',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('Cutting', 'Cutting'), ('Coloring', 'Coloring'), ('Bridal', 'Bridal'), ('Extra', 'Extra')], default='Cutting', max_length=10)),
                ('image', models.ImageField(blank=True, upload_to='images')),
            ],
        ),
    ]