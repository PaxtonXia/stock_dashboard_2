# stock_dashboard_v2

This project is a Dockerized application that automatically builds and publishes a Docker image to AWS Elastic Container Registry (ECR) upon pushing to GitHub.

## Project Structure

- **.github/workflows/docker-ecr.yml**: Contains the GitHub Actions workflow configuration for building and publishing the Docker image.
- **src/**: This directory is intended for the source code of the project.
- **package.json**: Configuration file for npm, listing dependencies and scripts for the project.
- **tsconfig.json**: Configuration file for TypeScript, specifying compiler options and files to include in the compilation.

## Getting Started

To get started with this project, clone the repository and install the necessary dependencies:

```bash
git clone <repository-url>
cd stock_dashboard_v2
npm install
```

## Building the Docker Image

The Docker image is built automatically when you push changes to the `main` branch. The image is tagged and pushed to the AWS ECR repository at `381492201343.dkr.ecr.ap-southeast-1.amazonaws.com/stock-dashboard`.

## License

This project is licensed under the MIT License.