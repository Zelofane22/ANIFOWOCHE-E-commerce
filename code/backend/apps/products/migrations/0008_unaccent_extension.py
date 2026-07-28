from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0007_optiongroup_option"),
    ]

    operations = [
        UnaccentExtension(),
    ]
