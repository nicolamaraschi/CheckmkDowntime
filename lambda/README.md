# Serverless Backend Deployment Guide

This directory contains the serverless version of the Checkmk Downtime API, ready to be deployed to AWS Lambda using AWS SAM (Serverless Application Model).

## Prerequisites

1.  **AWS CLI** installed and configured (`aws configure`).
2.  **AWS SAM CLI** installed (`brew install aws-sam-cli`).
3.  **Docker** installed (optional, but recommended for local testing).

## Directory Structure

- `app/`: Contains the FastAPI application code (adapted for Lambda).
- `template.yaml`: AWS SAM Infrastructure as Code definition.
- `requirements.txt`: Python dependencies for the Lambda environment.

## Deployment Steps

### 1. Build the Application

This command prepares the application for deployment by installing dependencies and packaging the code.

```bash
cd lambda
sam build
```

### 2. Deploy to AWS

Run the guided deployment command. This will ask you for the configuration parameters defined in `template.yaml`.

```bash
sam deploy --guided
```

**Configuration Prompts:**

- **Stack Name**: `checkmk-downtime-api` (or any name you prefer)
- **AWS Region**: `eu-central-1` (or your preferred region)
- **CheckmkHost**: URL of your CheckMK server (e.g., `http://checkmk.example.com`)
- **CheckmkSite**: Your CheckMK site name
- **CheckmkUser**: Automation user
- **CheckmkPassword**: Automation password
- **AwsRegion**: Region for Athena (usually same as deployment region)
- **AthenaDb**: `cloudconnexa_logs_db`
- **AthenaResultsBucket**: Name of your S3 bucket for Athena results
- **AthenaWorkgroup**: `CloudConnexaLogs`
- **SapAthenaDb**: `sap_reports_db`
- **SapAthenaWorkgroup**: `ReportCheckSistemiSap`
- **Confirm changes before deploy**: `Y`
- **Allow SAM CLI IAM role creation**: `Y`
- **Save arguments to configuration file**: `Y`

### 3. Get the API URL

After deployment, SAM will output the `CheckmkApiUrl`. It will look like:
`https://<api-id>.execute-api.<region>.amazonaws.com/`

### 4. Update Frontend

Update your React frontend `.env` file to point to this new URL:

```bash
REACT_APP_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/api
```

## Local Testing (Optional)

You can test the API locally using SAM:

```bash
sam local start-api
```

The API will be available at `http://localhost:3000`.

## Notes

- **CORS**: The Lambda function is configured to allow all origins (`*`). For production, you might want to restrict this in `app/main.py`.
- **Timeout**: The function timeout is set to 30 seconds to handle potentially long Athena queries.
- **Memory**: Allocated memory is 512MB for better performance.
