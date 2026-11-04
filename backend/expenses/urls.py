from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import BudgetCalculatorView, TravelExpenseViewSet

router = SimpleRouter()
router.register("expenses", TravelExpenseViewSet, basename="expense")

urlpatterns = [
    path("budget/calculate/", BudgetCalculatorView.as_view(), name="budget-calculate"),
] + router.urls
