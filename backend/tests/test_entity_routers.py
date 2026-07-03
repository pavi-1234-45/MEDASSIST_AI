"""Tests for entity CRUD routers (patients, doctors, appointments, alerts)."""


class TestPatientsRouter:
    def test_list_patients(self, client):
        response = client.get("/api/patients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0  # mock data is seeded

    def test_get_patient(self, client):
        response = client.get("/api/patients/p1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "p1"
        assert data["name"] == "John Doe"

    def test_get_patient_not_found(self, client):
        response = client.get("/api/patients/nonexistent")
        assert response.status_code == 404

    def test_create_patient(self, client):
        response = client.post("/api/patients", json={
            "name": "New Patient",
            "age": 30,
            "gender": "Male",
            "phone": "1111111111",
            "condition": "Flu",
            "adherence": 100,
            "status": "Active",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Patient"

    def test_update_patient(self, client):
        response = client.put("/api/patients/p1", json={
            "adherence": 90,
        })
        assert response.status_code == 200

    def test_delete_patient(self, client):
        # Create, then delete
        create_resp = client.post("/api/patients", json={
            "name": "To Delete",
            "age": 25,
            "gender": "Female",
            "phone": "0000",
            "condition": "Test",
            "adherence": 0,
            "status": "Active",
        })
        pid = create_resp.json()["id"]
        del_resp = client.delete(f"/api/patients/{pid}")
        assert del_resp.status_code == 204


class TestDoctorsRouter:
    def test_list_doctors(self, client):
        response = client.get("/api/doctors")
        assert response.status_code == 200
        assert len(response.json()) > 0

    def test_get_doctor(self, client):
        response = client.get("/api/doctors/d1")
        assert response.status_code == 200
        assert response.json()["name"] == "Dr. Sarah Wilson"

    def test_create_doctor(self, client):
        response = client.post("/api/doctors", json={
            "name": "Dr. New",
            "specialization": "Neurologist",
            "hospital": "Test Hospital",
            "appointments": 0,
            "emergencies": 0,
        })
        assert response.status_code == 201


class TestAppointmentsRouter:
    def test_list_appointments(self, client):
        response = client.get("/api/appointments")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_appointment(self, client):
        response = client.post("/api/appointments", json={
            "patient_id": "p1",
            "patient_name": "John Doe",
            "doctor_id": "d1",
            "doctor_name": "Dr. Sarah Wilson",
            "date": "2024-01-15",
            "time": "09:00 AM",
            "status": "Scheduled",
        })
        assert response.status_code == 201

    def test_update_appointment_status(self, client):
        response = client.put("/api/appointments/a1", json={
            "status": "Completed",
        })
        assert response.status_code == 200
        assert response.json()["status"] == "Completed"


class TestAlertsRouter:
    def test_list_alerts(self, client):
        response = client.get("/api/alerts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_alert(self, client):
        response = client.post("/api/alerts", json={
            "type": "Emergency",
            "patient_name": "Test Patient",
            "symptom": "Test symptom",
            "status": "unread",
        })
        assert response.status_code == 201

    def test_update_alert_status(self, client):
        response = client.put("/api/alerts/al1/status", json={
            "status": "Resolved",
        })
        assert response.status_code == 200


class TestHealthRouter:
    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data

    def test_readiness(self, client):
        response = client.get("/api/health/ready")
        assert response.status_code == 200
        assert response.json()["ready"] is True
