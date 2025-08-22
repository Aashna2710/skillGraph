import { RotateCcw } from "lucide-react";
import { labelColors, relationshipColors } from "../constants/data";
import { useEffect, useRef, useState } from "react";
import {
  COLORS,
  LAYOUT_CONSTANTS,
  MARKER_CONSTANTS,
  NODE_CONSTANTS,
  PHYSICS_CONSTANTS,
  TIMING_CONSTANTS,
  UI_CONSTANTS,
} from "../constants/magicNumber";

// Type definitions
interface NodePosition {
  x: number;
  y: number;
}

interface NodeVelocity {
  x: number;
  y: number;
}

interface Pan {
  x: number;
  y: number;
}

interface NodeProperties {
  name?: string;
  [key: string]: any;
}

interface Node {
  id: string;
  label: string;
  properties: NodeProperties;
}

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface GraphVisualizationProps {
  visibleNodes: Node[];
  visibleRelationships: Relationship[];
  selectedNode: Node | null;
  onNodeSelect: (node: Node) => void;
  onNodeDoubleClick: (node: Node) => void;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  visibleNodes,
  visibleRelationships,
  selectedNode,
  onNodeSelect,
  onNodeDoubleClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);
  const stabilizationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<
    Record<string, NodePosition>
  >({});
  const [nodeVelocities, setNodeVelocities] = useState<
    Record<string, NodeVelocity>
  >({});
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isPhysicsActive, setIsPhysicsActive] = useState<boolean>(false);

  // Initialize node positions with force-directed layout (one-time calculation)
  useEffect(() => {
    if (!svgRef.current || visibleNodes.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const positions: Record<string, NodePosition> = {};
    const velocities: Record<string, NodeVelocity> = {};

    // Simple circular layout for initial positioning with more spacing
    visibleNodes.forEach((node, index) => {
      const angle = (index * 2 * Math.PI) / visibleNodes.length;
      const radius = Math.max(
        LAYOUT_CONSTANTS.RESET_RADIUS_MIN,
        LAYOUT_CONSTANTS.RESET_RADIUS_BASE +
          visibleNodes.length * LAYOUT_CONSTANTS.RESET_RADIUS_MULTIPLIER
      );

      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
      velocities[node.id] = { x: 0, y: 0 };
    });

    setNodePositions(positions);
    setNodeVelocities(velocities);

    // Run physics for initial stabilization only
    setIsPhysicsActive(true);

    // Auto-stop physics after stabilization
    if (stabilizationTimeoutRef.current) {
      clearTimeout(stabilizationTimeoutRef.current);
    }
    stabilizationTimeoutRef.current = setTimeout(() => {
      setIsPhysicsActive(false);
    }, TIMING_CONSTANTS.PHYSICS_STABILIZATION_TIMEOUT);
  }, [visibleNodes.map((n) => n.id).join(",")]); // Only re-run when nodes change

  // Physics simulation
  useEffect(() => {
    if (!isPhysicsActive || Object.keys(nodePositions).length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let frameCount = 0;
    let stableFrameCount = 0;

    const animate = () => {
      frameCount++;

      if (frameCount % PHYSICS_CONSTANTS.FRAME_SKIP === 0) {
        let totalMovement = 0;

        setNodePositions((prevPositions) => {
          const newPositions = { ...prevPositions };

          setNodeVelocities((prevVelocities) => {
            const newVelocities = { ...prevVelocities };
            const rect = svgRef.current?.getBoundingClientRect();

            if (!rect) return prevVelocities;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Build connection map
            const connections = new Map<string, string[]>();
            visibleRelationships.forEach((rel) => {
              if (!connections.has(rel.source)) connections.set(rel.source, []);
              if (!connections.has(rel.target)) connections.set(rel.target, []);
              connections.get(rel.source)?.push(rel.target);
              connections.get(rel.target)?.push(rel.source);
            });

            visibleNodes.forEach((node) => {
              if (draggedNode === node.id) return;

              const pos = newPositions[node.id];
              const vel = newVelocities[node.id];
              if (!pos || !vel) return;

              let forceX = 0;
              let forceY = 0;

              // Repulsion from other nodes (increased distance and reduced when close)
              visibleNodes.forEach((otherNode) => {
                if (node.id === otherNode.id) return;

                const otherPos = newPositions[otherNode.id];
                if (!otherPos) return;

                const dx = pos.x - otherPos.x;
                const dy = pos.y - otherPos.y;
                const distanceSq = dx * dx + dy * dy;
                const distance = Math.sqrt(distanceSq);

                if (
                  distance > 0 &&
                  distance < PHYSICS_CONSTANTS.REPULSION_DISTANCE + 50
                ) {
                  // Increased repulsion distance
                  const force =
                    (PHYSICS_CONSTANTS.REPULSION_FORCE + 100) / distanceSq; // Increased repulsion force
                  forceX += (dx / distance) * force;
                  forceY += (dy / distance) * force;
                }
              });

              // Spring forces from connected nodes
              const nodeConnections = connections.get(node.id) || [];
              nodeConnections.forEach((connectedNodeId) => {
                const connectedPos = newPositions[connectedNodeId];
                if (!connectedPos) return;

                const dx = connectedPos.x - pos.x;
                const dy = connectedPos.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                  const displacement =
                    distance - (PHYSICS_CONSTANTS.LINK_DISTANCE + 30); // Increased ideal connection distance
                  const force =
                    displacement * (PHYSICS_CONSTANTS.SPRING_STRENGTH - 0.015); // Slightly reduced spring strength for gentler pull
                  forceX += (dx / distance) * force;
                  forceY += (dy / distance) * force;
                }
              });

              // Very weak center attraction (only if very far)
              const centerDx = centerX - pos.x;
              const centerDy = centerY - pos.y;
              const centerDistance = Math.sqrt(
                centerDx * centerDx + centerDy * centerDy
              );
              if (
                centerDistance >
                PHYSICS_CONSTANTS.CENTER_ATTRACTION_THRESHOLD + 300
              ) {
                // Increased threshold before center attraction kicks in
                forceX +=
                  centerDx * (PHYSICS_CONSTANTS.CENTER_ATTRACTION - 0.0007); // Reduced center attraction
                forceY +=
                  centerDy * (PHYSICS_CONSTANTS.CENTER_ATTRACTION - 0.0007);
              }

              // Update velocity with higher damping
              vel.x =
                (vel.x + forceX) * (PHYSICS_CONSTANTS.VELOCITY_DAMPING + 0.05); // Higher damping
              vel.y =
                (vel.y + forceY) * (PHYSICS_CONSTANTS.VELOCITY_DAMPING + 0.05);

              // Stop tiny movements
              if (
                Math.abs(vel.x) <
                PHYSICS_CONSTANTS.MIN_VELOCITY_THRESHOLD + 0.04
              )
                vel.x = 0;
              if (
                Math.abs(vel.y) <
                PHYSICS_CONSTANTS.MIN_VELOCITY_THRESHOLD + 0.04
              )
                vel.y = 0;

              // Track total movement for stability detection
              totalMovement += Math.abs(vel.x) + Math.abs(vel.y);

              // Update position
              pos.x += vel.x;
              pos.y += vel.y;

              // Boundary constraints with more margin
              const margin = PHYSICS_CONSTANTS.BOUNDARY_MARGIN + 30; // Increased margin from edges
              if (pos.x < margin) {
                pos.x = margin;
                vel.x = 0;
              }
              if (pos.x > rect.width - margin) {
                pos.x = rect.width - margin;
                vel.x = 0;
              }
              if (pos.y < margin) {
                pos.y = margin;
                vel.y = 0;
              }
              if (pos.y > rect.height - margin) {
                pos.y = rect.height - margin;
                vel.y = 0;
              }
            });

            return newVelocities;
          });

          return newPositions;
        });

        // Check for stability
        if (totalMovement < PHYSICS_CONSTANTS.STABILITY_THRESHOLD) {
          stableFrameCount++;
          if (stableFrameCount >= PHYSICS_CONSTANTS.STABLE_FRAMES_NEEDED) {
            setIsPhysicsActive(false);
            return;
          }
        } else {
          stableFrameCount = 0;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    visibleNodes,
    visibleRelationships,
    draggedNode,
    isPhysicsActive,
    nodePositions,
  ]);

  // Wheel zoom handler
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomDelta =
        e.deltaY < 0 ? UI_CONSTANTS.ZOOM_STEP : -UI_CONSTANTS.ZOOM_STEP;
      const newZoom = Math.min(
        Math.max(zoom + zoomDelta, UI_CONSTANTS.ZOOM_MIN),
        UI_CONSTANTS.ZOOM_MAX
      );

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = pan.x - (mouseX / zoom - mouseX / newZoom) * zoom;
      const newPanY = pan.y - (mouseY / zoom - mouseY / newZoom) * zoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [zoom, pan]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setDraggedNode(nodeId);

    // Activate physics when starting to drag
    setIsPhysicsActive(true);

    // Clear any existing stabilization timeout
    if (stabilizationTimeoutRef.current) {
      clearTimeout(stabilizationTimeoutRef.current);
    }

    setNodeVelocities((prev) => ({
      ...prev,
      [nodeId]: { x: 0, y: 0 },
    }));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      setNodePositions((prev) => ({
        ...prev,
        [draggedNode]: { x, y },
      }));
    } else if (e.buttons === 1 && svgRef.current) {
      setPan((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      // Stop physics shortly after releasing drag
      if (stabilizationTimeoutRef.current) {
        clearTimeout(stabilizationTimeoutRef.current);
      }
      stabilizationTimeoutRef.current = setTimeout(() => {
        setIsPhysicsActive(false);
      }, TIMING_CONSTANTS.DRAG_RELEASE_TIMEOUT);
    }
    setDraggedNode(null);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggedNode, zoom, pan]);

  const resetLayout = () => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const positions: Record<string, NodePosition> = {};
    const velocities: Record<string, NodeVelocity> = {};

    visibleNodes.forEach((node, index) => {
      const angle = (index * 2 * Math.PI) / visibleNodes.length;
      const radius = Math.max(
        LAYOUT_CONSTANTS.RESET_RADIUS_MIN,
        LAYOUT_CONSTANTS.RESET_RADIUS_BASE +
          visibleNodes.length * LAYOUT_CONSTANTS.RESET_RADIUS_MULTIPLIER
      );

      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
      velocities[node.id] = { x: 0, y: 0 };
    });

    setNodePositions(positions);
    setNodeVelocities(velocities);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    // Brief physics activation for reset
    setIsPhysicsActive(true);
    if (stabilizationTimeoutRef.current) {
      clearTimeout(stabilizationTimeoutRef.current);
    }
    stabilizationTimeoutRef.current = setTimeout(() => {
      setIsPhysicsActive(false);
    }, TIMING_CONSTANTS.RESET_PHYSICS_TIMEOUT);
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement;
    target.style.backgroundColor = COLORS.BUTTON_HOVER;
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.target as HTMLButtonElement;
    target.style.backgroundColor = COLORS.BUTTON_BG;
  };

  const handleCircleMouseEnter = (e: React.MouseEvent<SVGCircleElement>) => {
    const target = e.target as SVGCircleElement;
    target.style.opacity = UI_CONSTANTS.OPACITY_HOVER.toString();
  };

  const handleCircleMouseLeave = (e: React.MouseEvent<SVGCircleElement>) => {
    const target = e.target as SVGCircleElement;
    target.style.opacity = UI_CONSTANTS.OPACITY_DEFAULT.toString();
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (stabilizationTimeoutRef.current) {
        clearTimeout(stabilizationTimeoutRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: `${UI_CONSTANTS.BORDER_RADIUS}px`,
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: `${UI_CONSTANTS.TOOLBAR_SPACING}px`,
          left: `${UI_CONSTANTS.TOOLBAR_SPACING}px`,
          zIndex: 10,
          display: "flex",
          gap: `${UI_CONSTANTS.TOOLBAR_GAP}px`,
        }}
      >
        <button
          onClick={resetLayout}
          style={{
            backgroundColor: COLORS.BUTTON_BG,
            color: COLORS.TEXT_WHITE,
            padding: `${UI_CONSTANTS.BUTTON_PADDING}px`,
            borderRadius: `${UI_CONSTANTS.BORDER_RADIUS}px`,
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          title="Reset Layout"
        >
          <RotateCcw size={UI_CONSTANTS.ICON_SIZE} />
        </button>
        <button
          onClick={() =>
            setZoom((z) =>
              Math.min(z + UI_CONSTANTS.ZOOM_STEP, UI_CONSTANTS.ZOOM_MAX)
            )
          }
          style={{
            backgroundColor: COLORS.BUTTON_BG,
            color: COLORS.TEXT_WHITE,
            padding: `${UI_CONSTANTS.BUTTON_PADDING}px ${UI_CONSTANTS.BUTTON_PADDING_EXTENDED}px`,
            borderRadius: `${UI_CONSTANTS.BORDER_RADIUS}px`,
            border: "none",
            cursor: "pointer",
            fontSize: `${UI_CONSTANTS.FONT_SIZE_DEFAULT}px`,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
        >
          Zoom In
        </button>
        <button
          onClick={() =>
            setZoom((z) =>
              Math.max(z - UI_CONSTANTS.ZOOM_STEP, UI_CONSTANTS.ZOOM_MIN)
            )
          }
          style={{
            backgroundColor: COLORS.BUTTON_BG,
            color: COLORS.TEXT_WHITE,
            padding: `${UI_CONSTANTS.BUTTON_PADDING}px ${UI_CONSTANTS.BUTTON_PADDING_EXTENDED}px`,
            borderRadius: `${UI_CONSTANTS.BORDER_RADIUS}px`,
            border: "none",
            cursor: "pointer",
            fontSize: `${UI_CONSTANTS.FONT_SIZE_DEFAULT}px`,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
        >
          Zoom Out
        </button>
      </div>

      {/* Graph SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          cursor: draggedNode ? "grabbing" : "grab",
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth={MARKER_CONSTANTS.WIDTH}
            markerHeight={MARKER_CONSTANTS.HEIGHT}
            refX={MARKER_CONSTANTS.REF_X}
            refY={MARKER_CONSTANTS.REF_Y}
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.ARROW_FILL} />
          </marker>
        </defs>

        {/* Relationships */}
        {visibleRelationships.map((rel) => {
          const sourcePos = nodePositions[rel.source];
          const targetPos = nodePositions[rel.target];
          if (!sourcePos || !targetPos) return null;

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / length;
          const unitY = dy / length;

          const sourceX = sourcePos.x + unitX * NODE_CONSTANTS.EDGE_OFFSET;
          const sourceY = sourcePos.y + unitY * NODE_CONSTANTS.EDGE_OFFSET;
          const targetX = targetPos.x - unitX * NODE_CONSTANTS.EDGE_OFFSET;
          const targetY = targetPos.y - unitY * NODE_CONSTANTS.EDGE_OFFSET;

          // Calculate label position and dimensions
          const labelPadding = 6;
          const labelHeight = 14;
          const labelWidth = rel.type.length * 6 + labelPadding * 2; // Approximate width

          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;

          // Calculate the gap along the line direction
          const halfLabelDistance = labelWidth / 2;

          // Points where the line should be broken for the label
          const labelStartX = midX - unitX * halfLabelDistance;
          const labelStartY = midY - unitY * halfLabelDistance;
          const labelEndX = midX + unitX * halfLabelDistance;
          const labelEndY = midY + unitY * halfLabelDistance;

          // Calculate the angle for text rotation
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          // For readability, flip text if it would be upside down
          const textAngle = angle > 90 || angle < -90 ? angle + 180 : angle;
          const textX = angle > 90 || angle < -90 ? midX : midX;
          const textY = angle > 90 || angle < -90 ? midY : midY;

          return (
            <g key={rel.id}>
              {/* First line segment (source to label start) */}
              <line
                x1={sourceX}
                y1={sourceY}
                x2={labelStartX}
                y2={labelStartY}
                stroke={
                  relationshipColors[rel.type] || COLORS.DEFAULT_EDGE_COLOR
                }
                strokeWidth={NODE_CONSTANTS.STROKE_WIDTH_DEFAULT}
              />

              {/* Second line segment (label end to target) */}
              <line
                x1={labelEndX}
                y1={labelEndY}
                x2={targetX}
                y2={targetY}
                stroke={
                  relationshipColors[rel.type] || COLORS.DEFAULT_EDGE_COLOR
                }
                strokeWidth={NODE_CONSTANTS.STROKE_WIDTH_DEFAULT}
                markerEnd="url(#arrowhead)"
              />

              {/* Label background */}
              <rect
                x={-labelWidth / 2}
                y={-labelHeight / 2}
                width={labelWidth}
                height={labelHeight}
                fill={COLORS.BACKGROUND}
                // stroke={relationshipColors[rel.type] || COLORS.DEFAULT_EDGE_COLOR}
                // strokeWidth="1"
                rx="2"
                ry="2"
                transform={`translate(${midX}, ${midY}) rotate(${textAngle})`}
              />

              {/* Label text */}
              <text
                x={0}
                y={1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={COLORS.TEXT_GRAY}
                fontSize={UI_CONSTANTS.FONT_SIZE_SMALL - 1}
                fontWeight="500"
                pointerEvents="none"
                transform={`translate(${textX}, ${textY}) rotate(${textAngle})`}
              >
                {rel.type}
              </text>
            </g>
          );
        })}

        {/* Nodes */}

        {visibleNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const isSelected = selectedNode?.id === node.id;
          const radius = isSelected
            ? NODE_CONSTANTS.SELECTED_RADIUS
            : NODE_CONSTANTS.DEFAULT_RADIUS;

          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={labelColors[node.label] || COLORS.DEFAULT_NODE_COLOR}
                stroke={
                  isSelected ? COLORS.STROKE_SELECTED : COLORS.STROKE_DEFAULT
                }
                strokeWidth={
                  isSelected
                    ? NODE_CONSTANTS.STROKE_WIDTH_SELECTED
                    : NODE_CONSTANTS.STROKE_WIDTH_DEFAULT
                }
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => onNodeSelect(node)}
                onDoubleClick={() => onNodeDoubleClick(node)}
                onMouseEnter={handleCircleMouseEnter}
                onMouseLeave={handleCircleMouseLeave}
              />

              {/* Label text - positioned in upper part of circle */}
              <text
                x={pos.x}
                y={pos.y - 8} // Positioned in upper part of circle
                textAnchor="middle"
                fill={COLORS.TEXT_WHITE}
                fontSize={UI_CONSTANTS.FONT_SIZE_SMALL}
                fontWeight="normal"
                pointerEvents="none"
                dominantBaseline="middle"
              >
                {node.label}
              </text>

              {/* Name text - positioned in lower part of circle */}
              <text
                x={pos.x}
                y={pos.y + 8} // Positioned in lower part of circle
                textAnchor="middle"
                fill={COLORS.TEXT_WHITE}
                fontSize={UI_CONSTANTS.FONT_SIZE_MEDIUM}
                pointerEvents="none"
                dominantBaseline="middle"
              >
                {node.properties.name &&
                node.properties.name.length > NODE_CONSTANTS.MAX_NAME_LENGTH
                  ? node.properties.name.substring(
                      0,
                      NODE_CONSTANTS.MAX_NAME_LENGTH
                    ) + "..."
                  : node.properties.name || ""}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Node count indicator */}
      <div
        style={{
          position: "absolute",
          bottom: `${UI_CONSTANTS.TOOLBAR_SPACING}px`,
          left: `${UI_CONSTANTS.TOOLBAR_SPACING}px`,
          backgroundColor: COLORS.BUTTON_BG,
          color: COLORS.TEXT_WHITE,
          padding: `${UI_CONSTANTS.BORDER_RADIUS}px ${UI_CONSTANTS.BUTTON_PADDING_EXTENDED}px`,
          borderRadius: `${UI_CONSTANTS.BORDER_RADIUS}px`,
          fontSize: `${UI_CONSTANTS.FONT_SIZE_DEFAULT}px`,
        }}
      >
        Nodes: {visibleNodes.length} | Relationships:{" "}
        {visibleRelationships.length}
        {isPhysicsActive && " | Stabilizing..."}
      </div>
    </div>
  );
};
