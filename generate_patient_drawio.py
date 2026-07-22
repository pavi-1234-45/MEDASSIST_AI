import xml.etree.ElementTree as ET
import xml.dom.minidom

def create_table(parent, id_prefix, name, fields, x, y, fill, stroke):
    # Header
    header_id = f"{id_prefix}_header"
    header = ET.SubElement(parent, "mxCell", id=header_id, value=name, parent="1", vertex="1", style=f"shape=rectangle;fillColor={fill};fontColor=#000000;strokeColor={stroke};rounded=1;arcSize=10;fontSize=14;fontStyle=1;whiteSpace=wrap;align=center;verticalAlign=middle;strokeWidth=2;")
    ET.SubElement(header, "mxGeometry", x=str(x), y=str(y), width="220", height="30", **{"as": "geometry"})
    
    # Body
    body_id = f"{id_prefix}_body"
    field_text = "&#10;".join(fields)
    body = ET.SubElement(parent, "mxCell", id=body_id, value=field_text, parent="1", vertex="1", style=f"shape=rectangle;fillColor=#ffffff;fontColor=#000000;strokeColor={stroke};rounded=1;arcSize=0;fontSize=12;whiteSpace=wrap;align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;strokeWidth=2;")
    ET.SubElement(body, "mxGeometry", x=str(x), y=str(y+30), width="220", height=str(len(fields)*20 + 10), **{"as": "geometry"})
    return header_id, body_id

def create_edge(parent, edge_id, source_id, target_id, label=""):
    edge = ET.SubElement(parent, "mxCell", id=edge_id, value=label, parent="1", style="endArrow=block;html=1;rounded=0;strokeWidth=2;edgeStyle=orthogonalEdgeStyle;", edge="1", source=source_id, target=target_id)
    ET.SubElement(edge, "mxGeometry", relative="1", **{"as": "geometry"})

root = ET.Element("mxfile", host="app.diagrams.net", type="device")
diagram = ET.SubElement(root, "diagram", id="patient-db", name="Patient Database")
graph_model = ET.SubElement(diagram, "mxGraphModel", dx="1000", dy="1000", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="1600", pageHeight="1200", math="0", shadow="0")
root_cell = ET.SubElement(graph_model, "root")
ET.SubElement(root_cell, "mxCell", id="0")
ET.SubElement(root_cell, "mxCell", id="1", parent="0")

tables = {
    "users": {
        "fields": ["PK user_id", "email", "display_name", "role", "phone", "preferred_language"],
        "x": 50, "y": 400, "fill": "#33cc33", "stroke": "#228b22"
    },
    "patients": {
        "fields": ["PK patient_id", "PF user_id", "name", "age", "gender", "condition", "adherence_score", "FK caregiver_id"],
        "x": 350, "y": 400, "fill": "#ff9933", "stroke": "#cc7a00"
    },
    "caregiver": {
        "fields": ["PK assignment_id", "PF patient_id", "PF caregiver_id", "relationship", "is_active"],
        "x": 650, "y": 100, "fill": "#ff6666", "stroke": "#cc0000"
    },
    "consent": {
        "fields": ["PK consent_id", "PF patient_id", "consent_type", "details", "consent_hash"],
        "x": 650, "y": 300, "fill": "#ff6666", "stroke": "#cc0000"
    },
    "appt": {
        "fields": ["PK appointment_id", "PF patient_id", "PF doctor_id", "date", "time", "status"],
        "x": 650, "y": 500, "fill": "#ff9933", "stroke": "#cc7a00"
    },
    "meds": {
        "fields": ["PK medicine_id", "PF patient_id", "name", "dosage", "frequency", "is_active"],
        "x": 950, "y": 500, "fill": "#ff6666", "stroke": "#cc0000"
    },
    "alerts": {
        "fields": ["PK alert_id", "PF patient_id", "type", "symptom", "status"],
        "x": 950, "y": 100, "fill": "#ff6666", "stroke": "#cc0000"
    }
}

table_ids = {}
for name, data in tables.items():
    header_id, body_id = create_table(root_cell, name, name.capitalize() if name != "caregiver" else "Caregiver_assignments", data["fields"], data["x"], data["y"], data["fill"], data["stroke"])
    table_ids[name] = header_id

edges = [
    ("users", "patients", ""),
    ("patients", "caregiver", ""),
    ("patients", "appt", ""),
    ("patients", "consent", ""),
    ("patients", "meds", ""),
    ("patients", "alerts", ""),
    ("users", "caregiver", "FK caregiver_id"),
    ("users", "appt", "FK doctor_id"),
    ("appt", "meds", "Prescribed at"),
    ("caregiver", "alerts", "Notified of")
]

for idx, (src, tgt, label) in enumerate(edges):
    create_edge(root_cell, f"edge_{idx}", table_ids[src], table_ids[tgt], label)

xml_str = xml.dom.minidom.parseString(ET.tostring(root)).toprettyxml(indent="  ")
with open("Patient_Database_Design.drawio", "w", encoding="utf-8") as f:
    f.write(xml_str)

print("Generated Patient_Database_Design.drawio")
