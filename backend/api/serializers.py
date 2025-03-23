from .models import User, Classroom, ClassroomMembership, Assignment # Import the custom User model
from rest_framework import serializers  # Import Django REST framework serializers
from .utils import generate_unique_code
from .models import AssignmentSubmission, PlagiarismResult




class UserSerializer(serializers.ModelSerializer):
    """
    A serializer for the User model that handles data validation and user creation.

    This serializer is used for both students and lecturers, ensuring that:
    - Data is properly validated before creating a user.
    - Passwords are securely handled and hashed.
    """

    class Meta:
        """
        Meta configuration for the UserSerializer class.

        Attributes:
        - model: Specifies the User model as the target for serialization.
        - fields: Lists all fields to be included in the serialization process:
            - 'email': Email address of the user (used as the login identifier).
            - 'password': Password for authentication (stored securely as a hash).
            - 'first_name': User's first name.
            - 'last_name': User's last name.
            - 'user_type': Indicates whether the user is a student or lecturer.
            - 'department': Department the user belongs to.
            - 'matric_number': Unique identifier for the user (e.g., matriculation number).
        - extra_kwargs: Additional configuration for fields:
            - 'password': Marked as write-only to ensure it is not returned in responses.
        """
        model = User
        fields = [
            'email', 
            'password', 
            'first_name', 
            'last_name', 
            'user_type', 
            'department', 
            'matric_number'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'matric_number': {'required': False},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'user_type': {'required': True},
        }  # these parameters are not included in API responses.

    def create(self, validated_data):
        """
        Creates a new user instance with a securely hashed password.

        This method overrides the default `create` behavior to ensure:
        - Passwords are hashed before being stored in the database.
        - The `create_user` method of the custom User model is used.

        Args:
            validated_data (dict): Cleaned data after validation, containing:
                - Email
                - Password
                - First and last name
                - User type
                - Department
                - Matric number
        
        Returns:
            User: A new user instance with hashed password.
        """
        user = User.objects.create_user(**validated_data)  # Create a user with hashed password
        return user

class ClassroomSerializer(serializers.ModelSerializer):

    """
    A serializer for the Classroom model that handles data validation and classroom creation.

    This serializer handles classroom data serialization and deserialization, ensuring that:
    - Data is properly validated before creating a classroom.
    - A unique code is automatically generated for new classrooms.
    """

    class Meta:
        """
        Meta configuration for the ClassroomSerializer class.

        Attributes:
        - model: Specifies the Classroom model as the target for serialization.
        - fields: Lists all fields to be included in the serialization process:
            - 'id': Unique identifier for the classroom.
            - 'code': Unique code for students to join the classroom.
            - 'title': The name or title of the classroom.
            - 'lecturer_id': Reference to the lecturer who owns the classroom.
            - 'created_at': Timestamp when the classroom was created.
        - read_only_fields: Fields that cannot be modified by API requests:
            - 'created_at': Set automatically upon creation.
            - 'code': Generated automatically, not set by user input.
        """

        model = Classroom
        fields = ['id', 'code', 'title', 'lecturer_id', 'created_at']
        read_only_fields = ['created_at', 'code']

    def create(self, validated_data):

        """
        Creates a new classroom instance with a unique code.

        This method overrides the default `create` behavior to ensure:
        - Each classroom has a unique code generated for it.
        - The code is generated using a utility function.

        Args:
            validated_data (dict): Cleaned data after validation, containing:
                - Title
                - Lecturer ID
        
        Returns:
            Classroom: A new classroom instance with a unique code.
        """

        validated_data['code'] = generate_unique_code()  # Generate a unique code for the classroom  
        return super().create(validated_data)

class ClassroomMembershipSerializer(serializers.ModelSerializer):
    """
    A serializer for the ClassroomMembership model that handles student enrollment in classrooms.

    This serializer manages the many-to-many relationship between students and classrooms,
    ensuring proper data validation and creation of membership records.

    """
    class Meta:
        """
        Meta configuration for the ClassroomMembershipSerializer class.

        Attributes:
        - model: Specifies the ClassroomMembership model as the target for serialization.
        - fields: Lists all fields to be included in the serialization process:
            - 'id': Unique identifier for the membership record.
            - 'classroom': Reference to the classroom the student is joining.
            - 'student': Reference to the student who is joining the classroom.
            - 'joined_at': Timestamp when the student joined the classroom.
        - read_only_fields: Fields that cannot be modified by API requests:
            - 'joined_at': Set automatically upon creation.
        """

        model = ClassroomMembership
        fields = ['id', 'classroom', 'student', 'joined_at']
        read_only_fields = ['joined_at']

class JoinClassSerializer(serializers.Serializer):

    """
    A custom serializer for handling the process of students joining a classroom using a class code.

    This serializer:
    - Accepts only the classroom code as input.
    - Validates the code against existing classrooms.
    - Creates a ClassroomMembership record if validation passes.
    - Prevents duplicate enrollments.
    """

    code = serializers.CharField(max_length=6)
    # Defines a single field to accept the class code
    # max_length=6 matches our classroom code length
    
    code = serializers.CharField(max_length=6)
    # Defines a single field to accept the class code
    # max_length=6 matches our classroom code length

    def validate_code(self, value):
        # Special validation method for class_code field
        # 'value' is the class code entered by the user
        """
        Validates that the provided classroom code exists in the database.

        This method ensures:
        - The classroom code corresponds to an actual classroom.
        - A helpful error message is returned if the code is invalid.

        Args:
            value (str): The classroom code provided by the user.
            
        Returns:
            str: The validated classroom code.
            
        Raises:
            ValidationError: If no classroom exists with the provided code.
        """
        try:
            classroom = Classroom.objects.get(code=value)
            # Tries to find a classroom with the provided code
            return value
            
        except Classroom.DoesNotExist:
            # If no classroom found with this code
            raise serializers.ValidationError("Invalid class code")

    def create(self, validated_data):
        # Called after validation passes
        # validated_data contains the cleaned class_code
        """
        Creates a new ClassroomMembership after validating the class code.

        This method:
        - Retrieves the classroom using the validated code.
        - Gets the current user (student) from the request context.
        - Checks if the student has already joined this classroom.
        - Creates a new membership record if not already joined.

        Args:
            validated_data (dict): Cleaned data after validation, containing the class code.
            
        Returns:
            ClassroomMembership: A new membership record linking the student to the classroom.
            
        Raises:
            ValidationError: If the student has already joined this classroom.
        """
        
        classroom = Classroom.objects.get(code=validated_data['code'])
        # Get the classroom object using the validated code
        
        student = self.context['request'].user
        # Get the student (current user) from the request context
        
        # Check if student already joined this class
        if ClassroomMembership.objects.filter(
            classroom=classroom, 
            student=student
        ).exists():
            raise serializers.ValidationError("Already joined this class")

        # If not already joined, create new membership
        return ClassroomMembership.objects.create(
            classroom=classroom,
            student=student
        )
    def to_representation(self, instance):
        # Define what data to return after successful creation
        """
        Formats the response data after successful classroom enrollment.

        This method customizes the serializer's output to provide:
        - A success message.
        - The name of the classroom joined.
        - The timestamp when the student joined.

        Args:
            instance (ClassroomMembership): The newly created membership record.
            
        Returns:
            dict: Formatted response data with success information.
        """
        return {
            'message': 'Successfully joined class',
            'classroom': instance.classroom.title,
            'joined_at': instance.joined_at
        }

class AssignmentSerializer(serializers.ModelSerializer):
    """
    A serializer for the Assignment model that handles assignment creation and validation.

    This serializer:
    - Accepts a classroom code instead of a classroom ID.
    - Validates that the lecturer creating the assignment owns the classroom.
    - Ensures proper data validation for assignment creation.
    """
    classroom = serializers.CharField()  # Accept classroom code

    class Meta:
        """
        Meta configuration for the AssignmentSerializer class.

        Attributes:
        - model: Specifies the Assignment model as the target for serialization.
        - fields: Lists all fields to be included in the serialization process:
            - 'id': Unique identifier for the assignment.
            - 'classroom': The classroom code where this assignment belongs.
            - 'title': The name or title of the assignment.
            - 'description': Detailed instructions for the assignment.
            - 'deadline': Date and time when the assignment is due.
            - 'plagiarism_threshold': Percentage threshold for flagging similar submissions.
        """
        model = Assignment
        fields = ['id', 'classroom', 'title', 'description', 'deadline', 'plagiarism_threshold']

    def validate_classroom(self, value):
        """
        Validates the classroom code and lecturer ownership.

        This method ensures:
        - The classroom code corresponds to an actual classroom.
        - The lecturer creating the assignment owns the classroom.
        - A helpful error message is returned for invalid scenarios.

        Args:
            value (str): The classroom code provided by the user.
            
        Returns:
            Classroom: The validated classroom object.
            
        Raises:
            ValidationError: If the classroom code is invalid or the lecturer doesn't own the classroom.
        """
        try:
            classroom = Classroom.objects.get(code=value)
            # Verify lecturer owns this classroom
            user = self.context['request'].user
            if classroom.lecturer != user:
                raise serializers.ValidationError("You can only create assignments for your own classes")
            return classroom
        except Classroom.DoesNotExist:
            raise serializers.ValidationError("Invalid classroom code")
        

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """
    A serializer for the AssignmentSubmission model that handles student submissions.

    This serializer manages:
    - File uploads for assignment submissions.
    - Tracking submission timestamps and status.
    - Ensuring proper data validation for student submissions.
    """
    class Meta:
        """
        Meta configuration for the AssignmentSubmissionSerializer class.

        Attributes:
        - model: Specifies the AssignmentSubmission model as the target for serialization.
        - fields: Lists all fields to be included in the serialization process:
            - 'id': Unique identifier for the submission.
            - 'file': The uploaded file containing the student's work.
            - 'submitted_at': Timestamp when the submission was made.
            - 'status': Current status of the submission.
        - read_only_fields: Fields that cannot be modified by API requests:
            - 'submitted_at': Set automatically upon creation.
            - 'status': Managed by the system, not user input.
        """
        model = AssignmentSubmission
        fields = ['id', 'file', 'submitted_at', 'status']
        read_only_fields = ['submitted_at', 'status']
        


class PlagiarismResultSerializer(serializers.ModelSerializer):
    """
    A serializer for the PlagiarismResult model that handles plagiarism comparison results.

    This serializer:
    - Includes student information for both submissions being compared.
    - Manages the serialization of similarity scores and matching segments.
    - Provides a formatted view of plagiarism detection results.
    """
    # Add student1 and student2 fields
    student1 = serializers.CharField()
    student2 = serializers.CharField()
    
    class Meta:
        """
        Meta configuration for the PlagiarismResultSerializer class.

        Attributes:
        - model: Specifies the PlagiarismResult model as the target for serialization.
        - fields: Lists all fields to be included in the serialization process:
            - 'student1': Identifier for the first student in the comparison.
            - 'student2': Identifier for the second student in the comparison.
            - 'similarity_score': Percentage indicating how similar the submissions are.
            - 'matching_segments': JSON data showing specific matching text portions.
            - 'compared_at': Timestamp when the comparison was performed.
        """
        model = PlagiarismResult
        fields = ['student1', 'student2', 'similarity_score', 'matching_segments', 'compared_at']

class PlagiarismReportSerializer(serializers.Serializer):
    """
    A custom serializer for generating comprehensive plagiarism reports for assignments.

    This serializer:
    - Is not tied to a specific model (uses base Serializer class).
    - Aggregates data about plagiarism across an entire assignment.
    - Provides summary metrics and detailed comparison results.
    """
    """
    Fields explained:
    - 'assignment_title': The name of the assignment being reported on.
    - 'total_submissions': Count of all submissions for this assignment.
    - 'deadline': The due date and time for the assignment.
    - 'average_similarity': The mean similarity score across all comparisons.
    - 'above_threshold_count': Number of comparisons exceeding the plagiarism threshold.
    - 'comparisons': Nested serializer containing detailed comparison results.
    - 'check_date': Timestamp when the plagiarism check was conducted.
    """
    assignment_title = serializers.CharField()
    total_submissions = serializers.IntegerField()
    deadline = serializers.DateTimeField()
    # Add additional metrics fields
    average_similarity = serializers.FloatField()
    above_threshold_count = serializers.IntegerField()
    comparisons = PlagiarismResultSerializer(many=True)
    check_date = serializers.DateTimeField()
    