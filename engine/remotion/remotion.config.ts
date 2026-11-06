/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import fs from "node:fs";
import path from "node:path";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
// Thư mục file tĩnh (staticFile) = thư mục dự án đang bán (config.json). render:drive truyền --public-dir riêng.
// (Không import scripts/project.mjs: Remotion nạp file này ở dạng không có import.meta.url.)
let root = process.cwd();
while (!fs.existsSync(path.join(root, "CLAUDE.md")) && path.dirname(root) !== root) root = path.dirname(root);
const ma: string = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8")).duAnDangBan;
if (!/^[a-z0-9-]+$/.test(ma)) throw new Error(`Mã dự án trong config.json không hợp lệ: "${ma}"`);
Config.setPublicDir(path.join(root, "du-an", ma));
