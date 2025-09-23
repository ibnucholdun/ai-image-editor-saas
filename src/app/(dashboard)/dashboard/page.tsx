import { getUserDetails } from "~/actions/users";
import DashboardView from "./_components/DashboardView";
import { getUserProjects } from "~/actions/projects";

interface Project {
  id: string;
  name: string | null;
  imageUrl: string;
  imageKitId: string;
  filePath: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
interface ProjectDTO {
  id: string;
  name: string | null;
  imageUrl: string;
  imageKitId: string;
  filePath: string;
  userId: string;
  createdAt: string;
}

export default async function DashboardPage() {
  const res = await getUserProjects();
  const user: { name: string | null; createdAt: Date | null } | null =
    await getUserDetails();
  const projects: Project[] = res?.projects ?? [];

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    totalProjects: projects.length,
    thisMonth: projects.filter((p) => new Date(p.createdAt) >= thisMonth)
      .length,
    thisWeek: projects.filter((p) => new Date(p.createdAt) >= thisWeek).length,
  };

  // Serialize untuk client
  const serializedProjects: ProjectDTO[] = projects.map((p) => ({
    ...p,
    createdAt: new Date(p.createdAt).toISOString(),
  }));

  console.log(stats);

  return (
    <DashboardView
      initialProjects={serializedProjects}
      initialStats={stats}
      user={user}
    />
  );
}
