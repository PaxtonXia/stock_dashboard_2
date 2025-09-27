# Stock Dashboard

## Overview
The Stock Dashboard is a web application that provides real-time stock data visualization. It fetches stock information, processes it, and renders it in a user-friendly format.

## Project Structure
```
stock_dashboard_v2
├── src
│   └── main.py          # Main application script containing the logic for the stock dashboard
├── Dockerfile           # Instructions to build a Docker image for the application
├── .github
│   └── workflows
│       └── docker-publish.yml  # GitHub Actions workflow for building and publishing the Docker image to AWS ECR
├── requirements.txt     # Lists the Python dependencies required for the project
└── README.md            # Documentation for the project
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/stock_dashboard_v2.git
   cd stock_dashboard_v2
   ```

2. **Install Dependencies**
   It is recommended to create a virtual environment before installing dependencies.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. **Run the Application**
   You can run the application locally using:
   ```bash
   python src/main.py
   ```

## Docker Instructions

To build and run the Docker container, use the following commands:

1. **Build the Docker Image**
   ```bash
   docker build -t stock-dashboard .
   ```

2. **Run the Docker Container**
   ```bash
   docker run -p 80:80 stock-dashboard
   ```

## Deployment

This project includes a GitHub Actions workflow that automatically builds and publishes the Docker image to AWS ECR whenever changes are pushed to the repository. Ensure that your AWS credentials are configured in the GitHub repository secrets.

## License
This project is licensed under the MIT License - see the LICENSE file for details.