# AWS Amplify Deployment Guide

This guide explains how to deploy the frontend of the Checkmk Downtime application to AWS Amplify.

## Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
2.  **AWS Account**: You need access to the AWS Console.

## Deployment Steps

1.  **Log in to AWS Console** and navigate to **AWS Amplify**.
2.  Click **"New app"** -> **"Host web app"**.
3.  Select **GitHub** and click **Continue**.
4.  Authorize AWS Amplify to access your GitHub account.
5.  **Select Repository**: Choose the repository containing this project.
6.  **Select Branch**: Choose the branch you want to deploy (e.g., `main`).
7.  **Build Settings**: Amplify should automatically detect the `amplify.yml` file in the root.
    *   Ensure the build settings look correct (preBuild: `npm ci`, build: `npm run build`, baseDirectory: `build`).
8.  **Environment Variables**:
    *   Click on **"Advanced settings"**.
    *   Add a new key-value pair:
        *   **Key**: `REACT_APP_API_URL`
        *   **Value**: The URL of your deployed Lambda backend (e.g., `https://<api-id>.execute-api.<region>.amazonaws.com/api`) or your current backend URL if testing.
9.  Click **"Next"** and then **"Save and deploy"**.

## Automatic CI/CD

Once set up, Amplify will automatically deploy a new version of your frontend every time you push changes to the connected branch (`main`).

## Domain Management

Amplify provides a default `amplifyapp.com` domain. You can add your own custom domain in the **"Domain management"** section of the Amplify Console.
