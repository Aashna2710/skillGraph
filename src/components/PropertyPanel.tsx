import { Database } from "lucide-react";
import { labelColors, relationshipColors } from "../constants/data";

export const PropertyPanel = ({ selectedNode, selectedRelationship }) => {
  if (!selectedNode && !selectedRelationship) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Database size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
          <p>Click on a node or relationship to view properties</p>
        </div>
      </div>
    );
  }

  const item = selectedNode || selectedRelationship;
  const isNode = !!selectedNode;

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: isNode
                  ? labelColors[item.label]
                  : relationshipColors[item.type],
              }}
            />
            <h3 style={{ fontWeight: "bold", color: "#1f2937", margin: 0 }}>
              {isNode ? item.label : item.type}
            </h3>
          </div>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            {isNode ? `Node ID: ${item.id}` : `Relationship ID: ${item.id}`}
          </p>
        </div>

        <div>
          <h4
            style={{
              fontWeight: "600",
              color: "#374151",
              marginBottom: "12px",
            }}
          >
            Properties
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(item.properties || {}).map(([key, value]) => (
              <div
                key={key}
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "8px",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                  >
                    {key}:
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#111827",
                      textAlign: "right",
                      marginLeft: "8px",
                    }}
                  >
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isNode && selectedRelationship && (
          <div style={{ marginTop: "16px" }}>
            <h4
              style={{
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Connection
            </h4>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              <p>From: {selectedRelationship.source}</p>
              <p>To: {selectedRelationship.target}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};