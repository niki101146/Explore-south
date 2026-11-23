import django_filters
from django.db.models import Q

from .models import Destination


class DestinationFilter(django_filters.FilterSet):
    state = django_filters.CharFilter(field_name="city__state__slug", lookup_expr="iexact")
    city = django_filters.NumberFilter(field_name="city_id")
    category = django_filters.CharFilter(method="filter_category")
    season = django_filters.CharFilter(method="filter_season")
    min_budget = django_filters.NumberFilter(field_name="avg_daily_budget", lookup_expr="gte")
    max_budget = django_filters.NumberFilter(field_name="avg_daily_budget", lookup_expr="lte")
    featured = django_filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Destination
        fields = []

    def filter_category(self, queryset, name, value):
        # Subquery avoids duplicating rows (and skewing rating averages) through the M2M join.
        ids = Destination.objects.filter(categories__slug=value).values("pk")
        return queryset.filter(pk__in=ids)

    def filter_season(self, queryset, name, value):
        return queryset.filter(
            Q(best_season=value) | Q(best_season=Destination.Season.ALL_YEAR)
        )
