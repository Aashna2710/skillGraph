import { X, Plus } from "lucide-react";
import { useState } from "react";

const AddNodeModal = ({ isOpen, onClose, onAddNode, existingNodes }) => {
  const [formData, setFormData] = useState({
    label: "Person",
    name: "",
    properties: {},
  });
  const [dynamicFields, setDynamicFields] = useState([]);
  const [relationshipData, setRelationshipData] = useState({
    targetNodeId: "",
    relationshipType: "WORKS_AT",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setFormData((prev) => ({ ...prev, name: value }));
    } else if (name === "label") {
      setFormData((prev) => ({ ...prev, label: value }));
      setDynamicFields([]);
    }
  };

  const handleRelationshipChange = (e) => {
    const { name, value } = e.target;
    setRelationshipData((prev) => ({ ...prev, [name]: value }));
  };

  const addDynamicField = () => {
    setDynamicFields((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateDynamicField = (index, field, value) => {
    setDynamicFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeDynamicField = (index) => {
    setDynamicFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter a name");
      return;
    }

    const allProperties = { ...formData.properties };
    dynamicFields.forEach((field) => {
      if (field.key && field.value) {
        allProperties[field.key] = field.value;
      }
    });
    allProperties.name = formData.name;

    const newNode = {
      id: `node_${Date.now()}`,
      label: formData.label,
      properties: allProperties,
    };

    const newRelationship = relationshipData.targetNodeId
      ? {
          id: `rel_${Date.now()}`,
          source: newNode.id,
          target: relationshipData.targetNodeId,
          type: relationshipData.relationshipType,
          properties: {},
        }
      : null;

    onAddNode(newNode, newRelationship);

    // Reset form
    setFormData({ label: "Person", name: "", properties: {} });
    setDynamicFields([]);
    setRelationshipData({ targetNodeId: "", relationshipType: "WORKS_AT" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#2a3441",
          padding: "24px",
          borderRadius: "12px",
          width: "500px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "#ffffff", margin: 0 }}>Add New Node</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div>
          {/* Node Type */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                color: "#ffffff",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Node Type
            </label>
            <select
              name="label"
              value={formData.label}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                backgroundColor: "#374151",
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              <option value="Person">Person</option>
              <option value="Company">Company</option>
              <option value="Project">Project</option>
              <option value="Technology">Technology</option>
              <option value="Skill">Skill</option>
            </select>
          </div>

          {/* Name */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                color: "#ffffff",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                backgroundColor: "#374151",
                color: "#ffffff",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Dynamic Properties */}
          {dynamicFields.map((field, index) => (
            <div
              key={index}
              style={{
                marginBottom: "16px",
                padding: "12px",
                border: "1px solid #4b5563",
                borderRadius: "4px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Property name"
                  value={field.key}
                  onChange={(e) =>
                    updateDynamicField(index, "key", e.target.value)
                  }
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #4b5563",
                    backgroundColor: "#374151",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) =>
                    updateDynamicField(index, "value", e.target.value)
                  }
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #4b5563",
                    backgroundColor: "#374151",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <button
                  onClick={() => removeDynamicField(index)}
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #ef4444",
                    backgroundColor: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addDynamicField}
            style={{
              marginBottom: "20px",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #10b981",
              backgroundColor: "transparent",
              color: "#10b981",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus size={14} /> Add Property
          </button>

          {/* Relationship Section */}
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              border: "1px solid #4b5563",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                color: "#ffffff",
                margin: "0 0 16px 0",
                fontSize: "16px",
              }}
            >
              Add Relationship (Optional)
            </h3>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  color: "#ffffff",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Connect to existing node
              </label>
              <select
                name="targetNodeId"
                value={relationshipData.targetNodeId}
                onChange={handleRelationshipChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #4b5563",
                  backgroundColor: "#374151",
                  color: "#ffffff",
                  fontSize: "14px",
                }}
              >
                <option value="">-- No relationship --</option>
                {existingNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.properties.name} ({node.label})
                  </option>
                ))}
              </select>
            </div>

            {relationshipData.targetNodeId && (
              <div>
                <label
                  style={{
                    display: "block",
                    color: "#ffffff",
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  Relationship Type
                </label>
                <select
                  name="relationshipType"
                  value={relationshipData.relationshipType}
                  onChange={handleRelationshipChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #4b5563",
                    backgroundColor: "#374151",
                    color: "#ffffff",
                    fontSize: "14px",
                  }}
                >
                  <option value="WORKS_AT">WORKS_AT</option>
                  <option value="ASSIGNED_TO">ASSIGNED_TO</option>
                  <option value="MANAGES">MANAGES</option>
                  <option value="USES">USES</option>
                  <option value="COLLAB">COLLAB</option>
                  <option value="MENTORS">MENTORS</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                border: "1px solid #6b7280",
                backgroundColor: "transparent",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: "10px 20px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Add Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNodeModal;
