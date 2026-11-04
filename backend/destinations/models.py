from django.db import models
from django.utils.text import slugify


class State(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to="states/", blank=True, null=True,
        help_text="Photo shown on the home page's Explore by state cards.",
    )

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class City(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "cities"
        constraints = [
            models.UniqueConstraint(fields=["state", "name"], name="unique_city_per_state")
        ]

    def __str__(self):
        return f"{self.name}, {self.state.name}"


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Destination(models.Model):
    class Season(models.TextChoices):
        ALL_YEAR = "all_year", "All year"
        SUMMER = "summer", "Summer (Mar-Jun)"
        MONSOON = "monsoon", "Monsoon (Jul-Sep)"
        WINTER = "winter", "Winter (Oct-Feb)"

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    city = models.ForeignKey(City, on_delete=models.PROTECT, related_name="destinations")
    categories = models.ManyToManyField(Category, related_name="destinations", blank=True)
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    cover_image = models.ImageField(upload_to="destinations/covers/", blank=True, null=True)
    best_season = models.CharField(
        max_length=20, choices=Season.choices, default=Season.ALL_YEAR
    )
    best_time_to_visit = models.CharField(max_length=150, blank=True)
    avg_daily_budget = models.PositiveIntegerField(
        default=0, help_text="Approximate spend per person per day, in INR."
    )
    how_to_reach = models.TextField(blank=True)
    travel_tips = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    last_verified = models.DateField(
        null=True, blank=True,
        help_text="Date an admin last checked fees, timings and contact details.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug, n = base, 2
            while Destination.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class DestinationImage(models.Model):
    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="destinations/gallery/")
    caption = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Image of {self.destination.name}"


class Banner(models.Model):
    """A banner photo for a page, uploaded by an admin.

    The home page can have several (they slide); every other page uses the first one.
    """

    class Page(models.TextChoices):
        HOME = "home", "Home"
        EXPLORE = "explore", "Explore"
        SEASON = "season", "Best time"
        BUDGET = "budget", "Budget"
        AI_PLANNER = "ai_planner", "AI Planner"
        ABOUT = "about", "About us"
        CONTACT = "contact", "Contact us"
        TRIPS = "trips", "Trips, plan and saved pages"

    page = models.CharField(max_length=20, choices=Page.choices)
    image = models.ImageField(upload_to="banners/")
    caption = models.CharField(max_length=120, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["page", "order", "id"]

    def __str__(self):
        return f"{self.get_page_display()} banner #{self.pk}"
