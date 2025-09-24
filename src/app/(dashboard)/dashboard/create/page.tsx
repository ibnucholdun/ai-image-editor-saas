"use client";

import { Upload, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { upload } from "@imagekit/next";
import { createProject } from "~/actions/projects";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "~/redux/store";
import { addUserProject } from "~/redux/slices/projectSlice";

interface UploadAuthResponse {
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
}

export default function CreatePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const getUploadAuth = async (): Promise<UploadAuthResponse> => {
    const response = await fetch("/api/upload-auth");
    if (!response.ok) throw new Error("Auth failed");
    return response.json() as Promise<UploadAuthResponse>;
  };

  const selectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;

    setIsUploading(true);
    try {
      const authParams = await getUploadAuth();
      const result = await upload({
        file,
        fileName: file.name,
        folder: "/ai-image-editor",
        ...authParams,
      });

      const uploadedData = {
        fileId: result.fileId ?? "",
        url: result.url ?? "",
        name: result.name ?? file.name,
        filePath: result.filePath ?? "",
      };
      // Save project to database using server action
      try {
        const projectResult = await createProject({
          imageUrl: uploadedData.url,
          imageKitId: uploadedData.fileId,
          filePath: uploadedData.filePath,
          name: uploadedData.name,
        });
        router.push(`/dashboard/create/${projectResult.project?.id}/edit`);

        if (projectResult.success && projectResult.project) {
          const newProject = {
            ...projectResult.project,
            createdAt: new Date(projectResult.project.createdAt).toISOString(),
            updatedAt: new Date(projectResult.project.updatedAt).toISOString(),
          };
          // Refresh projects list
          dispatch(addUserProject(newProject));
        } else {
          console.error(
            "Failed to save project to database:",
            projectResult.error,
          );
        }
      } catch (dbError) {
        console.error("Database save error:", dbError);
      }

      toast.success("Upload successful!");
    } catch (error) {
      toast.error("Upload failed");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="w-full max-w-2xl">
        {isUploading ? (
          <div className="border-border from-muted/50 via-background to-muted/30 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-center shadow-xl sm:p-12">
            <div className="from-primary/5 to-primary/10 absolute inset-0 bg-gradient-to-br"></div>
            <div className="relative z-10">
              <div className="relative mb-6">
                {/* Animated loading rings */}
                <div className="border-muted border-t-primary mx-auto h-16 w-16 animate-spin rounded-full border-4"></div>
                <div
                  className="border-r-primary/70 absolute inset-0 mx-auto h-16 w-16 animate-spin rounded-full border-4 border-transparent"
                  style={{
                    animationDelay: "0.5s",
                    animationDirection: "reverse",
                  }}
                ></div>
              </div>
              <h3 className="text-foreground mb-2 text-lg font-bold">
                Uploading your image
              </h3>
              <p className="text-muted-foreground text-sm">
                Processing your file with AI magic ✨
              </p>
              <div className="bg-muted mx-auto mt-4 h-2 w-48 overflow-hidden rounded-full">
                <div className="bg-primary h-full animate-pulse rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="group border-border from-muted/30 via-background to-muted/50 hover:border-primary/50 hover:bg-muted/40 relative overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br p-6 text-center transition-all duration-300 hover:shadow-xl sm:p-12">
            {/* Background decoration */}
            <div className="from-primary/5 to-primary/10 absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

            {/* Floating icons background */}
            <div className="absolute top-4 right-4 opacity-20 transition-opacity duration-300 group-hover:opacity-40">
              <ImageIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-20 transition-opacity duration-300 group-hover:opacity-40">
              <Upload className="h-6 w-6 text-purple-400" />
            </div>

            <div className="relative z-10">
              {/* Main icon with gradient background */}
              <div className="bg-primary mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl">
                <ImageIcon className="text-primary-foreground h-12 w-12" />
              </div>

              {/* Content */}
              <h3 className="text-foreground mb-3 text-xl font-bold">
                Upload Your Image
              </h3>

              <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-gray-600">
                Click to browse and select your image. Transform it with
                powerful AI tools.
              </p>

              {/* Supported formats */}
              <div className="mb-6">
                <p className="mb-2 text-xs text-gray-500">Supported formats:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    JPG
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    PNG
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    WEBP
                  </span>
                </div>
              </div>

              {/* Call to action button */}
              <Button
                onClick={selectFile}
                size="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transform gap-2 px-6 py-2 text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                <Upload className="h-4 w-4" />
                Choose Your Image
              </Button>

              <p className="mt-3 text-xs text-gray-500">
                Select files from your device
              </p>
            </div>

            {/* Hover effect border */}
            <div className="bg-primary/10 absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={uploadFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
