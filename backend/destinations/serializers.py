from rest_framework import serializers

from attractions.serializers import AttractionSerializer

from config.validators import validate_image_file

from .models import Banner, Category, City, Destination, DestinationImage, State


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ("id", "name", "slug", "description", "image")
        read_only_fields = ("slug",)

    def validate_image(self, value):
        return validate_image_file(value)


class CitySerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source="state.name", read_only=True)

    class Meta:
        model = City
        fields = ("id", "name", "state", "state_name")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "image")
        read_only_fields = ("slug",)


class DestinationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationImage
        fields = ("id", "destination", "image", "caption")

    def validate_image(self, value):
        return validate_image_file(value)


class DestinationListSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source="city.name", read_only=True)
    state_name = serializers.CharField(source="city.state.name", read_only=True)
    state_slug = serializers.CharField(source="city.state.slug", read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Destination
        fields = (
            "id", "name", "slug", "city_name", "state_name", "state_slug", "categories",
            "short_description", "cover_image", "best_season", "best_time_to_visit",
            "avg_daily_budget", "latitude", "longitude", "is_featured", "is_published",
            "avg_rating", "review_count",
        )


class DestinationDetailSerializer(DestinationListSerializer):
    images = DestinationImageSerializer(many=True, read_only=True)
    attractions = AttractionSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()
    city_id = serializers.IntegerField(read_only=True)

    class Meta(DestinationListSerializer.Meta):
        fields = DestinationListSerializer.Meta.fields + (
            "description", "how_to_reach", "travel_tips", "last_verified",
            "images", "attractions", "is_favorite", "city_id",
        )

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.favorites.filter(user=request.user).exists()


class DestinationWriteSerializer(serializers.ModelSerializer):
    """Used by the admin dashboard for create / update."""

    class Meta:
        model = Destination
        fields = (
            "id", "name", "slug", "city", "categories", "short_description", "description",
            "latitude", "longitude", "cover_image", "best_season", "best_time_to_visit",
            "avg_daily_budget", "how_to_reach", "travel_tips", "is_featured",
            "is_published", "last_verified",
        )
        read_only_fields = ("slug",)

    def validate_cover_image(self, value):
        return validate_image_file(value)


class BannerSerializer(serializers.ModelSerializer):
    page_label = serializers.CharField(source="get_page_display", read_only=True)

    class Meta:
        model = Banner
        fields = ("id", "page", "page_label", "image", "caption", "order")

    def validate_image(self, value):
        return validate_image_file(value)
