from django.urls import path

from .views import ChatView, SeasonPredictView, SeasonOverviewView, SeasonRecommendView, SeasonTripCheckView, TripMatchView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("season/predict/", SeasonPredictView.as_view(), name="season-predict"),
    path("season/recommend/", SeasonRecommendView.as_view(), name="season-recommend"),
    path("season/overview/", SeasonOverviewView.as_view(), name="season-overview"),
    path("season/trip-check/", SeasonTripCheckView.as_view(), name="season-trip-check"),
    path("ai/trip-match/", TripMatchView.as_view(), name="trip-match"),
]
