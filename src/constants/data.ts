// Neo4j-style sample data
export const graphData = {
  nodes: [
    {
      id: "p1",
      label: "Person",
      properties: { name: "Alice Johnson", age: 32, role: "Developer" },
    },
    {
      id: "p2",
      label: "Person",
      properties: { name: "Bob Smith", age: 28, role: "Designer" },
    },
    {
      id: "p3",
      label: "Person",
      properties: { name: "Carol Davis", age: 35, role: "Manager" },
    },
    {
      id: "p4",
      label: "Person",
      properties: { name: "David Wilson", age: 29, role: "Developer" },
    },
    {
      id: "c1",
      label: "Company",
      properties: { name: "TechCorp", industry: "Software", size: "Large" },
    },
    {
      id: "c2",
      label: "Company",
      properties: { name: "StartupXYZ", industry: "AI", size: "Small" },
    },
    {
      id: "pr1",
      label: "Project",
      properties: { name: "WebApp", status: "Active", budget: 50000 },
    },
    {
      id: "pr2",
      label: "Project",
      properties: { name: "MobileApp", status: "Complete", budget: 75000 },
    },
    {
      id: "pr3",
      label: "Project",
      properties: { name: "DataPlatform", status: "Planning", budget: 100000 },
    },
    {
      id: "t1",
      label: "Technology",
      properties: { name: "React", type: "Framework", version: "18.0" },
    },
    {
      id: "t2",
      label: "Technology",
      properties: { name: "Node.js", type: "Runtime", version: "20.0" },
    },
    {
      id: "t3",
      label: "Technology",
      properties: { name: "PostgreSQL", type: "Database", version: "15.0" },
    },
  ],
  relationships: [
    {
      id: "r1",
      source: "p1",
      target: "c1",
      type: "WORKS_AT",
      properties: { since: "2020", position: "Senior Dev" },
    },
    {
      id: "r2",
      source: "p2",
      target: "c1",
      type: "WORKS_AT",
      properties: { since: "2021", position: "Lead Designer" },
    },
    {
      id: "r3",
      source: "p3",
      target: "c1",
      type: "WORKS_AT",
      properties: { since: "2019", position: "Engineering Manager" },
    },
    {
      id: "r4",
      source: "p4",
      target: "c2",
      type: "WORKS_AT",
      properties: { since: "2022", position: "Full Stack Dev" },
    },
    {
      id: "r5",
      source: "p1",
      target: "pr1",
      type: "ASSIGNED_TO",
      properties: { role: "Lead Developer", allocation: 80 },
    },
    {
      id: "r6",
      source: "p2",
      target: "pr1",
      type: "ASSIGNED_TO",
      properties: { role: "UI Designer", allocation: 60 },
    },
    {
      id: "r7",
      source: "p1",
      target: "pr2",
      type: "ASSIGNED_TO",
      properties: { role: "Developer", allocation: 100 },
    },
    {
      id: "r8",
      source: "p3",
      target: "pr3",
      type: "MANAGES",
      properties: { responsibility: "Full oversight" },
    },
    {
      id: "r9",
      source: "pr1",
      target: "t1",
      type: "USES",
      properties: { purpose: "Frontend" },
    },
    {
      id: "r10",
      source: "pr1",
      target: "t2",
      type: "USES",
      properties: { purpose: "Backend" },
    },
    {
      id: "r11",
      source: "pr2",
      target: "t1",
      type: "USES",
      properties: { purpose: "Mobile UI" },
    },
    {
      id: "r12",
      source: "pr3",
      target: "t3",
      type: "USES",
      properties: { purpose: "Data Storage" },
    },
    {
      id: "r13",
      source: "p1",
      target: "p2",
      type: "COLLAB",
      properties: { frequency: "Daily" },
    },
    {
      id: "r14",
      source: "p1",
      target: "p4",
      type: "MENTORS",
      properties: { since: "2023" },
    },
  ],
};

export const labelColors = {
  Person: "#FF6B6B",
  Company: "#4ECDC4",
  Project: "#45B7D1",
  Technology: "#96CEB4",
};

export const relationshipColors = {
  WORKS_AT: "#E74C3C",
  ASSIGNED_TO: "#3498DB",
  MANAGES: "#9B59B6",
  USES: "#27AE60",
  COLLAB: "#F39C12",
  MENTORS: "#E67E22",
};