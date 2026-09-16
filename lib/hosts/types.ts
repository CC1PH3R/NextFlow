export type HostProject = {
  id: string;
  name: string;
};

export type HostStatus = "ready" | "building" | "error" | "unknown";

export type HostProduction = {
  url: string;
  status: string;
  createdAt: Date;
};

export type HostAdapter = {
  readonly provider: "vercel";
  listProjects(): Promise<HostProject[]>;
  getProject(id: string): Promise<HostProject>;
  getLatestProduction(id: string): Promise<HostProduction>;
};

export function mapHostStatus(raw: string): HostStatus {
  switch (raw.toUpperCase()) {
    case "READY":
    case "SUCCESS":
      return "ready";
    case "BUILDING":
    case "INITIALIZING":
    case "QUEUED":
    case "PENDING":
      return "building";
    case "ERROR":
    case "FAILED":
    case "CANCELED":
    case "CANCELLED":
      return "error";
    default:
      return "unknown";
  }
}
