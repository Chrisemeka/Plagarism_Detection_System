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
    """
    Model representing a classroom or course.
    
    Attributes:
    - `code`: Unique 6-character code for students to join the classroom.
    - `title`: Name of the classroom/course.
    - `lecturer`: Foreign key to the User who created and administers the classroom (must be a lecturer).
    - `created_at`: Timestamp when the classroom was created.
    
    Relationships:
    - One lecturer can have many classrooms (one-to-many).
    - Connected to ClassroomMembership to track enrolled students.
    - Connected to Assignment model for assignments created within this classroom.
    """

    code = models.CharField(max_length=6, unique=True)
    title = models.CharField(max_length=100)
    lecturer = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'lecturer'})
    created_at = models.DateTimeField(auto_now_add=True)


class ClassroomMembership(models.Model):

    """
    Intermediate model that associates students with classrooms.
    
    This model establishes a many-to-many relationship between students and classrooms,
    recording when each student joined a specific classroom.
    
    Attributes:
    - `classroom`: Foreign key to the Classroom model.
    - `student`: Foreign key to the User model (filtered to only include students).
    - `joined_at`: Timestamp when the student joined the classroom.
    
    Relationships:
    - Each record represents one student's membership in one classroom.
    - Many students can be in many classrooms (many-to-many).
    """

    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'})
    joined_at = models.DateTimeField(auto_now_add=True)


class Assignment(models.Model):

    """
    Model representing an assignment created by a lecturer within a classroom.
    
    Attributes:
    - `classroom`: Foreign key to the Classroom model the assignment belongs to.
    - `title`: The name or title of the assignment.
    - `description`: Detailed instructions or description for the assignment (optional).
    - `deadline`: Date and time when the assignment is due.
    - `plagiarism_threshold`: Integer percentage that determines the minimum similarity 
       score to flag submissions as potentially plagiarized (default 30%).
    - `created_at`: Timestamp when the assignment was created.
    
    Properties:
    - `lecturer`: Convenience property that returns the lecturer of the classroom.
    
    Relationships:
    - Each assignment belongs to one classroom (many-to-one).
    - Connected to AssignmentSubmission for tracking student submissions.
    """

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

    """
    Model representing a student's submission for an assignment.
    
    Attributes:
    - `student`: Foreign key to the User who submitted the assignment.
    - `assignment`: Foreign key to the Assignment being submitted.
    - `file`: The uploaded file containing the student's work.
    - `submitted_at`: Timestamp when the submission was made.
    - `status`: String tracking the current status of the submission (default 'submitted').
    
    Meta:
    - `unique_together`: Ensures each student can only submit once per assignment.
    
    Relationships:
    - Each submission is made by one student for one assignment.
    - Connected to ProcessedDocument for plagiarism detection processing.
    - Connected to PlagiarismResult for comparing against other submissions.
    """

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

    """
    Model representing the processed version of a student submission ready for plagiarism detection.
    
    This model stores the text extraction and document fingerprinting results from processing
    a student's submission file.
    
    Attributes:
    - `submission`: One-to-one relationship with an AssignmentSubmission.
    - `processed_text`: The extracted text content from the submission file.
    - `fingerprints`: JSON field storing document fingerprints/hashes used for comparison.
    - `processed_at`: Timestamp when the processing was completed.
    - `status`: String tracking the processing status (default 'processing').
    
    Relationships:
    - Each processed document corresponds to exactly one submission.
    - Used in PlagiarismResult for comparison with other processed documents.
    """

    submission = models.OneToOneField(AssignmentSubmission, on_delete=models.CASCADE)
    processed_text = models.TextField()
    fingerprints = models.JSONField()
    processed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='processing')

    def __str__(self):
        return f"Processed document for {self.submission}"
    

from django.db import models

class PlagiarismResult(models.Model):

    """
    Model representing the result of a plagiarism comparison between two submissions.
    
    This model stores the outcome of comparing two student submissions for plagiarism,
    including their similarity score and the specific matching text segments.
    
    Attributes:
    - `submission1`: Foreign key to the first AssignmentSubmission being compared.
    - `submission2`: Foreign key to the second AssignmentSubmission being compared.
    - `similarity_score`: Float representing the percentage of similarity between submissions.
    - `matching_segments`: JSON field storing the matching text portions with their positions.
    - `compared_at`: Timestamp when the comparison was performed.
    
    Relationships:
    - Each result connects two different submissions.
    - Each submission can be involved in multiple comparisons (as either submission1 or submission2).
    """

    submission1 = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name='source_results')
    submission2 = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name='compared_results')
    similarity_score = models.FloatField()
    matching_segments = models.JSONField()  # Store matching text portions with positions
    compared_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comparison between {self.submission1.student} and {self.submission2.student}"