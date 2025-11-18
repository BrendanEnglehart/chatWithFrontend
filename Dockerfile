    # Use a base Python image
    FROM python:3.12-bookworm

    # Set environment variables
    ENV PYTHONUNBUFFERED=1

    # Set the working directory inside the container
    WORKDIR /Flask
    
    # Copy the Flask application code
    COPY . . 

    # Copy requirements.txt and install dependencies
    RUN pip install -r requirements.txt

    
    # Expose the port Flask will run on
    EXPOSE 5000

    # Command to run the Flask application
    CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1",   "--bind", "0.0.0.0:5000", "app:gunicorn"]