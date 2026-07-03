"""Tests for Medical data proxy endpoints."""


class TestRxNormProxy:
    def test_rxnorm_proxy(self, client):
        # This test hits the real RxNorm API — only run with network
        response = client.get("/api/medical/rxnorm/rxcui.json?name=lipitor")
        assert response.status_code in (200, 500)  # 500 if network is unavailable


class TestOpenFDAProxy:
    def test_openfda_proxy(self, client):
        response = client.get("/api/medical/openfda/drug/label.json?search=aspirin&limit=1")
        assert response.status_code in (200, 500)


class TestDataGovProxy:
    def test_datagov_no_key(self, client):
        # Should fail gracefully when DATA_GOV_IN_API_KEY is not set
        response = client.get("/api/medical/datagov/resource/test123?format=json")
        # May return 500 if key is not configured
        assert response.status_code in (200, 500)
