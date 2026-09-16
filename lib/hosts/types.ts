export type HostProject = {
  id: string;
  name: string;
};

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
