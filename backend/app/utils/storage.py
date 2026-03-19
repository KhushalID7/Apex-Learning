from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions, ContentSettings
from app.config import get_settings
import uuid
import os
from datetime import datetime, timedelta

settings = get_settings()

def get_blob_service_client():
    """Returns a configured BlobServiceClient for Azure."""
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        raise Exception("Azure Storage Connection String is not configured.")
        
    return BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)

def upload_file_to_azure(file_object, filename: str, content_type: str) -> str:
    """
    Uploads a file object to Azure Blob Storage and returns the blob name.
    """
    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client(settings.AZURE_CONTAINER_NAME)
    
    # Create the container if it doesn't already exist
    if not container_client.exists():
        container_client.create_container()
        
    # Generate a unique path to avoid collisions
    unique_id = str(uuid.uuid4())
    file_extension = os.path.splitext(filename)[1]
    blob_name = f"lectures/{unique_id}{file_extension}"
    
    try:
        blob_client = container_client.get_blob_client(blob_name)
        
        # Upload the file
        blob_client.upload_blob(
            file_object,
            blob_type="BlockBlob",
            content_settings=ContentSettings(content_type=content_type),
            overwrite=True
        )
        
        return blob_name
        
    except Exception as e:
        print(f"Error uploading to Azure Blob Storage: {e}")
        raise Exception("Failed to upload file")

def generate_presigned_url(blob_name: str, expiration_hours: int = 24) -> str:
    """Generates a Shared Access Signature (SAS) URL to view/download the video"""
    if "://" in blob_name:
        return blob_name # Already a full URL
        
    try:
        blob_service_client = get_blob_service_client()
        
        # Get account name and key from the connection string or client
        account_name = blob_service_client.account_name
        account_key = blob_service_client.credential.account_name # The credential holds the key usually or we can extract it
        
        # Actually Azure python SDK makes extracting the key from the client tricky sometimes,
        # but the `generate_blob_sas` allows passing account_key directly.
        # Let's cleanly extract it from the connection string instead:
        conn_str_dict = dict(item.split('=', 1) for item in settings.AZURE_STORAGE_CONNECTION_STRING.split(';'))
        account_name_str = conn_str_dict.get('AccountName')
        account_key_str = conn_str_dict.get('AccountKey')

        sas_token = generate_blob_sas(
            account_name=account_name_str,
            container_name=settings.AZURE_CONTAINER_NAME,
            blob_name=blob_name,
            account_key=account_key_str,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=expiration_hours)
        )
        
        # Construct the final URL
        blob_client = blob_service_client.get_blob_client(container=settings.AZURE_CONTAINER_NAME, blob=blob_name)
        sas_url = f"{blob_client.url}?{sas_token}"
        return sas_url
        
    except Exception as e:
        print(f"Error generating SAS token: {e}")
        return ""
