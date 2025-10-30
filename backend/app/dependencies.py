from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging
from jose import jwt, jwk
from jose.jwt import get_unverified_header
from urllib.request import urlopen
import json

logger = logging.getLogger("checkmk_api")

security = HTTPBearer()

# --- Cognito Configuration --- #
# These should ideally come from environment variables
COGNITO_REGION = os.getenv("COGNITO_REGION", "eu-west-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "eu-west-1_E3d6JEkfX")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "5v6sqab99b9mbb7es880cg6mjc")

COGNITO_KEYS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

# Cache for JWKS
jwks = None

async def get_jwks():
    """Fetches and caches the JWKS from Cognito."""
    global jwks
    if jwks is None:
        try:
            logger.info(f"Fetching JWKS from {COGNITO_KEYS_URL}")
            response = urlopen(COGNITO_KEYS_URL)
            jwks = json.loads(response.read())
            logger.info("JWKS fetched successfully.")
        except Exception as e:
            logger.error(f"Failed to fetch JWKS: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch public keys for authentication."
            )
    return jwks

async def validate_token(token: str = Depends(security)) -> dict:
    """Validates a Cognito JWT token and returns its claims."""
    if not token or not token.credentials:
        logger.warning("No token provided in Authorization header.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    id_token = token.credentials
    headers = get_unverified_header(id_token)
    kid = headers.get("kid")

    if not kid:
        logger.warning("JWT token missing 'kid' header.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing 'kid' header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jwks = await get_jwks()
    key = None
    for jwk_key in jwks['keys']:
        if jwk_key['kid'] == kid:
            key = jwk_key
            break

    if not key:
        logger.warning(f"No matching JWK found for kid: {kid}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: no matching public key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Decode and verify the token
        payload = jwt.decode(
            id_token,
            key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
        )
        logger.info(f"Token validated successfully for user: {payload.get('username')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTClaimsError as e:
        logger.warning(f"Invalid token claims: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token claims: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# This dependency will be used in your API routes
async def get_current_user(claims: dict = Depends(validate_token)) -> str:
    """Returns the username from the validated token claims."""
    username = claims.get("username")
    if not username:
        logger.warning("Token payload missing username claim.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not get username from token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username