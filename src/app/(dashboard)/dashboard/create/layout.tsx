"use client";

import { Image as ImageIcon } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import { useEffect, useState } from "react";
import { env } from "~/env";
import { Image as ImageKitImage } from "@imagekit/next";
import { getUserProjects } from "~/actions/projects";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "~/redux/store";
import { setUserProjects } from "~/redux/slices/projectSlice";
import { useRouter } from "next/navigation";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxUserProjects = useSelector(
    (state: RootState) => state.projectReducer.projects,
  );

  useEffect(() => {
    const initializeData = async () => {
      try {
        await authClient.getSession();

        // Fetch user projects
        const projectsResult = await getUserProjects();
        if (projectsResult.success && projectsResult.projects) {
          const projects = projectsResult.projects.map((project) => ({
            ...project,
            createdAt: new Date(project.createdAt).toISOString(),
            updatedAt: new Date(project.updatedAt).toISOString(),
          }));
          dispatch(setUserProjects(projects));
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    void initializeData();
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      {/* Top Navbar - Ultra Compact */}
      <div className="border-b border-gray-200 bg-white py-2">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="from-primary to-primary/70 mb-1 bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent">
            Create AI Images
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xl text-xs">
            Upload and transform images with AI tools
          </p>
        </div>
      </div>

      {/* Main Content Area - Effects and Preview */}
      <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
        {children}
      </div>
      {/* Recent Projects Section */}
      <div className="border-t border-gray-200 bg-white px-2 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 text-center">
            <div className="mb-2 inline-flex items-center gap-2">
              <div className="h-6 w-0.5 rounded-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
              <h2 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-xl font-bold text-transparent">
                Your Recent Projects
              </h2>
              <div className="h-6 w-0.5 rounded-full bg-gradient-to-b from-purple-600 to-blue-500"></div>
            </div>
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              Continue editing your previous creations
            </p>
          </div>
        </div>
      </div>

      {isLoadingProjects ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-6">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <div className="animate-reverse absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-r-purple-600"></div>
          </div>
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold text-gray-900">
              Loading your projects...
            </p>
            <p className="text-muted-foreground text-sm">
              Fetching your creative works
            </p>
          </div>
        </div>
      ) : reduxUserProjects.length > 0 ? (
        <div className="mb-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {reduxUserProjects.slice(0, 12).map((project, _index) => (
              <div
                key={project.id}
                className="group relative cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/create/${project.id}/edit`)
                }
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl">
                  {/* Hover overlay with gradient */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 transition-all duration-500 group-hover:from-blue-500/20 group-hover:to-purple-600/20"></div>

                  {/* Main image */}
                  <div className="relative h-full w-full overflow-hidden">
                    <ImageKitImage
                      urlEndpoint={env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                      src={project.filePath}
                      alt={project.name ?? "Project"}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      transformation={[
                        {
                          width: 300,
                          height: 300,
                          crop: "maintain_ratio",
                          quality: 90,
                        },
                      ]}
                    />

                    {/* Shimmer effect on hover */}
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-transform duration-1000 group-hover:translate-x-full group-hover:opacity-100"></div>
                  </div>

                  {/* Content overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 transform bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
                    <div className="space-y-1">
                      <h3 className="truncate text-sm font-bold text-white drop-shadow-lg">
                        {project.name ?? "Untitled Project"}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/90 drop-shadow-md">
                          {new Date(project.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="rounded-full bg-white/20 px-2 py-1 backdrop-blur-sm">
                            <span className="text-xs font-medium text-white">
                              Edit
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 h-0 w-0 border-t-[20px] border-l-[20px] border-t-blue-500 border-l-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Show more indicator if there are more than 12 projects */}
          {reduxUserProjects.length > 12 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-blue-700">
                  Showing 12 of {reduxUserProjects.length} projects
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="relative mx-auto mb-8">
            {/* Animated background circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-blue-100 to-purple-100"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-blue-200 to-purple-200"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            {/* Icon container */}
            <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white shadow-lg">
              <ImageIcon className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">No projects yet</h3>
            <p className="text-muted-foreground mx-auto max-w-md text-lg leading-relaxed">
              Start your creative journey by uploading your first image and
              transforming it with AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
