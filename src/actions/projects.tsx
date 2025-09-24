"use server";

import { db } from "~/server/db";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import ImageKit from "@imagekit/nodejs";

interface CreateProjectData {
  imageUrl: string;
  imageKitId: string;
  filePath: string;
  name?: string;
}

const cachedProjects = unstable_cache(
  async (userId: string) => {
    return db.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
  ["user-projects"],
  { revalidate: 10 },
);

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

export async function createProject(data: CreateProjectData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const project = await db.project.create({
      data: {
        name: data.name ?? "Untitled Project",
        imageUrl: data.imageUrl,
        imageKitId: data.imageKitId,
        filePath: data.filePath,
        userId: session.user.id,
      },
    });

    return { success: true, project };
  } catch (error) {
    console.error("Project creation error:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function getUserProjects() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const projects = await cachedProjects(session.user.id);

    return { success: true, projects };
  } catch (error) {
    console.error("Projects fetch error:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function deductCredits(
  creditsToDeduct: number,
  operation?: string,
) {
  try {
    // Input validation - prevent negative numbers or invalid inputs
    if (
      !creditsToDeduct ||
      creditsToDeduct <= 0 ||
      !Number.isInteger(creditsToDeduct)
    ) {
      return { success: false, error: "Invalid credit amount" };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // First check if user has enough credits
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < creditsToDeduct) {
      return { success: false, error: "Insufficient credits" };
    }

    // Deduct the specified amount of credits
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { credits: user.credits - creditsToDeduct },
    });

    return { success: true, remainingCredits: updatedUser.credits };
  } catch (error) {
    console.error(
      `Credit deduction error${operation ? ` for ${operation}` : ""}:`,
      error,
    );
    return { success: false, error: "Failed to deduct credits" };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    // Verify project ownership before deletion
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== session.user.id) {
      throw new Error("Project not found or access denied");
    }

    // delete image from ImageKit
    if (project.imageKitId) {
      try {
        await imagekit.files.delete(project.imageKitId);
      } catch (err) {
        console.error("Failed to delete image in ImageKit:", err);
      }
    }

    await db.project.delete({
      where: { id: projectId },
    });

    return { success: true };
  } catch (error) {
    console.error("Project deletion error:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function getProjectById(projectId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const project = await db.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    });
    if (!project) {
      throw new Error("Project not found");
    }
    return { success: true, project };
  } catch (error) {
    console.error("Project fetch error:", error);
    return { success: false, error: "Failed to fetch project" };
  }
}
