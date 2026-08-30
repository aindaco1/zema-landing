const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const YAML = require("yaml");
const { parseReleasePayload, resolveRepositoryPath, root, toPublicPath } = require("./contract");

const MAX_REPOSITORY_MEDIA_BYTES = 45 * 1024 * 1024;
const FRAME_RATE = "24000/1001";

function run(command, args, label, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: options.timeout || 30 * 60 * 1000,
  });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label}: ${(result.stderr || result.stdout || "command failed").trim()}`);
  return result.stdout;
}

function probe(filePath, entries = "format:stream") {
  const output = run("ffprobe", [
    "-v", "error",
    "-show_entries", entries,
    "-of", "json",
    filePath,
  ], `Could not inspect ${path.basename(filePath)}`, { timeout: 2 * 60 * 1000 });
  return JSON.parse(output);
}

function durationFrom(probeResult) {
  const duration = Number(probeResult.format?.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Source duration could not be determined");
  return duration;
}

function temporaryPath(outputPath, jobId) {
  const extension = path.extname(outputPath);
  return path.join(path.dirname(outputPath), `${path.basename(outputPath, extension)}.tmp-${jobId}${extension}`);
}

function webpIntermediatePath(outputPath, jobId) {
  return path.join(path.dirname(outputPath), `${path.basename(outputPath, path.extname(outputPath))}.tmp-${jobId}.png`);
}

function cropFilter(width, height, focalX, focalY, includeFrameRate = false) {
  const x = (focalX / 100).toFixed(4);
  const y = (focalY / 100).toFixed(4);
  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${width}:${height}:(in_w-out_w)*${x}:(in_h-out_h)*${y}`,
    "setsar=1",
  ];
  if (includeFrameRate) filters.push(`fps=${FRAME_RATE}`);
  return filters.join(",");
}

function yamlPath(dottedPath) {
  return dottedPath.split(".").map((segment) => /^\d+$/.test(segment) ? Number(segment) : segment);
}

function ffmpegBase(inputPath) {
  return ["-y", "-hide_banner", "-nostdin", "-loglevel", "warning", "-stats_period", "15", "-stats", "-i", inputPath];
}

function atomicReplace(temporary, output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.renameSync(temporary, output);
}

function convertPngToWebp(pngPath, webpPath, quality, label) {
  run("cwebp", [
    "-quiet",
    "-q", String(quality),
    "-m", "6",
    "-metadata", "none",
    pngPath,
    "-o", webpPath,
  ], label, { timeout: 5 * 60 * 1000 });
}

function encodeVideo(inputPath, output, payload, slot) {
  const outputPath = resolveRepositoryPath(output.path);
  const temporary = temporaryPath(outputPath, payload.jobId);
  let selectedCrf = output.crf;
  for (let crf = output.crf; crf <= 31; crf += 2) {
    selectedCrf = crf;
    console.log(`Encoding ${slot.id} video at CRF ${crf}…`);
    run("ffmpeg", [
      ...ffmpegBase(inputPath),
      "-map", "0:v:0",
      "-an",
      "-vf", cropFilter(output.width, output.height, payload.focalX, payload.focalY, true),
      "-fps_mode", "cfr",
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", String(crf),
      "-g", "1",
      "-keyint_min", "1",
      "-sc_threshold", "0",
      "-bf", "0",
      "-pix_fmt", "yuv420p",
      "-map_metadata", "-1",
      "-movflags", "+faststart",
      temporary,
    ], `Video transcode failed for ${slot.id}`);
    if (fs.statSync(temporary).size <= MAX_REPOSITORY_MEDIA_BYTES) break;
  }
  const encodedSize = fs.statSync(temporary).size;
  if (encodedSize > MAX_REPOSITORY_MEDIA_BYTES) {
    throw new Error(`${slot.id} is ${encodedSize} bytes after CRF ${selectedCrf}; repository media must remain below ${MAX_REPOSITORY_MEDIA_BYTES}`);
  }
  atomicReplace(temporary, outputPath);
  return outputPath;
}

function encodePoster(videoPath, output, payload, slot) {
  const outputPath = resolveRepositoryPath(output.path);
  const temporary = temporaryPath(outputPath, payload.jobId);
  const intermediate = webpIntermediatePath(outputPath, payload.jobId);
  console.log(`Generating ${slot.id} poster from the exact first encoded frame…`);
  try {
    run("ffmpeg", [
      ...ffmpegBase(videoPath),
      "-map", "0:v:0",
      "-frames:v", "1",
      "-vf", `scale=${output.width}:${output.height}:flags=lanczos,setsar=1`,
      "-c:v", "png",
      "-map_metadata", "-1",
      intermediate,
    ], `Poster frame extraction failed for ${slot.id}`);
    convertPngToWebp(intermediate, temporary, output.quality, `Poster compression failed for ${slot.id}`);
    atomicReplace(temporary, outputPath);
  } finally {
    fs.rmSync(intermediate, { force: true });
    fs.rmSync(temporary, { force: true });
  }
  return outputPath;
}

function encodeImage(inputPath, output, payload, slot) {
  const outputPath = resolveRepositoryPath(output.path);
  const temporary = temporaryPath(outputPath, payload.jobId);
  const extension = path.extname(outputPath).toLowerCase();
  const webp = extension === ".webp";
  const intermediate = webp ? webpIntermediatePath(outputPath, payload.jobId) : temporary;
  console.log(`Encoding ${slot.id} image…`);
  try {
    run("ffmpeg", [
      ...ffmpegBase(inputPath),
      "-map", "0:v:0",
      "-frames:v", "1",
      "-vf", cropFilter(output.width, output.height, payload.focalX, payload.focalY),
      ...(webp ? ["-c:v", "png"] : ["-c:v", "mjpeg", "-q:v", "2", "-pix_fmt", "yuvj420p"]),
      "-map_metadata", "-1",
      intermediate,
    ], `Image transcode failed for ${slot.id}`);
    if (webp) convertPngToWebp(intermediate, temporary, output.quality, `Image compression failed for ${slot.id}`);
    atomicReplace(temporary, outputPath);
  } finally {
    if (webp) fs.rmSync(intermediate, { force: true });
    fs.rmSync(temporary, { force: true });
  }
  return outputPath;
}

function encodeAudio(inputPath, output, payload, slot) {
  const outputPath = resolveRepositoryPath(output.path);
  const temporary = temporaryPath(outputPath, payload.jobId);
  const codecArgs = output.codec === "libopus"
    ? ["-c:a", "libopus", "-b:a", output.bitrate, "-vbr", "on", "-compression_level", "10", "-application", "audio"]
    : ["-c:a", "aac", "-b:a", output.bitrate, "-movflags", "+faststart"];
  console.log(`Encoding ${slot.id} ${output.role}; mastered loudness is unchanged…`);
  run("ffmpeg", [
    ...ffmpegBase(inputPath),
    "-map", "0:a:0",
    "-vn",
    ...codecArgs,
    "-map_metadata", "-1",
    temporary,
  ], `Audio transcode failed for ${slot.id}`);
  atomicReplace(temporary, outputPath);
  return outputPath;
}

function validateSource(inputPath, payload, slot) {
  const source = probe(inputPath);
  const duration = slot.kind === "image" ? null : durationFrom(source);
  if (duration && duration > slot.maxDurationSeconds + 0.05) throw new Error(`${slot.id} is ${duration.toFixed(2)}s; limit is ${slot.maxDurationSeconds}s`);
  if (slot.kind === "video") {
    const stream = source.streams?.find((candidate) => candidate.codec_type === "video");
    if (!stream) throw new Error("Video source has no video stream");
    if (!slot.acceptedCodecs.includes(stream.codec_name)) throw new Error(`Video codec ${stream.codec_name || "unknown"} is not accepted`);
    if (stream.width > slot.maxWidth || stream.height > slot.maxHeight) throw new Error(`Video dimensions ${stream.width}×${stream.height} exceed ${slot.maxWidth}×${slot.maxHeight}`);
  } else if (slot.kind === "audio") {
    if (!source.streams?.some((candidate) => candidate.codec_type === "audio")) throw new Error("Audio source has no audio stream");
  } else if (!source.streams?.some((candidate) => candidate.codec_type === "video")) {
    throw new Error("Image source could not be decoded");
  }
  return { duration };
}

function validateOutput(filePath, output) {
  const size = fs.statSync(filePath).size;
  if (size <= 0 || size > MAX_REPOSITORY_MEDIA_BYTES) throw new Error(`${path.basename(filePath)} has an invalid repository size: ${size}`);
  run("ffmpeg", ["-v", "error", "-nostdin", "-i", filePath, "-f", "null", "-"], `Full decode failed for ${path.basename(filePath)}`);
  const result = probe(filePath);
  if (output.role === "video") {
    const stream = result.streams?.find((candidate) => candidate.codec_type === "video");
    if (!stream || stream.codec_name !== "h264" || stream.width !== output.width || stream.height !== output.height || stream.pix_fmt !== "yuv420p") {
      throw new Error(`${path.basename(filePath)} does not match the H.264 output contract`);
    }
    const keyFrames = run("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "frame=key_frame",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ], `Could not inspect keyframes for ${path.basename(filePath)}`);
    const flags = keyFrames.trim().split(/\s+/).filter(Boolean);
    if (!flags.length || flags.some((flag) => flag !== "1")) throw new Error(`${path.basename(filePath)} must contain only independently decodable frames`);
  }
  if (output.width && output.height && output.role !== "video") {
    const stream = result.streams?.find((candidate) => candidate.codec_type === "video");
    if (!stream || stream.width !== output.width || stream.height !== output.height) throw new Error(`${path.basename(filePath)} has incorrect dimensions`);
  }
  return { size, probe: result };
}

async function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

function updateContent(slot, payload) {
  const framesPath = resolveRepositoryPath("_data/frames.yml");
  const framesDocument = YAML.parseDocument(fs.readFileSync(framesPath, "utf8"), { keepSourceTokens: true });
  for (const output of slot.outputs) framesDocument.setIn(yamlPath(output.contentPath), toPublicPath(output.path));
  if (slot.focalPaths) {
    framesDocument.setIn(yamlPath(slot.focalPaths.x), payload.focalX);
    framesDocument.setIn(yamlPath(slot.focalPaths.y), payload.focalY);
  }
  const framesTemporary = temporaryPath(framesPath, payload.jobId);
  fs.writeFileSync(framesTemporary, framesDocument.toString({ lineWidth: 0, flowCollectionPadding: false }), { mode: 0o644 });
  atomicReplace(framesTemporary, framesPath);

  const configPath = resolveRepositoryPath("_config.yml");
  const config = fs.readFileSync(configPath, "utf8");
  const version = `media-${payload.jobId.replace(/-/g, "").slice(0, 12)}`;
  const updated = config.replace(/^asset_version:\s*.*$/m, `asset_version: "${version}"`);
  if (updated === config) throw new Error("Could not update _config.yml asset_version");
  const configTemporary = temporaryPath(configPath, payload.jobId);
  fs.writeFileSync(configTemporary, updated, { mode: 0o644 });
  atomicReplace(configTemporary, configPath);
  return version;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || !path.isAbsolute(inputPath)) throw new Error("An absolute raw source path is required");
  const { payload, slot } = parseReleasePayload();
  const inputStat = fs.statSync(inputPath);
  if (!inputStat.isFile() || inputStat.size !== payload.size) throw new Error(`Raw source is ${inputStat.size} bytes; expected ${payload.size}`);
  const source = validateSource(inputPath, payload, slot);
  const generated = [];

  if (slot.kind === "video") {
    const videoOutput = slot.outputs.find((output) => output.role === "video");
    const posterOutput = slot.outputs.find((output) => output.role === "poster");
    if (!videoOutput || !posterOutput) throw new Error(`${slot.id} is missing its video or poster output`);
    const videoPath = encodeVideo(inputPath, videoOutput, payload, slot);
    generated.push({ output: videoOutput, filePath: videoPath });
    generated.push({ output: posterOutput, filePath: encodePoster(videoPath, posterOutput, payload, slot) });
  } else if (slot.kind === "audio") {
    for (const output of slot.outputs) generated.push({ output, filePath: encodeAudio(inputPath, output, payload, slot) });
  } else {
    for (const output of slot.outputs) generated.push({ output, filePath: encodeImage(inputPath, output, payload, slot) });
  }

  const outputs = [];
  for (const item of generated) {
    const validation = validateOutput(item.filePath, item.output);
    outputs.push({
      role: item.output.role,
      path: path.relative(root, item.filePath),
      bytes: validation.size,
      sha256: await hashFile(item.filePath),
    });
  }
  const assetVersion = updateContent(slot, payload);
  const report = {
    version: 1,
    jobId: payload.jobId,
    slotId: slot.id,
    source: { fileName: payload.fileName, bytes: payload.size, duration: source.duration },
    assetVersion,
    outputs,
    generatedAt: new Date().toISOString(),
  };
  if (process.env.MEDIA_RELEASE_REPORT) {
    fs.mkdirSync(path.dirname(process.env.MEDIA_RELEASE_REPORT), { recursive: true });
    fs.writeFileSync(process.env.MEDIA_RELEASE_REPORT, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
