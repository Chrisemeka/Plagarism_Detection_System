from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from api.views import UserRegistrationView, CreateClassroomView, JoinClassroomView, ListClassroomsView, CreateAssignmentView, ListAssignmentsView, UserProfileView, SubmitAssignmentView, ListClassroomMembershipsView, PlagiarismReportView, CustomTokenObtainPairView, DocumentComparisonView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/user/register/", UserRegistrationView.as_view(), name="register"), #the path to the view for creating a user
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'), #the path to the view for getting a token
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh_token"), #the path to the view for refreshing a token
    path("api/class/create/", CreateClassroomView.as_view(), name="create_classroom"), #the path to the view for creating a classroom
    path("api/profile/", UserProfileView.as_view(), name="profile"), #the path to the view for creating a classroom
    path("api/class/join/", JoinClassroomView.as_view(), name="join_classroom"), #the path to the view for joining a classroom
    path("api/class/classroom_list/", ListClassroomsView.as_view(), name="list_of_classroom"), #the path to the view for listing the classrooms
    path("api/assignment/create/", CreateAssignmentView.as_view(), name="create_assignment"), #the path to the view for listing the classrooms
    path('api/class/<str:class_code>/members/', ListClassroomMembershipsView.as_view(), name='classroom-members'),
    path("api/class/<str:class_code>/assignments/", ListAssignmentsView.as_view(), name="list_of_assignment"), #the path to the view for listing the classrooms
    path('api/assignments/<int:assignment_id>/submit/', SubmitAssignmentView.as_view(), name='submit_assignment'),
    path('api/assignments/<int:assignment_id>/plagiarism-report/', PlagiarismReportView.as_view(), name='plagiarism_report'),
    path('api/assignments/<int:assignment_id>/document-comparison/', DocumentComparisonView.as_view(), name='document_comparison'),
    path("api-auth/", include("rest_framework.urls")), #the path to the rest framework urls
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
