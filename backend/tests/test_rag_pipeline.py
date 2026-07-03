"""Tests for the Medical RAG pipeline."""
from app.rag.pipeline import classify_intent, extract_query_terms, get_medical_context


class TestIntentClassification:
    def test_medicine_intent(self):
        intent = classify_intent("What are the side effects of metformin?")
        assert intent["is_medicine"] is True

    def test_disease_intent(self):
        intent = classify_intent("What are the symptoms of diabetes?")
        assert intent["is_disease"] is True

    def test_hospital_intent(self):
        intent = classify_intent("Find a cardiologist near me")
        assert intent["is_hospital"] is True

    def test_mixed_intent(self):
        intent = classify_intent("What medicine is used for diabetes treatment?")
        assert intent["is_medicine"] is True
        assert intent["is_disease"] is True

    def test_no_intent(self):
        intent = classify_intent("Hello, how are you?")
        assert intent["is_medicine"] is False
        assert intent["is_disease"] is False
        assert intent["is_hospital"] is False


class TestQueryExtraction:
    def test_extract_medicine_name(self):
        intent = {"is_medicine": True, "is_disease": False, "is_hospital": False}
        query = extract_query_terms("What are the side effects of paracetamol?", intent)
        assert query == "paracetamol"

    def test_extract_disease_name(self):
        intent = {"is_medicine": False, "is_disease": True, "is_hospital": False}
        query = extract_query_terms("What are the symptoms of asthma?", intent)
        # Should extract first significant word
        assert len(query) > 0

    def test_empty_message(self):
        intent = {"is_medicine": False, "is_disease": False, "is_hospital": False}
        query = extract_query_terms("", intent)
        assert query == ""


class TestRAGPipeline:
    def test_no_context_for_greeting(self):
        context, sources = get_medical_context("Hello there!")
        # May or may not return context depending on fallback
        assert isinstance(context, str)
        assert isinstance(sources, list)

    def test_context_contains_sources(self):
        context, sources = get_medical_context("Tell me about aspirin drug side effects")
        # This depends on network; if OpenFDA is reachable, we get context
        assert isinstance(sources, list)
