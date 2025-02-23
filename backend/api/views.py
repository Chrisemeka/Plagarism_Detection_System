from django.shortcuts import render
from django.utils import timezone
from rest_framework import generics, permissions
from.serializers import UserSerializer
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied
from .models import Classroom, ClassroomMembership, Assignment, AssignmentSubmission, ProcessedDocument
from .utils import DocumentProcessor, ProcessingError, PlagiarismChecker
from .permission import IsLecturerPermission
from .serializers import UserSerializer, ClassroomSerializer, ClassroomMembershipSerializer, JoinClassSerializer, AssignmentSerializer, AssignmentSubmissionSerializer, ClassroomMembershipSerializer

class UserRegistrationView(generics.CreateAPIView):
   """
   API view handling user registration for both students and lecturers.
   Creates user accounts with appropriate role and profile information.
   """
   serializer_class = UserSerializer
   permission_classes = [AllowAny]  # Allows unauthenticated registration

   def perform_create(self, serializer):
       """
       Creates new user instance after validation.
       Args:
           serializer: Validated UserSerializer instance
       """
       serializer.save()

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

class CreateClassroomView(generics.CreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(lecturer=self.request.user)

class JoinClassroomView(generics.CreateAPIView):
    # Uses CreateAPIView for handling POST requests to join a class
    serializer_class = JoinClassSerializer  # Uses our custom serializer
    permission_classes = [IsAuthenticated]  # Only logged-in users can access

    def get_serializer_context(self):
        # This method provides additional context to the serializer
        # We need this because our serializer needs access to the current user
        context = super().get_serializer_context()
        return context

    def post(self, request, *args, **kwargs):
        # Handles POST request to join class
        # First checks if user is a student
        if request.user.user_type != 'student':
            return Response(
                {"error": "Only students can join classes"},
                status=status.HTTP_403_FORBIDDEN
            )
        # If user is student, proceeds with normal create process
        return super().post(request, *args, **kwargs)

class ListClassroomsView(generics.ListAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'lecturer':
            return Classroom.objects.filter(lecturer=user)
        return Classroom.objects.filter(classroommembership__student=user)

class ListClassroomMembershipsView(generics.ListAPIView):
    """
    View for listing classroom memberships.
    GET: List all members of a specific classroom
    """
    serializer_class = ClassroomMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_code = self.kwargs.get('class_code')
        user = self.request.user

        if user.user_type == 'lecturer':
            # If lecturer, ensure they own the classroom before showing members
            return ClassroomMembership.objects.filter(
                classroom__code=classroom_code,
                classroom__lecturer=user
            )
        # If student, only show members if they're also a member
        return ClassroomMembership.objects.filter(
            classroom__code=classroom_code,
            classroom__classroommembership__student=user
        )
    
class CreateAssignmentView(generics.CreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsLecturerPermission]

    def perform_create(self, serializer):
        if self.request.user.user_type != 'lecturer':
            raise PermissionDenied("Only lecturers can create assignments")
        serializer.save()

class ListAssignmentsView(generics.ListAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        class_code = self.kwargs['class_code']  # Get class code from URL

        if user.user_type == 'lecturer':
            # Lecturers see assignments for their specific classroom
            return Assignment.objects.filter(
                classroom__lecturer=user,
                classroom__code=class_code
            )
        else:
            # Students see assignments from their enrolled specific class
            return Assignment.objects.filter(
                classroom__classroommembership__student=user,
                classroom__code=class_code
            )


class SubmitAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, assignment_id):
        try:
            # Get the assignment
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Check if user is the lecturer of this class
            if request.user != assignment.classroom.lecturer:
                return Response(
                    {"error": "You are not the lecturer of this class"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Get all submissions for this assignment
            submissions = AssignmentSubmission.objects.filter(
                assignment=assignment
            ).order_by('-submitted_at')

            # Serialize the submissions using your existing serializer
            serializer = AssignmentSubmissionSerializer(submissions, many=True)
            
            return Response(serializer.data)

        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request, assignment_id):
        try:
            # Get the assignment
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Validate submission
            if assignment.deadline < timezone.now():
                return Response(
                    {"error": "Submission deadline has passed"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if student is enrolled
            if not ClassroomMembership.objects.filter(
                student=request.user,
                classroom=assignment.classroom
            ).exists():
                return Response(
                    {"error": "You are not enrolled in this class"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create or update submission
            submission, created = AssignmentSubmission.objects.get_or_create(
                student=request.user,
                assignment=assignment,
                defaults={'file': request.FILES['file']}
            )

            if not created:
                submission.file = request.FILES['file']
                submission.status = 'submitted'
                submission.save()

            # Process document
            try:
                processor = DocumentProcessor()
                processor.process_submission(submission)
            except ProcessingError as e:
                return Response({
                    "message": "Submission saved but processing failed",
                    "error": str(e)
                }, status=status.HTTP_202_ACCEPTED)

            return Response({
                "message": "Submission processed successfully",
                "submission_id": submission.id
            }, status=status.HTTP_201_CREATED)

        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PlagiarismReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.get(id=assignment_id)

            # Check if user is lecturer of this class
            if not assignment.classroom.lecturer == request.user:
                return Response(
                    {"error": "Unauthorized access"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if deadline has passed
            if timezone.now() < assignment.deadline:
                return Response(
                    {"error": "Cannot check plagiarism before deadline"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get all submissions
            submissions = AssignmentSubmission.objects.filter(
                assignment=assignment
            )

            checker = PlagiarismChecker()
            comparison_results = []

            # Compare submissions without threshold filter
            for idx, submission1 in enumerate(submissions):
                for submission2 in submissions[idx + 1:]:
                    result = checker.compare_submissions(submission1, submission2)
                    # Remove threshold check, append all results
                    comparison_results.append({
                        'student1': f"{submission1.student.first_name} {submission1.student.last_name}",
                        'student2': f"{submission2.student.first_name} {submission2.student.last_name}",
                        'similarity_score': round(result['similarity_score'], 2),  # Round to 2 decimal places
                        'matching_segments': result['matching_segments']
                    })

            report = {
                'assignment_title': assignment.title,
                'total_submissions': submissions.count(),
                'deadline': assignment.deadline,
                'comparisons': comparison_results,
                'check_date': timezone.now()
            }

            return Response(report)

        except Assignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
