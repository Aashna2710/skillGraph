import { useState, useMemo } from "react";
import { Database, Filter } from "lucide-react";
import { graphData, labelColors, relationshipColors } from "../constants/data";
import { GraphVisualization } from "../components/GraphVisulization";
import { PropertyPanel } from "../components/PropertyPanel";
import AddNodeModal from "../components/AddNodeModal";

const Dashboard = () => {
  const [selectedLabels, setSelectedLabels] = useState(
    new Set(["Person", "Company", "Project", "Technology"])
  );
  const [selectedRelTypes, setSelectedRelTypes] = useState(
    new Set(["WORKS_AT", "ASSIGNED_TO", "MANAGES", "USES", "COLLAB", "MENTORS"])
  );
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [currentGraphData, setCurrentGraphData] = useState(graphData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allLabels = [...new Set(graphData.nodes.map((n) => n.label))];
  const allRelTypes = [...new Set(graphData.relationships.map((r) => r.type))];

  // const visibleNodes = useMemo(() => {
  //   return graphData.nodes.filter((node) => selectedLabels.has(node.label));
  // }, [selectedLabels]);

  const visibleNodes = useMemo(() => {
    return currentGraphData.nodes.filter((node) =>
      selectedLabels.has(node.label)
    );
  }, [selectedLabels, currentGraphData.nodes]);

  // const visibleRelationships = useMemo(() => {
  //   return graphData.relationships.filter(
  //     (rel) =>
  //       selectedRelTypes.has(rel.type) &&
  //       visibleNodes.some((n) => n.id === rel.source) &&
  //       visibleNodes.some((n) => n.id === rel.target)
  //   );
  // }, [selectedRelTypes, visibleNodes]);

  const visibleRelationships = useMemo(() => {
    return currentGraphData.relationships.filter(
      (rel) =>
        visibleNodes.some((node) => node.id === rel.source) &&
        visibleNodes.some((node) => node.id === rel.target)
    );
  }, [visibleNodes, currentGraphData.relationships]);

  const toggleLabel = (label) => {
    const newSelected = new Set(selectedLabels);
    if (newSelected.has(label)) {
      newSelected.delete(label);
    } else {
      newSelected.add(label);
    }
    setSelectedLabels(newSelected);
  };

  const toggleRelType = (relType) => {
    const newSelected = new Set(selectedRelTypes);
    if (newSelected.has(relType)) {
      newSelected.delete(relType);
    } else {
      newSelected.add(relType);
    }
    setSelectedRelTypes(newSelected);
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setSelectedRelationship(null);
  };

  const handleNodeDoubleClick = (node) => {
    // Expand connected nodes (simulate Neo4j behavior)
    const connectedRelTypes = graphData.relationships
      .filter((r) => r.source === node.id || r.target === node.id)
      .map((r) => r.type);

    setSelectedRelTypes(new Set([...selectedRelTypes, ...connectedRelTypes]));
  };

  const handleAddNode = (newNode, newRelationship) => {
    setCurrentGraphData((prev) => ({
      nodes: [...prev.nodes, newNode],
      relationships: newRelationship
        ? [...prev.relationships, newRelationship]
        : prev.relationships,
    }));
  };

  return (
    <>
      <div
        style={{
          height: "100vh",
          backgroundColor: "#f3f4f6",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "white",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            borderBottom: "1px solid #e5e7eb",
            padding: "12px 24px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                width: "100%",
              }}
            >
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#1f2937",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Database style={{ color: "#2563eb" }} size={24} />
                Interactive Knowledege Visualization
              </h1>
              <div>
                <button onClick={() => setIsModalOpen(true)}>Add Skill</button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Left Sidebar - Filters */}
          <div
            style={{
              width: "256px",
              backgroundColor: "white",
              borderRight: "1px solid #e5e7eb",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Node Labels */}
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
              <h3
                style={{
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Filter size={16} />
                Node Labels
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {allLabels.map((label) => (
                  <label
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLabels.has(label)}
                      onChange={() => toggleLabel(label)}
                      style={{ borderRadius: "4px" }}
                    />
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: labelColors[label],
                      }}
                    />
                    <span style={{ fontSize: "14px", color: "black" }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginLeft: "auto",
                      }}
                    >
                      ({graphData.nodes.filter((n) => n.label === label).length}
                      )
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Relationship Types */}
            <div
              style={{
                padding: "16px",
                flex: 1,
                overflowY: "auto",
              }}
            >
              <h3
                style={{
                  fontWeight: "600",
                  color: "#1f2937",
                  marginBottom: "12px",
                }}
              >
                Relationship Types
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {allRelTypes.map((relType) => (
                  <label
                    key={relType}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRelTypes.has(relType)}
                      onChange={() => toggleRelType(relType)}
                      style={{ borderRadius: "4px" }}
                    />
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: relationshipColors[relType],
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "black" }}>
                      {relType}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginLeft: "auto",
                      }}
                    >
                      (
                      {
                        graphData.relationships.filter(
                          (r) => r.type === relType
                        ).length
                      }
                      )
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Graph Area */}
          <div style={{ flex: 1, padding: "16px" }}>
            <GraphVisualization
              visibleNodes={visibleNodes}
              visibleRelationships={visibleRelationships}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              onNodeDoubleClick={handleNodeDoubleClick}
            />
          </div>

          {/* Right Sidebar - Properties */}
          <div
            style={{
              width: "320px",
              backgroundColor: "white",
              borderLeft: "1px solid #e5e7eb",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ fontWeight: "600", color: "#1f2937" }}>
                Properties
              </h3>
            </div>
            <PropertyPanel
              selectedNode={selectedNode}
              selectedRelationship={selectedRelationship}
            />
          </div>
        </div>
      </div>
      <AddNodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddNode={handleAddNode}
        existingNodes={currentGraphData.nodes}
      />
    </>
  );
};

export default Dashboard;
