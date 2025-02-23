# models.py

from django.contrib.auth.models import AbstractBaseUser  # Base class for custom user models
from django.db import models  # Module to define database models
# from django.contrib.auth import get_user_model
from django.utils import timezone

class UserManager(models.Manager):
    """
    Custom manager for the User model, handling user creation and retrieval.

    Provides utility methods:
    - `create_user`: Creates a new user with a hashed password.
    - `get_by_natural_key`: Retrieves a user by their natural key (email in this case).
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        Creates and saves a new user with the given email and password.

        Args:
            email (str): The email address of the user (required).
            password (str): The plaintext password for the user (optional).
            extra_fields (dict): Additional fields for the user (e.g., name, user type).

        Raises:
            ValueError: If no email is provided.

        Returns:
            User: The newly created user instance.
        """
        if not email:
            raise ValueError('Email is required')  # Ensure email is provided
        user = self.model(email=email, **extra_fields)  # Create user instance with extra fields
        user.set_password(password)  # Hash and set the password
        user.save()  # Save the user instance to the database
        return user

    def get_by_natural_key(self, email):
        """
        Retrieves a user by their natural key (email).

        Args:
            email (str): The email of the user to be retrieved.

        Returns:
            User: The user instance corresponding to the given email.
        """
        return self.get(email=email)


class User(AbstractBaseUser):
    """
    Custom User model for handling authentication and user data.

    Attributes:
    - `email`: Unique identifier for authentication.
    - `first_name` and `last_name`: Basic user information.
    - `user_type`: Indicates if the user is a 'student' or a 'lecturer'.
    - `department`: The department the user belongs to.
    - `matric_number`: Unique identifier for students (optional for lecturers).
    - `USERNAME_FIELD`: Specifies the email as the field used for authentication.
    - `REQUIRED_FIELDS`: Additional fields required when creating a user.
    - `objects`: Custom manager for the User model (UserManager).
    """

    email = models.EmailField(unique=True)  # Unique email for each user
    first_name = models.CharField(max_length=100)  # First name of the user
    last_name = models.CharField(max_length=100)  # Last name of the user

    USER_TYPE_CHOICES = (  # Options for user type
        ('student', 'Student'),
        ('lecturer', 'Lecturer')
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)  # User type field
    department = models.CharField(max_length=100)  # Department of the user
    matric_number = models.CharField(
        max_length=7, unique=True, blank=True, null=True
    )  # Matriculation number (unique for students, optional for lecturers)

    USERNAME_FIELD = 'email'  # Field used for authentication
    REQUIRED_FIELDS = ['first_name', 'last_name', 'user_type', 'department']  # Mandatory fields when creating a user

    objects = UserManager()  # Use the custom manager for User model

    """
    Inherits from `AbstractBaseUser` to provide:
    - Password hashing and authentication methods.
    - Customizable username and email handling.
    """

class Classroom(models.Model):
    code = models.CharField(max_length=6, unique=True)
    title = models.CharField(max_length=100)
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'lecturer'})
    created_at = models.DateTimeField(auto_now_add=True)


class ClassroomMembership(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'})
    joined_at = models.DateTimeField(auto_now_add=True)


class Assignment(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()
    plagiarism_threshold = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def lecturer(self):
        return self.classroom.lecturer

    def __str__(self):
        return f"{self.title} - {self.classroom}"
    


class AssignmentSubmission(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    file = models.FileField(upload_to='submissions/')
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='submitted')  # For tracking submission status

    class Meta:
        unique_together = ['student', 'assignment']  # Prevent multiple submissions

    def __str__(self):
        return f"{self.student.email} - {self.assignment.title}"
    

class ProcessedDocument(models.Model):
    submission = models.OneToOneField(AssignmentSubmission, on_delete=models.CASCADE)
    processed_text = models.TextField()
    fingerprints = models.JSONField()
    processed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='processing')

    def __str__(self):
        return f"Processed document for {self.submission}"
    

class PlagiarismResult(models.Model):
    submission1 = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name='source_results')
    submission2 = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name='compared_results')
    similarity_score = models.FloatField()
    matching_segments = models.JSONField()  # Store matching text portions with positions
    compared_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comparison between {self.submission1.student} and {self.submission2.student}"