# MedAssist AI - Patient Database Design

## 1. Overview
This document defines the exact database architecture and schema for the **Patient Management Module**. It details the core `patients` entity and its deeply integrated sub-collections and references, including caregivers, consent records, clinical appointments, medications, and emergency alerts.

---

## 2. Entity-Relationship Diagram (ERD)

The following Mermaid ER Diagram maps out the exact structural relationships, keys, and cardinalities of the Patient ecosystem.

```mermaid
erDiagram
    %% Core Relationships
    USERS ||--|| PATIENTS : "Identifies as (1:1)"
    PATIENTS ||--o{ CAREGIVER_ASSIGNMENTS : "Manages (1:N)"
    PATIENTS ||--o{ CONSENT_RECORDS : "Grants (1:N)"
    PATIENTS ||--o{ APPOINTMENTS : "Books (1:N)"
    PATIENTS ||--o{ MEDICINES : "Prescribed (1:N)"
    PATIENTS ||--o{ ALERTS : "Triggers (1:N)"
    
    %% Cross References
    CAREGIVERS ||--o{ CAREGIVER_ASSIGNMENTS : "Assigned to"
    DOCTORS ||--o{ APPOINTMENTS : "Conducts"
    APPOINTMENTS ||--o{ MEDICINES : "Results in"

    PATIENTS {
        string patient_id PK "Unique Patient UUID"
        string user_id FK "Reference to Auth users collection"
        string name "Full Name"
        int age "Patient Age"
        string gender "Gender Identity"
        string condition "Primary Medical Condition"
        float adherence_score "AI calculated adherence metric"
        string caregiver_id FK "Primary active caregiver reference"
        string status "active | inactive | archived"
        timestamp created_at
        timestamp updated_at
    }
    
    CAREGIVER_ASSIGNMENTS {
        string assignment_id PK "Assignment UUID"
        string patient_id FK "Parent Patient Reference"
        string caregiver_id FK "Caregiver User Reference"
        string relationship "e.g., Son, Daughter, Professional Nurse"
        boolean is_active "Assignment status"
        timestamp assigned_at
    }
    
    CONSENT_RECORDS {
        string consent_id PK "Consent Record UUID"
        string patient_id FK "Parent Patient Reference"
        string consent_type "e.g., ai_analysis, data_sharing"
        string details "Legal terms agreed to"
        string consent_hash "Cryptographic audit trail hash"
        timestamp granted_at
    }

    APPOINTMENTS {
        string appointment_id PK "Appointment UUID"
        string patient_id FK "Parent Patient Reference"
        string doctor_id FK "Doctor User Reference"
        date date "Scheduled Date"
        time time "Scheduled Time"
        string status "scheduled | completed | cancelled"
    }

    MEDICINES {
        string medicine_id PK "Medicine UUID"
        string patient_id FK "Parent Patient Reference"
        string name "Medication Name"
        string dosage "e.g., 500mg"
        string frequency "e.g., Twice daily"
        boolean is_active "Currently taking?"
    }

    ALERTS {
        string alert_id PK "Alert UUID"
        string patient_id FK "Parent Patient Reference"
        string type "sos | vital_drop | missed_meds"
        string symptom "Detected issue"
        string status "active | resolved"
    }
```

---

## 3. Visual Database Architecture (Image Style)

This flowchart natively renders the exact visual style and colors from the original design image within Markdown, mapping the tables, PK/FKs, and network connections.

```mermaid
flowchart LR
    %% Styling to perfectly match the custom image colors
    classDef greenNode fill:#33cc33,stroke:#228b22,stroke-width:2px,color:#000,text-align:left
    classDef orangeNode fill:#ff9933,stroke:#cc7a00,stroke-width:2px,color:#000,text-align:left
    classDef pinkNode fill:#ff6666,stroke:#cc0000,stroke-width:2px,color:#000,text-align:left

    %% Nodes defined as visual tables
    Users["<b>users</b><br/>────────<br/><b>PK</b> user_id<br/>email<br/>display_name<br/>role<br/>phone<br/>preferred_language"]:::greenNode

    Patients["<b>patients</b><br/>────────<br/><b>PK</b> patient_id<br/><b>PF</b> user_id<br/>name<br/>age<br/>gender<br/>condition<br/>adherence_score<br/><b>FK</b> caregiver_id"]:::orangeNode

    Caregiver["<b>caregiver_assignments</b><br/>────────<br/><b>PK</b> assignment_id<br/><b>PF</b> patient_id<br/><b>PF</b> caregiver_id<br/>relationship<br/>is_active"]:::pinkNode

    Consent["<b>consent_records</b><br/>────────<br/><b>PK</b> consent_id<br/><b>PF</b> patient_id<br/>consent_type<br/>details<br/>consent_hash"]:::pinkNode

    Appt["<b>appointments</b><br/>────────<br/><b>PK</b> appointment_id<br/><b>PF</b> patient_id<br/><b>PF</b> doctor_id<br/>date<br/>time<br/>status"]:::orangeNode

    Meds["<b>medicines</b><br/>────────<br/><b>PK</b> medicine_id<br/><b>PF</b> patient_id<br/>name<br/>dosage<br/>frequency<br/>is_active"]:::pinkNode

    Alerts["<b>alerts</b><br/>────────<br/><b>PK</b> alert_id<br/><b>PF</b> patient_id<br/>type<br/>symptom<br/>status"]:::pinkNode

    %% Layout and Connections
    Users --> Patients
    
    Patients --> Caregiver
    Patients --> Appt
    Patients --> Consent
    Patients --> Meds
    Patients --> Alerts

    Users -- "FK caregiver_id" --> Caregiver
    Users -- "FK doctor_id" --> Appt
    Appt -- "Prescribed at" --> Meds
    Caregiver -- "Notified of" --> Alerts
```

---

## 4. Schema Definitions

### 4.1 `patients` (Core Collection)
The central repository for patient demographic and medical identity data.
*   **Access Control**: Read/Write by the Patient themselves. Read access granted to explicitly assigned Caregivers and Doctors.
*   **Indexes**: 
    *   `user_id` (Unique, for O(1) auth lookups)
    *   `caregiver_id` (For caregiver dashboard queries)

### 4.2 `caregiver_assignments` (Sub-collection)
Maps a patient to one or more caregivers.
*   **Access Control**: Read/Write by Patient. Read by the assigned Caregiver.
*   **Design Note**: Designed as a sub-collection under `patients` to ensure data locality and cascading deletes if a patient account is purged.

### 4.3 `consent_records` (Sub-collection)
Immutable ledger of legal and privacy consents granted by the patient.
*   **Security feature**: Includes a `consent_hash` to ensure data integrity and blockchain auditability for HIPAA/GDPR compliance.

### 4.4 `medicines` & `appointments` (Linked Collections)
Clinical data tracking the patient's medical history and future schedule.
*   **AI Integration**: The `medicines` collection heavily interacts with the AI agent to calculate the `adherence_score` stored on the root patient document.
*   **Workflow**: When an `appointment` is completed, new `medicines` are often generated by the Doctor.

### 4.5 `alerts` (Event Collection)
Emergency and notification triggers.
*   **Triggers**: When a new alert is inserted here, a backend Cloud Function automatically fires push notifications to the Patient's mapped `caregiver_id`.

---

## 4. Key Relationships & Cardinality

1.  **Users ↔ Patients (1:1)**: Every patient MUST map to exactly one authenticated identity in the `users` collection.
2.  **Patients ↔ Caregivers (1:N)**: A patient can have multiple caregivers (e.g., a son and a professional nurse), but a specific assignment record bridges them.
3.  **Patients ↔ Medical Data (1:N)**: All clinical data (appointments, meds, reports) is strictly scoped to the parent Patient ID to prevent cross-tenant data leaks.

---

## 5. Patient Data Flow & Workflow

This diagram illustrates the dynamic journey of a patient and how they interact with the database collections mapped out above.

```mermaid
flowchart TD
    classDef action fill:#d1c4e9,stroke:#512da8,stroke-width:2px,color:#000
    classDef system fill:#c8e6c9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef database fill:#ffcc80,stroke:#e65100,stroke-width:2px,color:#000
    classDef alert fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px,color:#000

    %% 1. Onboarding Phase
    Start([Patient Opens App]):::action --> Register[User Registration]:::action
    Register --> DB_User[(users DB)]:::database
    DB_User --> InitProfile[System Initializes Profile]:::system
    InitProfile --> DB_Patient[(patients DB)]:::database
    DB_Patient --> Consent[Patient Grants AI Consent]:::action
    Consent --> DB_Consent[(consent_records DB)]:::database

    %% 2. Caregiver Setup Phase
    DB_Patient --> AddCaregiver[Assigns Caregiver]:::action
    AddCaregiver --> DB_Caregiver[(caregiver_assignments DB)]:::database

    %% 3. Clinical Workflow
    DB_Patient --> BookAppt[Books Doctor Appointment]:::action
    BookAppt --> DB_Appt[(appointments DB)]:::database
    DB_Appt --> DocAction[Doctor Conducts Checkup]:::action
    DocAction --> Prescribe[Doctor Prescribes Medication]:::action
    Prescribe --> DB_Meds[(medicines DB)]:::database

    %% 4. AI & Emergency Workflow
    DB_Meds --> Adherence[AI Monitors Adherence]:::system
    DB_Patient --> AIMonitor[AI Analyzes Vitals/Chat]:::system
    
    AIMonitor -->|Abnormal Symptoms| TriggerAlert{Emergency Detected?}:::alert
    TriggerAlert -- Yes --> GenerateAlert[System Generates Alert]:::system
    GenerateAlert --> DB_Alerts[(alerts DB)]:::database
    
    DB_Alerts -->|Push Notification| NotifyCaregiver[Notify Assigned Caregiver]:::system
    DB_Caregiver -.->|Reads assignment| NotifyCaregiver
    
    TriggerAlert -- No --> UpdateScore[Update Patient Health Score]:::system
    UpdateScore --> DB_Patient
```

---

## 6. Advanced Visualizations

For highly styled, interactive visual architectures of this schema, please refer to the generated local HTML files:
*   [patient_image_style_diagram.html](./patient_image_style_diagram.html) (Detailed visual schema matching custom layouts)
*   [detailed_patient_er_diagram.html](./detailed_patient_er_diagram.html) (Alternative Web ERD)
*   [patient_workflow_diagram.html](./patient_workflow_diagram.html) (Standalone Workflow Diagram)
