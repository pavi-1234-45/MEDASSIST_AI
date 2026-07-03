"""Tests for the blockchain stub service."""
from app.services.blockchain import BlockchainService


class TestBlockchainAuditLog:
    def setup_method(self):
        self.service = BlockchainService()

    def test_create_audit_log(self):
        entry = self.service.create_audit_log(
            record_type="medical_record",
            record_id="mr-001",
            actor_id="doctor-123",
            action="create",
        )
        assert entry["record_type"] == "medical_record"
        assert entry["record_id"] == "mr-001"
        assert entry["actor_id"] == "doctor-123"
        assert entry["block_hash"] != ""
        assert entry["previous_hash"] == BlockchainService.GENESIS_HASH
        assert entry["block_index"] == 1

    def test_chain_linking(self):
        e1 = self.service.create_audit_log("record", "r1", "u1", "create")
        e2 = self.service.create_audit_log("record", "r2", "u2", "create")

        # Second entry's previous_hash should be first entry's block_hash
        assert e2["previous_hash"] == e1["block_hash"]
        assert e2["block_index"] == 2

    def test_get_audit_trail(self):
        self.service.create_audit_log("record", "r1", "u1", "create")
        self.service.create_audit_log("record", "r1", "u2", "read")
        self.service.create_audit_log("record", "r2", "u1", "create")

        trail = self.service.get_audit_trail("r1")
        assert len(trail) == 2
        assert all(e["record_id"] == "r1" for e in trail)

    def test_chain_integrity(self):
        self.service.create_audit_log("record", "r1", "u1", "create")
        self.service.create_audit_log("record", "r2", "u2", "create")
        self.service.create_audit_log("record", "r3", "u3", "create")

        assert self.service.verify_chain_integrity() is True


class TestBlockchainConsent:
    def setup_method(self):
        self.service = BlockchainService()

    def test_create_consent(self):
        consent = self.service.create_consent(
            patient_id="p1",
            consent_type="data_sharing",
            granted_to="d1",
            details="Share lab results",
        )
        assert consent["patient_id"] == "p1"
        assert consent["consent_type"] == "data_sharing"
        assert consent["consent_hash"] != ""
        assert consent["verified"] is True

    def test_verify_consent(self):
        consent = self.service.create_consent("p1", "treatment", "d1")
        result = self.service.verify_consent(consent["consent_hash"])
        assert result is not None
        assert result["verified"] is True

    def test_verify_invalid_consent(self):
        result = self.service.verify_consent("invalid_hash_12345")
        assert result is None

    def test_consent_creates_audit_log(self):
        consent = self.service.create_consent("p1", "research", "org1")
        trail = self.service.get_audit_trail(consent["id"])
        assert len(trail) == 1
        assert trail[0]["record_type"] == "consent"


class TestBlockchainRouter:
    def test_create_audit_via_api(self, client):
        response = client.post("/api/blockchain/audit", json={
            "record_type": "medical_record",
            "record_id": "mr-api-001",
            "actor_id": "doctor-001",
            "action": "create",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["block_hash"] != ""

    def test_get_audit_trail_via_api(self, client):
        # Create an entry first
        client.post("/api/blockchain/audit", json={
            "record_type": "test",
            "record_id": "mr-trail-001",
            "actor_id": "u1",
            "action": "create",
        })
        response = client.get("/api/blockchain/audit/mr-trail-001")
        assert response.status_code == 200

    def test_create_consent_via_api(self, client):
        response = client.post("/api/blockchain/consent", json={
            "patient_id": "p1",
            "consent_type": "data_sharing",
            "granted_to": "d1",
            "details": "Share data",
        })
        assert response.status_code == 201
        assert response.json()["consent_hash"] != ""
