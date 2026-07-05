# MedAssist AI — Intelligent Multilingual Healthcare Assistant

## Database Design Document

---

### Document Information

| Field | Details |
|---|---|
| **Project Title** | MedAssist AI — Intelligent Multilingual Healthcare Assistant |
| **Document Type** | Database Design Document |
| **Database Platform** | Google Cloud Firestore (NoSQL Document Database) |
| **Backend Framework** | FastAPI (Python 3.10+) |
| **Authentication** | Firebase Authentication (Email / Password) |
| **Version** | 2.0.0 |
| **Prepared By** | MedAssist AI Engineering Team |
| **Date** | July 2026 |

---

A comprehensive database design document for the MedAssist AI Healthcare Assistant Application.
MedAssist AI is an intelligent, multilingual healthcare platform serving four distinct user
roles — **Patient**, **Doctor**, **Caregiver**, and **Admin** — with integrated AI-powered
medical guidance, medicine management, appointment scheduling, emergency SOS, caregiver
alerting, and blockchain-based audit logging.

---

## Entity-Relationship Diagram

### Contents:
❖ Listing Entities
❖ Listing Attributes
❖ Relationships
❖ Database Design
❖ Generating Collections (Tables)

---

## ❖ List of Entities

### 1. User Management Module
- User
- UserRole
- UserPreference
- SecurityCredential
- SessionLog
- AccountStatus

### 2. Patient Health Profile Module
- PatientProfile
- EmergencyContact
- Allergy
- ChronicCondition
- BloodGroup
- PatientStatus

### 3. Doctor Professional Module
- DoctorProfile
- Specialization
- HospitalAffiliation
- DoctorAvailability
- ClinicalNote

### 4. Caregiver Monitoring Module
- CaregiverProfile
- CaregiverPatientMapping
- AlertPreference
- CaregiverRelationshipType

### 5. Medicine Management Module
- MedicineSchedule
- MedicineLog
- MedicineSlot
- ReminderConfiguration
- WHOEssentialMedicine
- MedicineCategory

### 6. Appointment Booking Module
- Appointment
- AppointmentStatus
- AppointmentSlot
- AppointmentReason
- AppointmentPolicy

### 7. Emergency SOS Module
- SOSEvent
- SOSNotification
- EmergencyService
- SOSStatus

### 8. AI Chat and Voice Module
- ChatSession
- ChatMessage
- VoiceSession
- RAGQueryLog
- ChatLanguageSetting

### 9. Notification Engine Module
- Notification
- NotificationChannel
- NotificationTemplate
- NotificationPreference
- DeliveryLog

### 10. Alert Management Module
- Alert
- AlertType
- AlertSeverity
- AlertStatus

### 11. Reports and Analytics Module
- HealthReport
- AdherenceReport
- SystemReport
- ReportType
- ReportSchedule

### 12. Audit and Compliance Module
- AuditLog
- ConsentRecord
- BlockchainBlock
- DataAccessLog

### 13. System Configuration Module
- SystemSetting
- LanguageLocale
- APIConfiguration
- RateLimitPolicy
- FeatureFlag

---

## ❖ List of Attributes

### 1. User Management Module

**User**
- user_id (Firebase UID — unique identifier for each user)
- email (registered email address of the user)
- display_name (full name of the user as displayed in the interface)
- role (user role: patient / doctor / caregiver / admin)
- phone (contact phone number with country code)
- language_preference (preferred language code: en / hi / ta / kn / ml / te)
- profile_photo_url (URL of the user's profile picture)
- is_active (whether the user account is currently active)
- email_verified (whether the email has been verified via Firebase)
- created_at (timestamp of account creation)
- updated_at (timestamp of last profile update)
- last_login (timestamp of last successful login)
- deleted (soft delete flag)
- deleted_at (timestamp of soft deletion)

**UserRole**
- role_id (unique identifier for each role definition)
- role_name (name of the role: patient / doctor / caregiver / admin)
- role_description (description of the role's purpose and permissions)
- access_level (numeric access level: 1=Patient, 2=Doctor, 3=Caregiver, 4=Admin)
- is_active (whether the role is currently assignable)

**UserPreference**
- preference_id (unique identifier for the preference record)
- user_id (reference to the user)
- font_size (preferred font size: small / medium / large / extra-large)
- high_contrast_mode (whether high-contrast mode is enabled)
- notification_sound (whether notification sounds are enabled)
- theme (UI theme: light / dark / system)
- timezone (user's timezone setting)

**SessionLog**
- session_id (unique identifier for the login session)
- user_id (reference to the user who logged in)
- login_timestamp (date and time of login)
- logout_timestamp (date and time of logout)
- device_info (browser or device information string)
- ip_address (IP address from which the user logged in)
- session_duration (total duration of the session in seconds)

**AccountStatus**
- status_id (unique identifier for the account status type)
- status_name (name of the status: Active / Suspended / Deactivated / Deleted)
- status_description (description of what this status means)

---

### 2. Patient Health Profile Module

**PatientProfile**
- patient_id (reference to user_id — one-to-one relationship)
- age (patient's age in years)
- gender (patient's gender: Male / Female / Other)
- date_of_birth (patient's date of birth)
- blood_group (patient's blood group: A+ / A- / B+ / B- / AB+ / AB- / O+ / O-)
- height_cm (patient's height in centimetres)
- weight_kg (patient's weight in kilograms)
- phone (patient contact phone number)
- address (patient residential address)
- condition (primary medical condition description)
- allergies (array of known allergies)
- chronic_conditions (array of chronic conditions such as diabetes, hypertension)
- assigned_doctor_id (reference to the doctor user_id)
- assigned_caregiver_id (reference to the caregiver user_id)
- health_score (calculated health score 0–100)
- adherence (medicine adherence percentage 0–100)
- status (patient status: Active / Stable / Needs Attention / Critical)
- last_alert (timestamp of the most recent alert concerning this patient)
- last_checkup (timestamp of the most recent medical checkup)
- insurance_id (patient's health insurance identifier)
- created_at (timestamp of profile creation)
- updated_at (timestamp of last profile update)
- deleted (soft delete flag)

**EmergencyContact**
- contact_id (unique identifier for the emergency contact record)
- patient_id (reference to the patient this contact belongs to)
- contact_name (full name of the emergency contact person)
- contact_phone (phone number of the emergency contact)
- relationship (relationship to the patient: Spouse / Parent / Child / Sibling / Other)
- is_primary (whether this is the primary emergency contact)
- created_at (timestamp of record creation)

**BloodGroup**
- blood_group_id (unique identifier for each blood group type)
- blood_group_name (name of the blood group: A+ / A- / B+ / B- / AB+ / AB- / O+ / O-)
- description (description of the blood group characteristics)

**PatientStatus**
- status_id (unique identifier for the patient status type)
- status_name (name of the status: Active / Stable / Needs Attention / Critical)
- status_description (description of what this status means clinically)
- severity_level (numeric severity: 1=Active, 2=Stable, 3=Needs Attention, 4=Critical)

---

### 3. Doctor Professional Module

**DoctorProfile**
- doctor_id (reference to user_id — one-to-one relationship)
- specialization (medical specialization of the doctor)
- hospital (name of the affiliated hospital or clinic)
- experience_years (number of years of professional experience)
- qualification (medical qualifications and degrees)
- license_number (medical license or registration number)
- consultation_fee (consultation fee amount)
- currency (currency code for the consultation fee: INR / USD)
- total_appointments (cumulative count of appointments handled)
- total_emergencies (cumulative count of emergencies attended)
- available_days (array of available days: Monday–Sunday)
- available_hours_start (daily availability start time)
- available_hours_end (daily availability end time)
- max_patients_per_day (maximum number of patients per day)
- rating (average patient rating 0.0–5.0)
- is_accepting_patients (whether the doctor is currently accepting new patients)
- created_at (timestamp of profile creation)
- updated_at (timestamp of last profile update)
- deleted (soft delete flag)

**ClinicalNote**
- note_id (unique identifier for the clinical note)
- doctor_id (reference to the doctor who authored the note)
- patient_id (reference to the patient the note concerns)
- appointment_id (reference to the related appointment)
- note_content (full text of the clinical note)
- diagnosis_codes (array of WHO ICD-11 codes referenced)
- prescriptions (array of prescribed medicines with dosage)
- follow_up_date (recommended follow-up date)
- created_at (timestamp of note creation)
- updated_at (timestamp of last note update)
- deleted (soft delete flag)

**Specialization**
- specialization_id (unique identifier for the specialization)
- specialization_name (name: Cardiologist / Dermatologist / General Physician / etc.)
- specialization_description (description of the medical specialization)

---

### 4. Caregiver Monitoring Module

**CaregiverProfile**
- caregiver_id (reference to user_id — one-to-one relationship)
- phone (caregiver contact phone number)
- address (caregiver residential address)
- relationship_to_patient (default relationship: Spouse / Child / Parent / Professional)
- total_patients_assigned (count of patients currently assigned)
- alert_preference_channel (preferred alert channel: push / sms / whatsapp)
- is_available (whether the caregiver is currently available for alerts)
- created_at (timestamp of profile creation)
- updated_at (timestamp of last profile update)
- deleted (soft delete flag)

**CaregiverPatientMapping**
- mapping_id (unique identifier for the caregiver-patient assignment)
- caregiver_id (reference to the caregiver user_id)
- patient_id (reference to the patient user_id)
- relationship (relationship to the assigned patient)
- assigned_date (date the caregiver was assigned to the patient)
- is_active (whether the assignment is currently active)
- alert_enabled (whether alerts are enabled for this assignment)
- created_at (timestamp of mapping creation)

**CaregiverRelationshipType**
- type_id (unique identifier for the relationship type)
- type_name (name: Spouse / Parent / Child / Sibling / Professional Caregiver / Other)
- type_description (description of the relationship type)

---

### 5. Medicine Management Module

**MedicineSchedule**
- medicine_id (unique identifier for the medicine schedule entry)
- patient_id (reference to the patient this medicine belongs to)
- name (name of the medicine)
- dosage (dosage amount and unit: 500mg / 10ml / etc.)
- frequency (administration frequency: Once daily / Twice daily / Thrice daily / As needed)
- schedule_slots (array of time slots: morning / afternoon / evening / night)
- reminder_times (array of specific reminder times: 08:00 / 14:00 / 20:00)
- start_date (date the medicine schedule begins)
- end_date (date the medicine schedule ends)
- prescribing_doctor_id (reference to the doctor who prescribed this medicine)
- instructions (special instructions: Take with food / Take before meals / etc.)
- is_active (whether the medicine schedule is currently active)
- notes (additional notes about the medicine)
- created_at (timestamp of schedule creation)
- updated_at (timestamp of last schedule update)
- deleted (soft delete flag)

**MedicineLog**
- log_id (unique identifier for the medicine log entry)
- medicine_id (reference to the medicine schedule)
- patient_id (reference to the patient)
- status (whether the medicine was taken or missed)
- slot (time slot the log corresponds to: morning / afternoon / evening / night)
- scheduled_time (the time the medicine was scheduled to be taken)
- actual_time (the time the medicine was actually taken, if taken)
- logged_by (user_id of who logged this — patient or caregiver)
- timestamp (timestamp of the log event)
- notes (optional notes about the dose)

**WHOEssentialMedicine**
- eml_id (unique identifier for the WHO EML entry)
- medicine_name (name of the medicine in the WHO Essential Medicines List)
- generic_name (generic or INN name of the medicine)
- atc_code (Anatomical Therapeutic Chemical classification code)
- category (WHO therapeutic category)
- formulation (available formulations: tablet / capsule / injection / syrup)
- dosage_forms (array of available dosage forms)
- indications (clinical indications for use)
- who_section (section reference in the WHO EML)
- is_core_list (whether the medicine is on the WHO Core List)

**MedicineCategory**
- category_id (unique identifier for the medicine category)
- category_name (name: Analgesics / Antibiotics / Cardiovascular / Endocrine / etc.)
- category_description (description of the medicine category)
- parent_category_id (reference to parent category for sub-categories)

---

### 6. Appointment Booking Module

**Appointment**
- appointment_id (unique identifier for the appointment)
- patient_id (reference to the patient user_id)
- patient_name (name of the patient for display purposes)
- doctor_id (reference to the doctor user_id)
- doctor_name (name of the doctor for display purposes)
- date (appointment date in ISO format YYYY-MM-DD)
- time (appointment time e.g. 10:00 AM)
- duration_minutes (expected duration of the appointment in minutes)
- reason (reason for the appointment provided by the patient)
- status (appointment status: Scheduled / Confirmed / Completed / Missed / Cancelled)
- cancellation_reason (reason for cancellation if cancelled)
- cancelled_by (user_id of who cancelled the appointment)
- notes (doctor's clinical notes post-appointment)
- follow_up_required (whether a follow-up appointment is recommended)
- follow_up_date (recommended follow-up date)
- created_at (timestamp of appointment booking)
- updated_at (timestamp of last status update)
- deleted (soft delete flag)

**AppointmentStatus**
- status_id (unique identifier for the appointment status type)
- status_name (name: Scheduled / Confirmed / Completed / Missed / Cancelled)
- status_description (description of the status meaning)
- is_terminal (whether this is a terminal/final status)

**AppointmentSlot**
- slot_id (unique identifier for the appointment slot)
- doctor_id (reference to the doctor user_id)
- date (date the slot is available)
- start_time (slot start time)
- end_time (slot end time)
- is_booked (whether the slot has been booked)
- booked_by_patient_id (reference to the patient who booked this slot)

**AppointmentPolicy**
- policy_id (unique identifier for the appointment policy)
- policy_name (name of the policy: Cancellation / Rescheduling / No-Show)
- policy_description (full description of the policy terms)
- advance_booking_days (maximum days in advance an appointment can be booked)
- cancellation_window_hours (hours before appointment when cancellation is allowed)
- max_appointments_per_day (maximum appointments a patient can book per day)
- is_active (whether this policy is currently enforced)

---

### 7. Emergency SOS Module

**SOSEvent**
- sos_id (unique identifier for the SOS event)
- patient_id (reference to the patient who triggered the SOS)
- timestamp (date and time the SOS was triggered)
- location_latitude (GPS latitude coordinate if available)
- location_longitude (GPS longitude coordinate if available)
- location_address (reverse-geocoded address if available)
- status (SOS status: Active / Acknowledged / Resolved / False Alarm)
- severity (severity level: Low / Medium / High / Critical)
- description (optional description of the emergency)
- notified_contacts (array of user_ids who were notified)
- notified_doctors (array of doctor user_ids who were notified)
- acknowledged_by (user_id of who first acknowledged the SOS)
- acknowledged_at (timestamp of acknowledgement)
- resolved_by (user_id of who marked the SOS as resolved)
- resolved_at (timestamp of resolution)
- resolution_notes (notes on how the emergency was resolved)
- created_at (timestamp of event creation)
- updated_at (timestamp of last event update)

**SOSStatus**
- status_id (unique identifier for the SOS status type)
- status_name (name: Active / Acknowledged / Resolved / False Alarm)
- status_description (description of the SOS status meaning)

**EmergencyService**
- service_id (unique identifier for the emergency service)
- service_name (name of the emergency service: Ambulance / Police / Fire)
- service_phone (contact phone number for the service)
- service_type (type: Medical / Police / Fire / General)
- region (geographical region the service covers)
- is_active (whether the service is currently operational)

---

### 8. AI Chat and Voice Module

**ChatSession**
- chat_id (unique identifier for the chat session)
- user_id (reference to the user who initiated the chat)
- language (language used in this chat session: en / hi / ta / kn / ml / te)
- session_start (timestamp when the chat session began)
- session_end (timestamp when the chat session ended)
- message_count (total number of messages in the session)
- model_used (AI model used: meta/llama-3.1-8b-instruct)
- emergency_detected (whether an emergency keyword was detected in this session)
- created_at (timestamp of session creation)

**ChatMessage**
- message_id (unique identifier for the individual message)
- chat_id (reference to the chat session this message belongs to)
- role (message sender role: user / assistant / system)
- text (full text content of the message)
- sources (array of data source citations used in the AI response)
- rag_context_used (whether RAG pipeline context was used for this response)
- data_sources_queried (array of data sources queried: WHO_EML / OpenFDA / ICD11 / RxNorm / DataGovIn / MedlinePlus)
- response_time_ms (time taken to generate the response in milliseconds)
- emergency_flag (whether this message contained emergency keywords)
- timestamp (timestamp when the message was created)

**VoiceSession**
- voice_id (unique identifier for the voice session)
- user_id (reference to the user)
- language (language spoken: en / hi / ta / kn / ml / te)
- transcription (text transcribed from the voice input via Whisper API)
- ai_response (text response generated by the AI)
- model_used (AI model used: openai/gpt-oss-120b)
- audio_duration_seconds (duration of the voice input in seconds)
- whisper_confidence (transcription confidence score 0.0–1.0)
- emergency_flag (whether emergency keywords were detected in the transcription)
- timestamp (timestamp of the voice interaction)

**RAGQueryLog**
- query_log_id (unique identifier for the RAG query log entry)
- chat_id (reference to the associated chat session)
- message_id (reference to the associated chat message)
- query_text (the medical query submitted to the RAG pipeline)
- sources_queried (array of data sources that were queried)
- sources_responded (array of data sources that returned results)
- eml_results_count (number of results from WHO EML lookup)
- openfda_results_count (number of results from OpenFDA API)
- icd11_results_count (number of results from WHO ICD-11 API)
- rxnorm_results_count (number of results from RxNorm API)
- total_context_tokens (total token count of retrieved context)
- query_duration_ms (total time for RAG retrieval in milliseconds)
- cache_hit (whether the result was served from Redis cache)
- timestamp (timestamp of the RAG query)

---

### 9. Notification Engine Module

**Notification**
- notification_id (unique identifier for the notification)
- recipient_id (reference to the user who receives the notification)
- sender_id (reference to the user or system that triggered the notification)
- channel (delivery channel: push / sms / whatsapp / ivr / email)
- type (notification type: medicine_reminder / appointment / sos / alert / system)
- title (notification title or heading)
- message (full notification content text)
- priority (notification priority: low / medium / high / critical)
- sent_at (timestamp when the notification was sent)
- delivered_at (timestamp when the notification was delivered)
- read_at (timestamp when the notification was read by the recipient)
- is_delivered (whether delivery has been confirmed)
- is_read (whether the notification has been read)
- retry_count (number of delivery retry attempts)
- created_at (timestamp of notification creation)

**NotificationChannel**
- channel_id (unique identifier for the notification channel)
- channel_name (name: Push / SMS / WhatsApp / IVR / Email)
- channel_description (description of the channel)
- api_provider (third-party API provider: Firebase / Twilio / MSG91 / WhatsApp Business)
- is_active (whether the channel is currently operational)
- rate_limit_per_minute (rate limit for this channel)

**NotificationPreference**
- preference_id (unique identifier for the notification preference)
- user_id (reference to the user)
- medicine_reminder_channel (preferred channel for medicine reminders)
- appointment_channel (preferred channel for appointment notifications)
- emergency_channel (preferred channel for emergency alerts)
- marketing_channel (preferred channel for health tips and marketing)
- quiet_hours_start (start time of quiet hours: no notifications)
- quiet_hours_end (end time of quiet hours)
- is_enabled (global notification on/off toggle)

---

### 10. Alert Management Module

**Alert**
- alert_id (unique identifier for the alert)
- type (alert type: Emergency / Missed Medicine / Warning / System / Appointment)
- severity (alert severity: Low / Medium / High / Critical)
- patient_id (reference to the patient this alert concerns)
- patient_name (name of the patient for display purposes)
- symptom (symptom or event description that triggered the alert)
- status (alert status: unread / read / Resolved / Dismissed)
- assigned_to (user_id of the doctor or caregiver assigned to handle this alert)
- resolved_by (user_id of who resolved the alert)
- resolved_at (timestamp of alert resolution)
- resolution_notes (notes on how the alert was resolved)
- time (timestamp when the alert event occurred)
- created_at (timestamp of alert creation)
- updated_at (timestamp of last alert update)
- deleted (soft delete flag)

**AlertType**
- type_id (unique identifier for the alert type)
- type_name (name: Emergency / Missed Medicine / Warning / System / Appointment)
- type_description (description of what triggers this alert type)
- default_severity (default severity level for this alert type)
- auto_notify (whether this alert type automatically triggers notifications)

**AlertSeverity**
- severity_id (unique identifier for the severity level)
- severity_name (name: Low / Medium / High / Critical)
- severity_level (numeric level: 1=Low, 2=Medium, 3=High, 4=Critical)
- response_time_minutes (expected response time in minutes)

---

### 11. Reports and Analytics Module

**HealthReport**
- report_id (unique identifier for the report)
- patient_id (reference to the patient)
- type (report type: Health Summary / Lab Results / Adherence Report / Prescription History)
- data (arbitrary JSON payload containing the report data)
- generated_by (user_id of who generated the report: system / doctor / admin)
- date_range_start (start date of the reporting period)
- date_range_end (end date of the reporting period)
- generated_at (timestamp of report generation)
- created_at (timestamp of record creation)
- updated_at (timestamp of last update)
- deleted (soft delete flag)

**AdherenceReport**
- adherence_report_id (unique identifier for the adherence report)
- patient_id (reference to the patient)
- period_start (start date of the adherence tracking period)
- period_end (end date of the adherence tracking period)
- total_scheduled (total number of medicine doses scheduled)
- total_taken (total number of medicine doses taken)
- total_missed (total number of medicine doses missed)
- adherence_percentage (calculated adherence percentage)
- medicine_breakdown (JSON object with per-medicine adherence breakdown)
- generated_at (timestamp of report generation)

**ReportType**
- type_id (unique identifier for the report type)
- type_name (name: Health Summary / Lab Results / Adherence Report / Prescription History)
- type_description (description of the report type)
- available_for_roles (array of roles that can access this report type)

---

### 12. Audit and Compliance Module

**AuditLog**
- audit_id (unique identifier for the audit log entry)
- record_type (type of record: medical_record / consent / prescription / access_log)
- record_id (identifier of the source record being audited)
- actor_id (user_id of the user who performed the audited action)
- action (action performed: create / read / update / delete / verify)
- data_hash (SHA-256 hash of the record data for integrity verification)
- previous_hash (hash of the previous audit log entry — blockchain-style chaining)
- block_hash (combined hash of this block for immutability verification)
- block_index (sequential index of this block in the audit chain)
- metadata (additional JSON metadata about the audited action)
- ip_address (IP address from which the action was performed)
- timestamp (timestamp of the audited action)
- verified (whether the block hash has been verified as intact)

**ConsentRecord**
- consent_id (unique identifier for the consent record)
- patient_id (reference to the patient granting consent)
- consent_type (type: data_sharing / treatment / research / emergency_access)
- granted_to (entity receiving consent: doctor_id / organization / system)
- details (full text description of what consent covers)
- consent_hash (SHA-256 hash of the consent data for verification)
- is_active (whether the consent is currently active)
- granted_at (timestamp when consent was granted)
- expires_at (timestamp when consent expires)
- revoked_at (timestamp when consent was revoked, if applicable)
- revoked_by (user_id of who revoked the consent)
- timestamp (timestamp of the consent record)
- verified (whether the consent hash has been verified)

**DataAccessLog**
- access_log_id (unique identifier for the data access log entry)
- accessor_id (user_id of the user who accessed the data)
- accessor_role (role of the user: patient / doctor / caregiver / admin)
- patient_id (reference to the patient whose data was accessed)
- data_type (type of data accessed: profile / medicine / appointment / report / chat)
- access_type (type of access: view / edit / export / delete)
- purpose (purpose of data access: treatment / monitoring / administration / audit)
- timestamp (timestamp of the data access)
- ip_address (IP address from which the access occurred)

---

### 13. System Configuration Module

**SystemSetting**
- setting_id (unique identifier for the system setting)
- setting_key (unique key name of the setting)
- setting_value (value of the setting)
- setting_type (data type: string / number / boolean / json)
- category (setting category: general / security / notification / ai / display)
- description (description of what the setting controls)
- is_editable (whether the setting can be edited by admin)
- updated_by (user_id of who last updated this setting)
- updated_at (timestamp of last update)

**LanguageLocale**
- locale_id (unique identifier for the language locale)
- language_code (ISO language code: en / hi / ta / kn / ml / te)
- language_name (full name: English / Hindi / Tamil / Kannada / Malayalam / Telugu)
- native_name (name in native script: English / हिन्दी / தமிழ் / ಕನ್ನಡ / മലയാളം / తెలుగు)
- locale_file_path (path to the JSON locale file: src/locales/en.json)
- is_active (whether the language is currently enabled)
- is_default (whether this is the default language)

**APIConfiguration**
- api_config_id (unique identifier for the API configuration)
- api_name (name: OpenFDA / WHO_ICD11 / RxNorm / DataGovIn / MedlinePlus / NVIDIA_NIM)
- base_url (base URL of the external API)
- auth_type (authentication type: none / api_key / oauth2 / bearer)
- rate_limit_per_minute (rate limit for the API)
- timeout_seconds (request timeout in seconds)
- is_active (whether the API integration is currently active)
- last_health_check (timestamp of the last successful health check)
- cache_ttl_seconds (time-to-live for cached responses in seconds)

---

## ❖ Relationships Between Entities

### User Management Module:
- UserRole ────────────────→ User
                          1 to M (one role can be assigned to many users)
- User ────────────────→ UserPreference
                          1 to 1 (each user has one preference record)
- User ────────────────→ SessionLog
                          1 to M (one user can have many login sessions)
- AccountStatus ────────────────→ User
                          1 to M (one status applies to many user accounts)

### Patient Health Profile Module:
- User ────────────────→ PatientProfile
                          1 to 1 (each patient user has one patient profile)
- PatientProfile ────────────────→ EmergencyContact
                          1 to M (one patient can have many emergency contacts)
- BloodGroup ────────────────→ PatientProfile
                          1 to M (one blood group applies to many patients)
- PatientStatus ────────────────→ PatientProfile
                          1 to M (one status applies to many patients)
- PatientProfile ────────────────→ DoctorProfile
                          M to 1 (many patients can be assigned to one doctor)
- PatientProfile ────────────────→ CaregiverProfile
                          M to 1 (many patients can be assigned to one caregiver)

### Doctor Professional Module:
- User ────────────────→ DoctorProfile
                          1 to 1 (each doctor user has one doctor profile)
- Specialization ────────────────→ DoctorProfile
                          1 to M (one specialization applies to many doctors)
- DoctorProfile ────────────────→ ClinicalNote
                          1 to M (one doctor writes many clinical notes)
- PatientProfile ────────────────→ ClinicalNote
                          1 to M (one patient has many clinical notes)

### Caregiver Monitoring Module:
- User ────────────────→ CaregiverProfile
                          1 to 1 (each caregiver user has one caregiver profile)
- CaregiverProfile ────────────────→ PatientProfile
                          M to M (CaregiverPatientMapping)
  (many caregivers can monitor many patients via the mapping table)
- CaregiverRelationshipType ────────────────→ CaregiverPatientMapping
                          1 to M (one relationship type applies to many mappings)

### Medicine Management Module:
- PatientProfile ────────────────→ MedicineSchedule
                          1 to M (one patient has many medicine schedules)
- MedicineSchedule ────────────────→ MedicineLog
                          1 to M (one schedule generates many log entries)
- DoctorProfile ────────────────→ MedicineSchedule
                          1 to M (one doctor prescribes many medicine schedules)
- MedicineCategory ────────────────→ WHOEssentialMedicine
                          1 to M (one category contains many medicines)

### Appointment Booking Module:
- PatientProfile ────────────────→ Appointment
                          1 to M (one patient books many appointments)
- DoctorProfile ────────────────→ Appointment
                          1 to M (one doctor receives many appointments)
- AppointmentStatus ────────────────→ Appointment
                          1 to M (one status applies to many appointments)
- DoctorProfile ────────────────→ AppointmentSlot
                          1 to M (one doctor has many availability slots)
- Appointment ────────────────→ ClinicalNote
                          1 to 1 (each appointment may have one clinical note)

### Emergency SOS Module:
- PatientProfile ────────────────→ SOSEvent
                          1 to M (one patient can trigger many SOS events)
- SOSEvent ────────────────→ SOSNotification
                          1 to M (one SOS event sends many notifications)
- SOSStatus ────────────────→ SOSEvent
                          1 to M (one status applies to many SOS events)

### AI Chat and Voice Module:
- User ────────────────→ ChatSession
                          1 to M (one user has many chat sessions)
- ChatSession ────────────────→ ChatMessage
                          1 to M (one session contains many messages)
- User ────────────────→ VoiceSession
                          1 to M (one user has many voice sessions)
- ChatMessage ────────────────→ RAGQueryLog
                          1 to 1 (each AI response has one RAG query log)

### Notification Engine Module:
- User ────────────────→ Notification
                          1 to M (one user receives many notifications)
- NotificationChannel ────────────────→ Notification
                          1 to M (one channel delivers many notifications)
- User ────────────────→ NotificationPreference
                          1 to 1 (each user has one notification preference)

### Alert Management Module:
- PatientProfile ────────────────→ Alert
                          1 to M (one patient can have many alerts)
- AlertType ────────────────→ Alert
                          1 to M (one type applies to many alerts)
- AlertSeverity ────────────────→ Alert
                          1 to M (one severity applies to many alerts)

### Reports and Analytics Module:
- PatientProfile ────────────────→ HealthReport
                          1 to M (one patient has many health reports)
- PatientProfile ────────────────→ AdherenceReport
                          1 to M (one patient has many adherence reports)
- ReportType ────────────────→ HealthReport
                          1 to M (one type applies to many reports)

### Audit and Compliance Module:
- User ────────────────→ AuditLog
                          1 to M (one user generates many audit log entries)
- PatientProfile ────────────────→ ConsentRecord
                          1 to M (one patient grants many consent records)
- User ────────────────→ DataAccessLog
                          1 to M (one user generates many data access log entries)
- AuditLog ────────────────→ AuditLog
                          1 to 1 (each audit log references the previous log — blockchain chain)

### Cross-Module Relationships:
- Alert ────────────────→ Notification
                          1 to M (one alert can trigger many notifications)
- SOSEvent ────────────────→ Alert
                          1 to 1 (each SOS event generates one critical alert)
- MedicineLog (missed) ────────────────→ Alert
                          1 to 1 (each missed dose generates one alert)
- Appointment ────────────────→ Notification
                          1 to M (appointment events trigger notifications)

### Note:
- 1 to M      (One to Many)
- M to M      (Many to Many — junction/mapping table mentioned beside relationship)
- 1 to 1      (One to One)
- ────→       represents a relationship between two entities

---

## ❖ DATABASE DESIGN

### Database Type: Google Cloud Firestore (NoSQL Document Database)

Firestore organises data into **collections** (equivalent to tables) and **documents**
(equivalent to rows). Each document contains **fields** (equivalent to columns) that can
hold primitive values, arrays, maps (nested objects), and references to other documents.

---

### 1. User Management Collections

#### Collection: `users`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| user_id (document ID) | String | PK, Auto-generated / Firebase UID | Unique identifier for the user |
| email | String | Required, Unique, Indexed | Registered email address |
| display_name | String | Required, Min length 1 | Full display name |
| role | String | Required, Enum [patient, doctor, caregiver, admin] | User role |
| phone | String | Optional | Contact phone number with country code |
| language_preference | String | Default: 'en', Enum [en, hi, ta, kn, ml, te] | Preferred UI language |
| profile_photo_url | String | Optional | URL of profile picture |
| is_active | Boolean | Default: true | Whether account is active |
| email_verified | Boolean | Default: false | Whether email is verified |
| created_at | Timestamp | Auto-set on creation | Account creation timestamp |
| updated_at | Timestamp | Auto-set on modification | Last update timestamp |
| last_login | Timestamp | Auto-set on login | Last login timestamp |
| deleted | Boolean | Default: false | Soft delete flag |
| deleted_at | Timestamp | Nullable | Soft deletion timestamp |

#### Collection: `user_roles`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| role_id (document ID) | String | PK, Auto-generated | Unique role identifier |
| role_name | String | Required, Unique | Role name |
| role_description | String | Optional | Role description |
| access_level | Number | Required, Range [1-4] | Numeric access level |
| is_active | Boolean | Default: true | Whether role is assignable |

#### Collection: `user_preferences`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| preference_id (document ID) | String | PK, Same as user_id | Unique preference identifier |
| user_id | String | Required, FK → users | Reference to user |
| font_size | String | Default: 'medium', Enum [small, medium, large, extra-large] | Preferred font size |
| high_contrast_mode | Boolean | Default: false | High-contrast mode toggle |
| notification_sound | Boolean | Default: true | Sound toggle |
| theme | String | Default: 'light', Enum [light, dark, system] | UI theme |
| timezone | String | Default: 'Asia/Kolkata' | User timezone |

#### Collection: `session_logs`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| session_id (document ID) | String | PK, Auto-generated | Unique session identifier |
| user_id | String | Required, FK → users, Indexed | Reference to user |
| login_timestamp | Timestamp | Required | Login date and time |
| logout_timestamp | Timestamp | Nullable | Logout date and time |
| device_info | String | Optional | Browser or device string |
| ip_address | String | Optional | Login IP address |
| session_duration | Number | Optional | Duration in seconds |

---

### 2. Patient Health Profile Collections

#### Collection: `patients`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| patient_id (document ID) | String | PK, FK → users.user_id | Same as user_id |
| age | Number | Optional, Range [0-150] | Patient's age |
| gender | String | Required, Enum [Male, Female, Other] | Patient's gender |
| date_of_birth | Timestamp | Optional | Date of birth |
| blood_group | String | Optional, Enum [A+, A-, B+, B-, AB+, AB-, O+, O-] | Blood group |
| height_cm | Number | Optional | Height in centimetres |
| weight_kg | Number | Optional | Weight in kilograms |
| phone | String | Required | Contact phone number |
| address | String | Optional | Residential address |
| condition | String | Required | Primary medical condition |
| allergies | Array of String | Optional | Known allergies |
| chronic_conditions | Array of String | Optional | Chronic conditions |
| assigned_doctor_id | String | Optional, FK → doctors | Assigned doctor |
| assigned_caregiver_id | String | Optional, FK → caregivers | Assigned caregiver |
| health_score | Number | Default: 0, Range [0-100] | Calculated health score |
| adherence | Number | Default: 0, Range [0-100] | Medicine adherence % |
| status | String | Default: 'Active', Enum [Active, Stable, Needs Attention, Critical] | Patient status |
| last_alert | Timestamp | Nullable | Last alert timestamp |
| last_checkup | Timestamp | Nullable | Last checkup timestamp |
| insurance_id | String | Optional | Insurance identifier |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Sub-Collection: `patients/{patient_id}/emergency_contacts`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| contact_id (document ID) | String | PK, Auto-generated | Unique contact identifier |
| contact_name | String | Required | Emergency contact name |
| contact_phone | String | Required | Emergency contact phone |
| relationship | String | Required, Enum [Spouse, Parent, Child, Sibling, Other] | Relationship to patient |
| is_primary | Boolean | Default: false | Primary contact flag |
| created_at | Timestamp | Auto-set | Creation timestamp |

---

### 3. Doctor Professional Collections

#### Collection: `doctors`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| doctor_id (document ID) | String | PK, FK → users.user_id | Same as user_id |
| name | String | Required, Min length 1 | Doctor's full name |
| specialization | String | Required | Medical specialization |
| hospital | String | Required | Affiliated hospital |
| experience_years | Number | Optional, Range [0-60] | Years of experience |
| qualification | String | Optional | Medical qualifications |
| license_number | String | Optional, Unique | Medical license number |
| consultation_fee | Number | Optional | Fee amount |
| currency | String | Default: 'INR' | Fee currency |
| total_appointments | Number | Default: 0 | Cumulative appointments |
| total_emergencies | Number | Default: 0 | Cumulative emergencies |
| available_days | Array of String | Optional | Available days |
| available_hours_start | String | Optional | Availability start time |
| available_hours_end | String | Optional | Availability end time |
| max_patients_per_day | Number | Default: 20 | Max patients per day |
| rating | Number | Default: 0.0, Range [0.0-5.0] | Average rating |
| is_accepting_patients | Boolean | Default: true | Accepting new patients |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Collection: `clinical_notes`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| note_id (document ID) | String | PK, Auto-generated | Unique note identifier |
| doctor_id | String | Required, FK → doctors, Indexed | Authoring doctor |
| patient_id | String | Required, FK → patients, Indexed | Subject patient |
| appointment_id | String | Optional, FK → appointments | Related appointment |
| note_content | String | Required | Full clinical note text |
| diagnosis_codes | Array of String | Optional | WHO ICD-11 codes |
| prescriptions | Array of Map | Optional | Prescribed medicines |
| follow_up_date | Timestamp | Optional | Recommended follow-up |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Collection: `appointment_slots`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| slot_id (document ID) | String | PK, Auto-generated | Unique slot identifier |
| doctor_id | String | Required, FK → doctors, Indexed | Doctor reference |
| date | String | Required, Format: YYYY-MM-DD | Slot date |
| start_time | String | Required | Slot start time |
| end_time | String | Required | Slot end time |
| is_booked | Boolean | Default: false | Whether slot is booked |
| booked_by_patient_id | String | Nullable, FK → patients | Patient who booked |

---

### 4. Caregiver Monitoring Collections

#### Collection: `caregivers`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| caregiver_id (document ID) | String | PK, FK → users.user_id | Same as user_id |
| phone | String | Optional | Contact phone |
| address | String | Optional | Residential address |
| relationship_to_patient | String | Optional | Default relationship |
| total_patients_assigned | Number | Default: 0 | Assigned patients count |
| alert_preference_channel | String | Default: 'push', Enum [push, sms, whatsapp] | Preferred alert channel |
| is_available | Boolean | Default: true | Availability status |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Collection: `caregiver_patient_mappings`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| mapping_id (document ID) | String | PK, Auto-generated | Unique mapping identifier |
| caregiver_id | String | Required, FK → caregivers, Indexed | Caregiver reference |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| relationship | String | Required | Relationship to patient |
| assigned_date | Timestamp | Required | Assignment date |
| is_active | Boolean | Default: true | Whether assignment is active |
| alert_enabled | Boolean | Default: true | Whether alerts are enabled |
| created_at | Timestamp | Auto-set | Creation timestamp |

---

### 5. Medicine Management Collections

#### Collection: `medicines`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| medicine_id (document ID) | String | PK, Auto-generated | Unique medicine identifier |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| name | String | Required, Min length 1 | Medicine name |
| dosage | String | Required | Dosage: 500mg, 10ml |
| frequency | String | Required | Frequency description |
| schedule_slots | Array of String | Optional | morning / afternoon / evening / night |
| reminder_times | Array of String | Default: [] | Specific reminder times |
| start_date | String | Optional | Schedule start date |
| end_date | String | Optional | Schedule end date |
| prescribing_doctor_id | String | Optional, FK → doctors | Prescribing doctor |
| instructions | String | Optional | Special instructions |
| is_active | Boolean | Default: true | Whether schedule is active |
| notes | String | Optional | Additional notes |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Collection: `medicine_logs`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| log_id (document ID) | String | PK, Auto-generated | Unique log identifier |
| medicine_id | String | Required, FK → medicines, Indexed | Medicine reference |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| status | String | Required, Enum [taken, missed] | Dose status |
| slot | String | Required, Enum [morning, afternoon, evening, night] | Time slot |
| scheduled_time | String | Optional | Scheduled dose time |
| actual_time | String | Optional | Actual taken time |
| logged_by | String | Optional, FK → users | Who logged the event |
| timestamp | Timestamp | Required | Event timestamp |
| notes | String | Optional | Notes about the dose |

#### Collection: `who_essential_medicines`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| eml_id (document ID) | String | PK, Auto-generated | Unique EML identifier |
| medicine_name | String | Required, Indexed | WHO EML medicine name |
| generic_name | String | Required | Generic / INN name |
| atc_code | String | Optional | ATC classification code |
| category | String | Required | WHO therapeutic category |
| formulation | String | Optional | Formulation type |
| dosage_forms | Array of String | Optional | Available dosage forms |
| indications | String | Optional | Clinical indications |
| who_section | String | Optional | WHO EML section reference |
| is_core_list | Boolean | Default: true | Core list membership |

---

### 6. Appointment Booking Collections

#### Collection: `appointments`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| appointment_id (document ID) | String | PK, Auto-generated | Unique appointment identifier |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| patient_name | String | Required | Patient display name |
| doctor_id | String | Required, FK → doctors, Indexed | Doctor reference |
| doctor_name | String | Required | Doctor display name |
| date | String | Required, Format: YYYY-MM-DD | Appointment date |
| time | String | Required | Appointment time |
| duration_minutes | Number | Default: 30 | Expected duration |
| reason | String | Optional | Reason for visit |
| status | String | Default: 'Scheduled', Enum [Scheduled, Confirmed, Completed, Missed, Cancelled] | Status |
| cancellation_reason | String | Optional | Reason if cancelled |
| cancelled_by | String | Optional, FK → users | Who cancelled |
| notes | String | Optional | Post-visit clinical notes |
| follow_up_required | Boolean | Default: false | Follow-up needed |
| follow_up_date | String | Optional | Recommended follow-up date |
| created_at | Timestamp | Auto-set | Booking timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Collection: `appointment_policies`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| policy_id (document ID) | String | PK, Auto-generated | Unique policy identifier |
| policy_name | String | Required | Policy name |
| policy_description | String | Optional | Policy description |
| advance_booking_days | Number | Default: 30 | Max advance booking days |
| cancellation_window_hours | Number | Default: 24 | Cancellation window |
| max_appointments_per_day | Number | Default: 3 | Max bookings per day |
| is_active | Boolean | Default: true | Whether enforced |

---

### 7. Emergency SOS Collections

#### Collection: `sos_events`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| sos_id (document ID) | String | PK, Auto-generated | Unique SOS identifier |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| timestamp | Timestamp | Required | SOS trigger time |
| location_latitude | Number | Optional | GPS latitude |
| location_longitude | Number | Optional | GPS longitude |
| location_address | String | Optional | Reverse-geocoded address |
| status | String | Default: 'Active', Enum [Active, Acknowledged, Resolved, False Alarm] | SOS status |
| severity | String | Default: 'Critical', Enum [Low, Medium, High, Critical] | Severity |
| description | String | Optional | Emergency description |
| notified_contacts | Array of String | Default: [] | Notified user IDs |
| notified_doctors | Array of String | Default: [] | Notified doctor IDs |
| acknowledged_by | String | Optional, FK → users | Who acknowledged |
| acknowledged_at | Timestamp | Optional | Acknowledgement time |
| resolved_by | String | Optional, FK → users | Who resolved |
| resolved_at | Timestamp | Optional | Resolution time |
| resolution_notes | String | Optional | Resolution notes |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |

---

### 8. AI Chat and Voice Collections

#### Collection: `chats`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| chat_id (document ID) | String | PK, Auto-generated | Unique chat session identifier |
| user_id | String | Required, FK → users, Indexed | User reference |
| language | String | Required, Enum [en, hi, ta, kn, ml, te] | Session language |
| session_start | Timestamp | Required | Session start time |
| session_end | Timestamp | Optional | Session end time |
| message_count | Number | Default: 0 | Total messages |
| model_used | String | Default: 'meta/llama-3.1-8b-instruct' | AI model |
| emergency_detected | Boolean | Default: false | Emergency detected |
| created_at | Timestamp | Auto-set | Creation timestamp |

#### Sub-Collection: `chats/{chat_id}/messages`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| message_id (document ID) | String | PK, Auto-generated | Unique message identifier |
| role | String | Required, Enum [user, assistant, system] | Sender role |
| text | String | Required | Message text content |
| sources | Array of String | Optional | Data source citations |
| rag_context_used | Boolean | Default: false | RAG context flag |
| data_sources_queried | Array of String | Optional | Queried data sources |
| response_time_ms | Number | Optional | Response generation time |
| emergency_flag | Boolean | Default: false | Emergency keyword flag |
| timestamp | Timestamp | Required | Message timestamp |

#### Collection: `voice_sessions`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| voice_id (document ID) | String | PK, Auto-generated | Unique voice session identifier |
| user_id | String | Required, FK → users, Indexed | User reference |
| language | String | Required, Enum [en, hi, ta, kn, ml, te] | Spoken language |
| transcription | String | Required | Whisper transcription |
| ai_response | String | Required | AI-generated response |
| model_used | String | Default: 'openai/gpt-oss-120b' | AI model used |
| audio_duration_seconds | Number | Optional | Voice input duration |
| whisper_confidence | Number | Optional, Range [0.0-1.0] | Transcription confidence |
| emergency_flag | Boolean | Default: false | Emergency keyword flag |
| timestamp | Timestamp | Required | Interaction timestamp |

#### Collection: `rag_query_logs`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| query_log_id (document ID) | String | PK, Auto-generated | Unique log identifier |
| chat_id | String | Optional, FK → chats | Related chat session |
| message_id | String | Optional | Related message |
| query_text | String | Required | Medical query text |
| sources_queried | Array of String | Required | Sources queried |
| sources_responded | Array of String | Optional | Sources that returned results |
| eml_results_count | Number | Default: 0 | WHO EML results |
| openfda_results_count | Number | Default: 0 | OpenFDA results |
| icd11_results_count | Number | Default: 0 | ICD-11 results |
| rxnorm_results_count | Number | Default: 0 | RxNorm results |
| total_context_tokens | Number | Default: 0 | Context token count |
| query_duration_ms | Number | Required | RAG retrieval time |
| cache_hit | Boolean | Default: false | Redis cache hit |
| timestamp | Timestamp | Required | Query timestamp |

---

### 9. Notification Engine Collections

#### Collection: `notifications`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| notification_id (document ID) | String | PK, Auto-generated | Unique notification identifier |
| recipient_id | String | Required, FK → users, Indexed | Notification recipient |
| sender_id | String | Optional, FK → users | Notification sender |
| channel | String | Required, Enum [push, sms, whatsapp, ivr, email] | Delivery channel |
| type | String | Required, Enum [medicine_reminder, appointment, sos, alert, system] | Notification type |
| title | String | Required | Notification title |
| message | String | Required | Notification content |
| priority | String | Default: 'medium', Enum [low, medium, high, critical] | Priority level |
| sent_at | Timestamp | Optional | Sent timestamp |
| delivered_at | Timestamp | Optional | Delivery timestamp |
| read_at | Timestamp | Optional | Read timestamp |
| is_delivered | Boolean | Default: false | Delivery confirmation |
| is_read | Boolean | Default: false | Read status |
| retry_count | Number | Default: 0 | Retry attempts |
| created_at | Timestamp | Auto-set | Creation timestamp |

#### Collection: `notification_preferences`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| preference_id (document ID) | String | PK, Same as user_id | Unique preference identifier |
| user_id | String | Required, FK → users | User reference |
| medicine_reminder_channel | String | Default: 'push' | Medicine reminder channel |
| appointment_channel | String | Default: 'push' | Appointment channel |
| emergency_channel | String | Default: 'push' | Emergency channel |
| marketing_channel | String | Default: 'push' | Health tips channel |
| quiet_hours_start | String | Optional | Quiet hours start |
| quiet_hours_end | String | Optional | Quiet hours end |
| is_enabled | Boolean | Default: true | Global toggle |

---

### 10. Alert Management Collections

#### Collection: `alerts`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| alert_id (document ID) | String | PK, Auto-generated | Unique alert identifier |
| type | String | Required, Enum [Emergency, Missed Medicine, Warning, System, Appointment] | Alert type |
| severity | String | Default: 'Medium', Enum [Low, Medium, High, Critical] | Severity level |
| patient_id | String | Optional, FK → patients, Indexed | Patient reference |
| patient_name | String | Required | Patient display name |
| symptom | String | Required | Alert description |
| status | String | Default: 'unread', Enum [unread, read, Resolved, Dismissed] | Alert status |
| assigned_to | String | Optional, FK → users | Assigned handler |
| resolved_by | String | Optional, FK → users | Who resolved |
| resolved_at | Timestamp | Optional | Resolution timestamp |
| resolution_notes | String | Optional | Resolution notes |
| time | String | Optional | Event time |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

---

### 11. Reports and Analytics Collections

#### Collection: `reports`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| report_id (document ID) | String | PK, Auto-generated | Unique report identifier |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| type | String | Required, Enum [Health Summary, Lab Results, Adherence Report, Prescription History] | Report type |
| data | Map (JSON) | Optional | Report payload |
| generated_by | String | Optional, FK → users | Who generated |
| date_range_start | String | Optional | Reporting period start |
| date_range_end | String | Optional | Reporting period end |
| generated_at | Timestamp | Optional | Generation timestamp |
| created_at | Timestamp | Auto-set | Creation timestamp |
| updated_at | Timestamp | Auto-set | Last update timestamp |
| deleted | Boolean | Default: false | Soft delete flag |

#### Collection: `adherence_reports`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| adherence_report_id (document ID) | String | PK, Auto-generated | Unique report identifier |
| patient_id | String | Required, FK → patients, Indexed | Patient reference |
| period_start | Timestamp | Required | Tracking period start |
| period_end | Timestamp | Required | Tracking period end |
| total_scheduled | Number | Required | Total doses scheduled |
| total_taken | Number | Required | Total doses taken |
| total_missed | Number | Required | Total doses missed |
| adherence_percentage | Number | Required, Range [0-100] | Adherence % |
| medicine_breakdown | Map (JSON) | Optional | Per-medicine breakdown |
| generated_at | Timestamp | Auto-set | Generation timestamp |

---

### 12. Audit and Compliance Collections

#### Collection: `audit_logs`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| audit_id (document ID) | String | PK, Auto-generated | Unique audit identifier |
| record_type | String | Required, Enum [medical_record, consent, prescription, access_log] | Record type |
| record_id | String | Required | Source record ID |
| actor_id | String | Required, FK → users, Indexed | Acting user |
| action | String | Required, Enum [create, read, update, delete, verify] | Action performed |
| data_hash | String | Optional | SHA-256 data hash |
| previous_hash | String | Optional | Previous block hash |
| block_hash | String | Required | This block's hash |
| block_index | Number | Required | Sequential index |
| metadata | Map (JSON) | Optional | Additional metadata |
| ip_address | String | Optional | Actor IP address |
| timestamp | Timestamp | Required | Action timestamp |
| verified | Boolean | Default: true | Integrity verification |

#### Collection: `consent_records`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| consent_id (document ID) | String | PK, Auto-generated | Unique consent identifier |
| patient_id | String | Required, FK → patients, Indexed | Granting patient |
| consent_type | String | Required, Enum [data_sharing, treatment, research, emergency_access] | Consent type |
| granted_to | String | Required | Entity receiving consent |
| details | String | Optional | Consent details |
| consent_hash | String | Required | SHA-256 consent hash |
| is_active | Boolean | Default: true | Whether active |
| granted_at | Timestamp | Required | Grant timestamp |
| expires_at | Timestamp | Optional | Expiry timestamp |
| revoked_at | Timestamp | Optional | Revocation timestamp |
| revoked_by | String | Optional | Revoking user |
| timestamp | Timestamp | Required | Record timestamp |
| verified | Boolean | Default: true | Hash verification |

#### Collection: `data_access_logs`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| access_log_id (document ID) | String | PK, Auto-generated | Unique log identifier |
| accessor_id | String | Required, FK → users, Indexed | Accessing user |
| accessor_role | String | Required | Accessor's role |
| patient_id | String | Required, FK → patients | Accessed patient |
| data_type | String | Required, Enum [profile, medicine, appointment, report, chat] | Data type accessed |
| access_type | String | Required, Enum [view, edit, export, delete] | Type of access |
| purpose | String | Optional | Access purpose |
| timestamp | Timestamp | Required | Access timestamp |
| ip_address | String | Optional | Access IP address |

---

### 13. System Configuration Collections

#### Collection: `system_settings`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| setting_id (document ID) | String | PK, Setting key name | Unique setting identifier |
| setting_key | String | Required, Unique | Setting key |
| setting_value | String / Number / Boolean | Required | Setting value |
| setting_type | String | Required, Enum [string, number, boolean, json] | Value data type |
| category | String | Required | Setting category |
| description | String | Optional | Setting description |
| is_editable | Boolean | Default: true | Admin editable |
| updated_by | String | Optional, FK → users | Last updater |
| updated_at | Timestamp | Auto-set | Last update timestamp |

#### Collection: `language_locales`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| locale_id (document ID) | String | PK, Language code | Unique locale identifier |
| language_code | String | Required, Unique | ISO language code |
| language_name | String | Required | Language name in English |
| native_name | String | Required | Language name in native script |
| locale_file_path | String | Required | Path to locale JSON file |
| is_active | Boolean | Default: true | Whether enabled |
| is_default | Boolean | Default: false | Default language flag |

#### Collection: `api_configurations`

| Field | Data Type | Constraints | Description |
|---|---|---|---|
| api_config_id (document ID) | String | PK, Auto-generated | Unique config identifier |
| api_name | String | Required, Unique | External API name |
| base_url | String | Required | API base URL |
| auth_type | String | Required, Enum [none, api_key, oauth2, bearer] | Auth method |
| rate_limit_per_minute | Number | Required | Rate limit |
| timeout_seconds | Number | Default: 30 | Request timeout |
| is_active | Boolean | Default: true | Whether active |
| last_health_check | Timestamp | Optional | Last health check |
| cache_ttl_seconds | Number | Default: 3600 | Cache TTL |

---

## ❖ GENERATING COLLECTIONS — Firestore Security Rules

The following Firestore Security Rules govern access control for all collections based on
user role (RBAC). These rules enforce that only authenticated users can access data, and
that role-based restrictions are applied to all read and write operations.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Helper Functions ──────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isPatient() {
      return getUserRole() == 'patient';
    }

    function isDoctor() {
      return getUserRole() == 'doctor';
    }

    function isCaregiver() {
      return getUserRole() == 'caregiver';
    }

    function isAdmin() {
      return getUserRole() == 'admin';
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // ─── 1. Users Collection ───────────────────────────
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }

    // ─── 2. Patients Collection ────────────────────────
    match /patients/{patientId} {
      allow read: if isAuthenticated() && (
        isOwner(patientId) ||
        isDoctor() ||
        isCaregiver() ||
        isAdmin()
      );
      allow create: if isAuthenticated() && (isPatient() || isAdmin());
      allow update: if isAuthenticated() && (isOwner(patientId) || isDoctor() || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();

      match /emergency_contacts/{contactId} {
        allow read, write: if isAuthenticated() && (isOwner(patientId) || isAdmin());
      }
    }

    // ─── 3. Doctors Collection ─────────────────────────
    match /doctors/{doctorId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isDoctor() || isAdmin());
      allow update: if isAuthenticated() && (isOwner(doctorId) || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }

    // ─── 4. Caregivers Collection ──────────────────────
    match /caregivers/{caregiverId} {
      allow read: if isAuthenticated() && (isOwner(caregiverId) || isAdmin());
      allow create: if isAuthenticated() && (isCaregiver() || isAdmin());
      allow update: if isAuthenticated() && (isOwner(caregiverId) || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }

    // ─── 5. Medicines Collection ───────────────────────
    match /medicines/{medicineId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isPatient() || isDoctor() || isAdmin());
      allow update: if isAuthenticated() && (isPatient() || isDoctor() || isAdmin());
      allow delete: if isAuthenticated() && (isPatient() || isAdmin());
    }

    // ─── 6. Medicine Logs Collection ───────────────────
    match /medicine_logs/{logId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }

    // ─── 7. Appointments Collection ────────────────────
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isPatient() || isAdmin());
      allow update: if isAuthenticated() && (isPatient() || isDoctor() || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }

    // ─── 8. SOS Events Collection ──────────────────────
    match /sos_events/{sosId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isPatient();
      allow update: if isAuthenticated() && (isDoctor() || isCaregiver() || isAdmin());
    }

    // ─── 9. Chats Collection ───────────────────────────
    match /chats/{chatId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();

      match /messages/{messageId} {
        allow read, write: if isAuthenticated();
      }
    }

    // ─── 10. Alerts Collection ─────────────────────────
    match /alerts/{alertId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (isDoctor() || isCaregiver() || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }

    // ─── 11. Notifications Collection ──────────────────
    match /notifications/{notifId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
    }

    // ─── 12. Reports Collection ────────────────────────
    match /reports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isDoctor() || isAdmin());
      allow update: if isAuthenticated() && (isDoctor() || isAdmin());
      allow delete: if isAuthenticated() && isAdmin();
    }

    // ─── 13. Audit Logs Collection ─────────────────────
    match /audit_logs/{auditId} {
      allow read: if isAuthenticated() && isAdmin();
      allow create: if isAuthenticated();
      // Audit logs are immutable — no update or delete
    }

    // ─── 14. Consent Records Collection ────────────────
    match /consent_records/{consentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isPatient();
      allow update: if isAuthenticated() && isPatient();
    }

    // ─── 15. System Settings Collection ────────────────
    match /system_settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }

    // ─── 16. Language Locales Collection ───────────────
    match /language_locales/{localeId} {
      allow read: if true;  // Public read for language data
      allow write: if isAuthenticated() && isAdmin();
    }

    // ─── 17. API Configurations Collection ─────────────
    match /api_configurations/{configId} {
      allow read: if isAuthenticated() && isAdmin();
      allow write: if isAuthenticated() && isAdmin();
    }

    // ─── 18. WHO Essential Medicines Collection ────────
    match /who_essential_medicines/{emlId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }
  }
}
```

---

## ❖ COMPLETE COLLECTION SUMMARY

| # | Collection Name | Module | Document Count Estimate | Primary Index |
|---|---|---|---|---|
| 1 | `users` | User Management | Thousands | email, role |
| 2 | `user_roles` | User Management | 4 (static) | role_name |
| 3 | `user_preferences` | User Management | Thousands | user_id |
| 4 | `session_logs` | User Management | Tens of thousands | user_id, login_timestamp |
| 5 | `patients` | Patient Profile | Hundreds to thousands | assigned_doctor_id, status |
| 6 | `doctors` | Doctor Profile | Tens to hundreds | specialization, hospital |
| 7 | `caregivers` | Caregiver Profile | Tens to hundreds | is_available |
| 8 | `caregiver_patient_mappings` | Caregiver Monitoring | Hundreds | caregiver_id, patient_id |
| 9 | `clinical_notes` | Doctor Module | Thousands | doctor_id, patient_id |
| 10 | `medicines` | Medicine Management | Thousands | patient_id |
| 11 | `medicine_logs` | Medicine Management | Tens of thousands | patient_id, medicine_id, timestamp |
| 12 | `who_essential_medicines` | Medicine Management | 1,738 (WHO EML) | medicine_name, atc_code |
| 13 | `appointments` | Appointment Booking | Thousands | patient_id, doctor_id, date |
| 14 | `appointment_slots` | Appointment Booking | Thousands | doctor_id, date |
| 15 | `appointment_policies` | Appointment Booking | Few (static) | policy_name |
| 16 | `sos_events` | Emergency SOS | Hundreds | patient_id, status, timestamp |
| 17 | `chats` | AI Chat | Thousands | user_id |
| 18 | `voice_sessions` | AI Voice | Thousands | user_id |
| 19 | `rag_query_logs` | AI Pipeline | Tens of thousands | chat_id, timestamp |
| 20 | `notifications` | Notifications | Tens of thousands | recipient_id, type |
| 21 | `notification_preferences` | Notifications | Thousands | user_id |
| 22 | `alerts` | Alerts | Thousands | patient_id, type, status |
| 23 | `reports` | Reports | Thousands | patient_id, type |
| 24 | `adherence_reports` | Reports | Thousands | patient_id |
| 25 | `audit_logs` | Audit and Compliance | Tens of thousands | actor_id, record_type, timestamp |
| 26 | `consent_records` | Audit and Compliance | Hundreds | patient_id, consent_type |
| 27 | `data_access_logs` | Audit and Compliance | Tens of thousands | accessor_id, patient_id |
| 28 | `system_settings` | System Config | Tens (static) | setting_key |
| 29 | `language_locales` | System Config | 6 (static) | language_code |
| 30 | `api_configurations` | System Config | 6-10 (static) | api_name |

---

## ❖ FIRESTORE INDEX REQUIREMENTS

### Composite Indexes Required

| Collection | Fields | Query Purpose |
|---|---|---|
| `patients` | assigned_doctor_id ASC, status ASC | Doctor viewing their patients filtered by status |
| `patients` | assigned_caregiver_id ASC, status ASC | Caregiver viewing their patients filtered by status |
| `medicines` | patient_id ASC, is_active ASC | Active medicines for a patient |
| `medicine_logs` | patient_id ASC, timestamp DESC | Recent medicine logs for a patient |
| `medicine_logs` | medicine_id ASC, timestamp DESC | Logs for a specific medicine |
| `appointments` | patient_id ASC, date DESC | Patient's appointments sorted by date |
| `appointments` | doctor_id ASC, date ASC, status ASC | Doctor's appointments sorted by date and status |
| `sos_events` | patient_id ASC, timestamp DESC | SOS history for a patient |
| `sos_events` | status ASC, timestamp DESC | Active SOS events sorted by recency |
| `chats` | user_id ASC, session_start DESC | User's chat sessions sorted by recency |
| `alerts` | patient_id ASC, status ASC, created_at DESC | Patient alerts by status and recency |
| `alerts` | type ASC, status ASC, created_at DESC | Alerts by type and status |
| `notifications` | recipient_id ASC, is_read ASC, created_at DESC | Unread notifications for a user |
| `audit_logs` | actor_id ASC, timestamp DESC | Audit trail for a specific user |
| `audit_logs` | record_type ASC, timestamp DESC | Audit trail filtered by record type |

---

## ❖ DATA INTEGRITY AND BUSINESS RULES

### 1. Referential Integrity Rules
- Every `patient_id` in the `patients` collection MUST reference a valid document in `users` with role = 'patient'
- Every `doctor_id` in the `doctors` collection MUST reference a valid document in `users` with role = 'doctor'
- Every `caregiver_id` in the `caregivers` collection MUST reference a valid document in `users` with role = 'caregiver'
- Appointment `patient_id` and `doctor_id` MUST reference existing `patients` and `doctors` documents respectively

### 2. Soft Delete Rules
- All primary collections implement soft delete via the `deleted` Boolean field
- Soft-deleted documents are excluded from all list queries via `WHERE deleted == false`
- Hard delete is restricted to admin users and used only for GDPR data deletion requests

### 3. Timestamp Rules
- `created_at` is auto-set on document creation and MUST NOT be modified thereafter
- `updated_at` is auto-set on every document update
- All timestamps use ISO 8601 format in UTC timezone

### 4. Status Transition Rules
- **Appointment Status Flow:** Scheduled → Confirmed → Completed (terminal) OR Cancelled (terminal) at any stage
- **SOS Status Flow:** Active → Acknowledged → Resolved (terminal) OR False Alarm (terminal)
- **Alert Status Flow:** unread → read → Resolved (terminal) OR Dismissed (terminal)
- Terminal statuses MUST NOT transition to any other status

### 5. Data Validation Rules
- Email addresses MUST conform to RFC 5322 format
- Phone numbers MUST include country code prefix
- Age MUST be in range 0-150
- Adherence percentage MUST be in range 0-100
- Health score MUST be in range 0-100
- Rating MUST be in range 0.0-5.0

---

*End of Database Design Document — MedAssist AI v2.0.0*
