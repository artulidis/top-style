# Generated by Django 3.2.6 on 2022-03-19 15:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Store', '0010_alter_product_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='Brand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('brand_name', models.CharField(blank=True, max_length=100)),
            ],
        ),
    ]
