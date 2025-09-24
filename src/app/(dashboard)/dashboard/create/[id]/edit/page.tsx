"use client";

import {
  Upload,
  X,
  Image as ImageIcon,
  Scissors,
  Download,
  Expand,
  Target,
  RotateCcw,
  Minus,
  Loader2,
  Trash,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { env } from "~/env";
import { Image as ImageKitImage } from "@imagekit/next";
import {
  deductCredits,
  deleteProject,
  getProjectById,
} from "~/actions/projects";

interface UploadedImage {
  fileId: string;
  url: string;
  name: string;
  filePath: string;
}

interface Transformation {
  aiRemoveBackground?: true;
  aiUpscale?: true;
  raw?: string;
}

export default function CreatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [objectInput, setObjectInput] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const initializeProjects = async () => {
      try {
        const data = await getProjectById(id);
        if (data?.project) {
          const project = data.project;
          const initialImage: UploadedImage = {
            fileId: project.imageKitId,
            url: project.imageUrl,
            name: project.name ?? "Untitled Project",
            filePath: project.filePath,
          };
          setUploadedImage(initialImage);
        }
      } catch (error) {
        console.error("Projects initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeProjects();
  }, [id]);

  // Function to get live preview transformation
  const getLivePreviewTransformations = () => {
    return [...transformations];
  };

  // Helper functions to check if transformations exist
  const hasTransformation = (type: string) => {
    return transformations.some((transform: Transformation) => {
      if (type === "background" && transform.aiRemoveBackground) return true;
      if (type === "upscale" && transform.aiUpscale) return true;
      if (
        type === "objectCrop" &&
        transform.raw?.includes("fo-") &&
        transform.raw?.includes("ar-1-1")
      )
        return true;
      return false;
    });
  };

  // Function to remove specific transformation
  const removeTransformation = (type: string) => {
    setTransformations((prev) =>
      prev.filter((transform: Transformation) => {
        if (type === "background" && transform.aiRemoveBackground) return false;
        if (type === "upscale" && transform.aiUpscale) return false;
        if (
          type === "objectCrop" &&
          transform.raw?.includes("fo-") &&
          transform.raw?.includes("ar-1-1")
        )
          return false;
        return true;
      }),
    );
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} transformation removed!`,
    );
  };

  const removeBackground = async () => {
    if (!uploadedImage) return;

    // Check if background removal already applied
    if (hasTransformation("background")) {
      toast.error("Background removal is already applied!");
      return;
    }

    setIsProcessing(true);

    try {
      // Deduct credits first
      const creditResult = await deductCredits(2, "background removal");

      if (!creditResult.success) {
        toast.error(creditResult.error ?? "Failed to process payment");
        setIsProcessing(false);
        return;
      }

      // Apply background removal transformation
      setTransformations((prev) => [...prev, { aiRemoveBackground: true }]);

      setTimeout(() => {
        setIsProcessing(false);
        toast.success(
          `Background removed! ${creditResult.remainingCredits} credits remaining.`,
        );
        // Refresh to update sidebar credits display
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background");
      setIsProcessing(false);
    }
  };

  const upscaleImage = async () => {
    if (!uploadedImage) return;

    // Check if upscale already applied
    if (hasTransformation("upscale")) {
      toast.error("Image upscaling is already applied!");
      return;
    }

    setIsProcessing(true);

    try {
      // Deduct credits first
      const creditResult = await deductCredits(1, "upscaling");

      if (!creditResult.success) {
        toast.error(creditResult.error ?? "Failed to process payment");
        setIsProcessing(false);
        return;
      }

      // Apply upscaling transformation
      setTransformations((prev) => [...prev, { aiUpscale: true }]);

      setTimeout(() => {
        setIsProcessing(false);
        toast.success(
          `Image upscaled! ${creditResult.remainingCredits} credits remaining.`,
        );
        // Refresh to update sidebar credits display
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error("Upscaling error:", error);
      toast.error("Failed to upscale image");
      setIsProcessing(false);
    }
  };

  const objectCrop = async () => {
    if (!uploadedImage) return;

    // Check if object crop already applied
    if (hasTransformation("objectCrop")) {
      toast.error("Smart object crop is already applied!");
      return;
    }

    // Validate object input
    if (!objectInput.trim()) {
      toast.error("Please enter an object to focus on!");
      return;
    }

    setIsProcessing(true);

    try {
      // Apply smart object crop using the user's input with 1:1 aspect ratio
      const cleanInput = objectInput.trim().toLowerCase();
      const transformation = { raw: `fo-${cleanInput},ar-1-1` };

      setTransformations((prev) => [...prev, transformation]);

      setTimeout(() => {
        setIsProcessing(false);
        toast.success(`Smart crop applied focusing on "${objectInput}"!`);
      }, 3000);
    } catch (error) {
      console.error("Object crop error:", error);
      toast.error("Failed to apply smart crop");
      setIsProcessing(false);
    }
  };

  const clearTransformations = () => {
    setTransformations([]);
    toast.success("All transformations cleared!");
  };

  const downloadImage = async () => {
    if (!uploadedImage) return;

    setIsDownloading(true);
    try {
      // Get the actual rendered image URL from the main preview
      const mainImage = document.querySelector(
        'img[width="800"][height="600"]',
      );
      const url =
        (mainImage as HTMLImageElement)?.src ??
        `${env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${uploadedImage.filePath}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = uploadedImage.name || "downloaded-image.jpg";
      link.click();

      URL.revokeObjectURL(blobUrl);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const deleteResult = await deleteProject(projectId);
      if (!deleteResult.success) {
        console.error("Failed to delete project");
        return;
      }
      router.push("/dashboard/create");
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-3">
      {/* Left Side - Effects and Controls (1/3 width) - Order 2 on mobile */}
      <div className="order-2 space-y-2 sm:space-y-3 lg:order-1 lg:col-span-1">
        <Card className="shadow-lg">
          <CardContent className="p-2 sm:p-3">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="mb-0.5 text-sm font-bold">AI Effects</h3>
                <p className="text-muted-foreground text-xs">
                  Transform your image
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-1">
                <div className="group relative">
                  <Button
                    onClick={removeBackground}
                    disabled={isProcessing || hasTransformation("background")}
                    variant="outline"
                    size="sm"
                    className="h-8 w-full gap-1 px-2 text-xs hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Scissors className="h-3 w-3" />
                    <span className="text-xs">
                      {isProcessing
                        ? "Processing..."
                        : hasTransformation("background")
                          ? "Removed ✓"
                          : "Remove BG"}
                    </span>
                    {!hasTransformation("background") && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        (2 credits)
                      </span>
                    )}
                  </Button>
                  {hasTransformation("background") && (
                    <Button
                      onClick={() => removeTransformation("background")}
                      disabled={isProcessing}
                      variant="destructive"
                      size="sm"
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Minus className="h-2 w-2" />
                    </Button>
                  )}
                </div>

                <div className="group relative">
                  <Button
                    onClick={upscaleImage}
                    disabled={isProcessing || hasTransformation("upscale")}
                    variant="outline"
                    size="sm"
                    className="h-8 w-full gap-1 px-2 text-xs hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Expand className="h-3 w-3" />
                    <span className="text-xs">
                      {isProcessing
                        ? "Processing..."
                        : hasTransformation("upscale")
                          ? "Upscaled ✓"
                          : "AI Upscale"}
                    </span>
                    {!hasTransformation("upscale") && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        (1 credit)
                      </span>
                    )}
                  </Button>
                  {hasTransformation("upscale") && (
                    <Button
                      onClick={() => removeTransformation("upscale")}
                      disabled={isProcessing}
                      variant="destructive"
                      size="sm"
                      className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Minus className="h-2 w-2" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-2">
                {/* Smart Object Crop Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-500 p-1">
                      <Target className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-green-900">
                        Smart Object Crop
                      </h4>
                      <p className="text-xs text-green-700">FREE</p>
                    </div>
                  </div>

                  <Input
                    placeholder="Enter object (e.g., person, car)"
                    value={objectInput}
                    onChange={(e) => {
                      setObjectInput(e.target.value);
                    }}
                    disabled={isProcessing || hasTransformation("objectCrop")}
                    className="h-7 border-green-200 bg-white text-xs focus:border-green-400 focus:ring-green-400"
                  />

                  <div className="rounded-md border border-green-200 bg-green-100/50 p-1.5">
                    <p className="text-xs text-green-800">
                      ✨ AI crops around specified object in 1:1 ratio
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      onClick={objectCrop}
                      disabled={
                        isProcessing ||
                        hasTransformation("objectCrop") ||
                        !objectInput.trim()
                      }
                      variant="default"
                      size="sm"
                      className="h-7 flex-1 gap-1 bg-green-600 px-2 text-white hover:bg-green-700"
                    >
                      <Target className="h-2 w-2" />
                      <span className="text-xs">
                        {isProcessing
                          ? "Processing..."
                          : hasTransformation("objectCrop")
                            ? "Applied ✓"
                            : "Apply"}
                      </span>
                    </Button>
                    {hasTransformation("objectCrop") && (
                      <Button
                        onClick={() => removeTransformation("objectCrop")}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 border-red-200 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {transformations.length > 0 && (
                <div className="py-1 text-center">
                  <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                    <span className="text-xs">
                      {transformations.length} applied
                    </span>
                  </div>
                </div>
              )}

              {transformations.length > 0 && (
                <Button
                  onClick={clearTransformations}
                  disabled={isProcessing}
                  variant="destructive"
                  size="sm"
                  className="h-7 w-full gap-1 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="text-xs">Clear All</span>
                </Button>
              )}

              <div className="grid gap-2 border-t pt-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/create")}
                  size="sm"
                  className="h-7 gap-1 px-2"
                >
                  <Upload className="h-3 w-3" />
                  <span className="text-xs">Upload</span>
                </Button>
                {transformations.length > 0 && (
                  <Button
                    onClick={downloadImage}
                    size="sm"
                    className="h-7 gap-1 bg-gradient-to-r from-blue-600 to-purple-600 px-2 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Download className="h-3 w-3" />
                    <span className="text-xs">
                      {isDownloading ? "Downloading..." : "Download"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Image Preview (2/3 width) - Order 1 on mobile */}
      <div className="order-1 space-y-2 sm:space-y-3 lg:order-2 lg:col-span-2">
        <Card className="shadow-lg">
          <CardContent className="p-2 sm:p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="mb-0.5 text-sm font-bold">Preview</h3>
                <p className="text-muted-foreground truncate text-xs">
                  {uploadedImage?.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 rounded-full p-0"
                onClick={() => handleDeleteProject(id)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </div>

            <div className="bg-muted relative overflow-hidden rounded-lg border">
              {isProcessing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <div className="relative mb-2">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    </div>
                    <p className="text-sm font-semibold">AI Processing...</p>
                    <p className="mt-1 text-xs text-white/80">Please wait</p>
                  </div>
                </div>
              )}
              {uploadedImage?.filePath && (
                <ImageKitImage
                  urlEndpoint={env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                  src={uploadedImage.filePath}
                  alt={uploadedImage.name || "Uploaded image"}
                  width={800}
                  height={600}
                  className="h-auto max-h-[600px] w-full object-contain"
                  transformation={getLivePreviewTransformations()}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
