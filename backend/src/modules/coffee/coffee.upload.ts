import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { raw } from "express";
import type { Router } from "express";
import sharp from "sharp";
import { z } from "zod";
import { HttpError } from "../../core/errors/http-error.js";
import { sendCreated } from "../../utils/response.js";
export const uploadDirectory = path.resolve("public/uploads");
export function setupUpload(router: Router): void {
  router.post(
    "/admin/uploads",
    raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }),
    (req, res, next): void => {
      const run = async (): Promise<void> => {
        const input = z.instanceof(Buffer).parse(req.body);
        if (!input.length) throw HttpError.badRequest("INVALID_IMAGE");
        const image = sharp(input, { limitInputPixels: 25000000 });
        const metadata = await image.metadata().catch(() => {
          throw HttpError.badRequest("INVALID_IMAGE");
        });
        if (
          !metadata.format ||
          !["jpeg", "png", "webp"].includes(metadata.format)
        )
          throw HttpError.badRequest("INVALID_IMAGE");
        const output = await image
          .rotate()
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer();
        const name = randomBytes(24).toString("hex") + ".webp";
        await mkdir(uploadDirectory, { recursive: true });
        await writeFile(path.join(uploadDirectory, name), output, {
          flag: "wx",
        });
        sendCreated(res, { image: "/assets/uploads/" + name });
      };
      void run().catch(next);
    },
  );
}
