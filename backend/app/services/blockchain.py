import hashlib
import json
from datetime import datetime

class BlockchainService:
    """
    Mock service to simulate Hyperledger Fabric interactions for audit logs 
    and medical record hashes, as requested for local development.
    """
    
    @staticmethod
    def generate_hash(data: dict) -> str:
        """Generates a SHA-256 hash of the input data."""
        data_string = json.dumps(data, sort_keys=True).encode('utf-8')
        return hashlib.sha256(data_string).hexdigest()

    @staticmethod
    def record_consent(patient_id: str, consent_data: dict) -> str:
        """
        Simulates recording a patient consent hash on the blockchain.
        In a real app, this would use a fabric-sdk-py chaincode invocation.
        """
        consent_hash = BlockchainService.generate_hash(consent_data)
        # Mock transaction ID
        tx_id = hashlib.sha256(f"{patient_id}-{datetime.now()}".encode()).hexdigest()[:16]
        print(f"[Blockchain] Recorded consent for patient {patient_id}. Hash: {consent_hash}, TX: {tx_id}")
        return tx_id

    @staticmethod
    def verify_record_integrity(record_id: str, current_data: dict, stored_hash: str) -> bool:
        """
        Simulates verifying that a medical record's hash matches the current data.
        """
        current_hash = BlockchainService.generate_hash(current_data)
        is_valid = (current_hash == stored_hash)
        print(f"[Blockchain] Integrity check for {record_id}: {'PASSED' if is_valid else 'FAILED'}")
        return is_valid

    @staticmethod
    def log_audit_event(action: str, user_id: str, resource: str):
        """
        Simulates logging a tamper-proof audit event on the blockchain.
        """
        event_data = {
            "action": action,
            "user_id": user_id,
            "resource": resource,
            "timestamp": datetime.utcnow().isoformat()
        }
        event_hash = BlockchainService.generate_hash(event_data)
        print(f"[Blockchain Audit] {action} by {user_id} on {resource}. Hash: {event_hash}")
        return event_hash

blockchain_service = BlockchainService()
