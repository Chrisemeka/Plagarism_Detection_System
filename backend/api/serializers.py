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
    class Meta:
        model = Classroom
        fields = ['id', 'code', 'title', 'lecturer_id', 'created_at']
        read_only_fields = ['created_at', 'code']

    def create(self, validated_data):
        validated_data['code'] = generate_unique_code()  # Generate a unique code for the classroom  
        return super().create(validated_data)

class ClassroomMembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassroomMembership
        fields = ['id', 'classroom', 'student', 'joined_at']
        read_only_fields = ['joined_at']

class JoinClassSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    # Using Serializer instead of ModelSerializer because we're only accepting a class code
    # rather than all fields from ClassroomMembership model
    
    code = serializers.CharField(max_length=6)
    # Defines a single field to accept the class code
    # max_length=6 matches our classroom code length

    def validate_code(self, value):
        # Special validation method for class_code field
        # 'value' is the class code entered by the user
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
        return {
            'message': 'Successfully joined class',
            'classroom': instance.classroom.title,
            'joined_at': instance.joined_at
        }

class AssignmentSerializer(serializers.ModelSerializer):
    classroom = serializers.CharField()  # Accept classroom code

    class Meta:
        model = Assignment
        fields = ['id', 'classroom', 'title', 'description', 'deadline', 'plagiarism_threshold']

    def validate_classroom(self, value):
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
    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'file', 'submitted_at', 'status']
        read_only_fields = ['submitted_at', 'status']
        


class PlagiarismResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlagiarismResult
        fields = ['similarity_score', 'matching_segments', 'compared_at']

class PlagiarismReportSerializer(serializers.Serializer):
    assignment_title = serializers.CharField()
    total_submissions = serializers.IntegerField()
    deadline = serializers.DateTimeField()
    comparisons = PlagiarismResultSerializer(many=True)
    check_date = serializers.DateTimeField()