import { getUploadAuthParams } from "@imagekit/next/server";
import { env } from "~/env";

export const GET = async (request: Request) => {
  try {
    const { token, expire, signature } = getUploadAuthParams({
      privateKey: env.IMAGEKIT_PRIVATE_KEY as string, // Never expose this on client side
      publicKey: env.IMAGEKIT_PUBLIC_KEY as string,
      // expire: 30 * 60, // Optional, controls the expiry time of the token in seconds, maximum 1 hour in the future
      // token: "random-token", // Optional, a unique token for request
    });

    return Response.json({
      token,
      expire,
      signature,
      publicKey: env.IMAGEKIT_PUBLIC_KEY as string,
      urlEndpoint: env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT as string,
    });
  } catch (error) {
    console.error("Error generating upload auth params:", error);
    return Response.json(
      { error: "Failed to generate upload auth params" },
      { status: 500 },
    );
  }
};
