(() => {
  "use strict";

  const form = document.querySelector("#upload-form");
  const slotSelect = document.querySelector("#slot");
  const fileInput = document.querySelector("#file");
  const uploadButton = document.querySelector("#upload-button");
  const cancelButton = document.querySelector("#cancel-button");
  const focalFields = document.querySelector("#focal-fields");
  const focalX = document.querySelector("#focal-x");
  const focalY = document.querySelector("#focal-y");
  const slotDescription = document.querySelector("#slot-description");
  const fileRules = document.querySelector("#file-rules");
  const progressPanel = document.querySelector(".progress-panel");
  const progress = document.querySelector("#progress");
  const progressCopy = document.querySelector("#progress-copy");
  const status = document.querySelector("#status");
  const releaseLink = document.querySelector("#release-link");
  const releaseAnchor = releaseLink.querySelector("a");

  let slots = [];
  let uploadConfig = null;
  let activeUpload = null;

  function humanBytes(bytes) {
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = units.shift();
    while (value >= 1024 && units.length) {
      value /= 1024;
      unit = units.shift();
    }
    return `${value >= 10 || unit === "B" ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
  }

  function selectedSlot() {
    return slots.find((slot) => slot.id === slotSelect.value);
  }

  function setBusy(busy) {
    slotSelect.disabled = busy;
    fileInput.disabled = busy || !selectedSlot();
    uploadButton.disabled = busy || !selectedSlot() || !fileInput.files.length;
    cancelButton.hidden = !busy;
  }

  function updateSlotDetails() {
    const slot = selectedSlot();
    if (!slot) {
      slotDescription.textContent = "";
      fileRules.textContent = "Choose a slot to see its accepted formats and limits.";
      fileInput.disabled = true;
      fileInput.removeAttribute("accept");
      focalFields.hidden = true;
      uploadButton.disabled = true;
      return;
    }

    slotDescription.textContent = slot.description;
    const limits = [`${slot.acceptedExtensions.map((extension) => extension.toUpperCase()).join(", ")}`, `up to ${humanBytes(slot.maxBytes)}`];
    if (slot.maxDurationSeconds) limits.push(`up to ${slot.maxDurationSeconds < 120 ? `${slot.maxDurationSeconds} seconds` : `${slot.maxDurationSeconds / 60} minutes`}`);
    if (slot.maxWidth && slot.maxHeight) limits.push(`up to ${slot.maxWidth}×${slot.maxHeight}`);
    fileRules.textContent = limits.join(" · ");
    fileInput.accept = slot.acceptedExtensions.map((extension) => `.${extension}`).join(",");
    fileInput.disabled = false;
    focalFields.hidden = !slot.hasFocalPoint;
    uploadButton.disabled = !fileInput.files.length;
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({ error: `Request failed with ${response.status}` }));
    if (!response.ok) throw new Error(payload.error || `Request failed with ${response.status}`);
    return payload;
  }

  function updateProgress(uploadedByPart, totalBytes, startedAt) {
    const uploaded = Array.from(uploadedByPart.values()).reduce((sum, bytes) => sum + bytes, 0);
    const percent = totalBytes ? Math.min(100, (uploaded / totalBytes) * 100) : 0;
    const elapsedSeconds = Math.max(0.1, (performance.now() - startedAt) / 1000);
    progress.value = percent;
    progress.textContent = `${Math.round(percent)}%`;
    progressCopy.textContent = `${humanBytes(uploaded)} of ${humanBytes(totalBytes)} · ${humanBytes(uploaded / elapsedSeconds)}/s`;
  }

  function uploadPart(upload, partNumber, blob, uploadedByPart) {
    return new Promise((resolve, reject) => {
      let attempt = 0;

      function send() {
        if (upload.cancelled) {
          reject(new DOMException("Upload cancelled", "AbortError"));
          return;
        }

        attempt += 1;
        const xhr = new XMLHttpRequest();
        upload.requests.add(xhr);
        const query = new URLSearchParams({ key: upload.key, uploadId: upload.uploadId });
        xhr.open("PUT", `/admin/api/uploads/${upload.jobId}/parts/${partNumber}?${query}`);
        xhr.responseType = "json";
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            uploadedByPart.set(partNumber, event.loaded);
            updateProgress(uploadedByPart, upload.file.size, upload.startedAt);
          }
        });
        xhr.addEventListener("loadend", () => upload.requests.delete(xhr));
        xhr.addEventListener("abort", () => reject(new DOMException("Upload cancelled", "AbortError")));
        xhr.addEventListener("error", () => retryOrReject(new Error(`Part ${partNumber} failed to upload`)));
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.etag) {
            uploadedByPart.set(partNumber, blob.size);
            updateProgress(uploadedByPart, upload.file.size, upload.startedAt);
            resolve({ partNumber, etag: xhr.response.etag });
            return;
          }
          retryOrReject(new Error(xhr.response?.error || `Part ${partNumber} failed with ${xhr.status}`));
        });

        function retryOrReject(error) {
          if (upload.cancelled) {
            reject(new DOMException("Upload cancelled", "AbortError"));
          } else if (attempt < 3) {
            window.setTimeout(send, attempt * 750);
          } else {
            reject(error);
          }
        }

        xhr.send(blob);
      }

      send();
    });
  }

  async function uploadAllParts(upload) {
    const partSize = uploadConfig.partSizeBytes;
    const partCount = Math.ceil(upload.file.size / partSize);
    const results = new Array(partCount);
    const uploadedByPart = new Map();
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < partCount && !upload.cancelled) {
        const index = nextIndex;
        nextIndex += 1;
        const partNumber = index + 1;
        const start = index * partSize;
        const end = Math.min(upload.file.size, start + partSize);
        results[index] = await uploadPart(upload, partNumber, upload.file.slice(start, end), uploadedByPart);
      }
    }

    const concurrency = Math.min(uploadConfig.maxConcurrentParts, partCount);
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    if (upload.cancelled) throw new DOMException("Upload cancelled", "AbortError");
    return results;
  }

  async function cancelUpload() {
    const upload = activeUpload;
    if (!upload) return;
    upload.cancelled = true;
    for (const request of upload.requests) request.abort();
    status.textContent = "Cancelling upload…";
    try {
      await requestJson("/admin/api/uploads", {
        method: "DELETE",
        body: JSON.stringify({ key: upload.key, uploadId: upload.uploadId, jobId: upload.jobId }),
      });
      status.textContent = "Upload cancelled. No release was triggered.";
    } catch (error) {
      status.textContent = `The browser upload stopped, but R2 cleanup could not be confirmed: ${error.message}`;
    } finally {
      activeUpload = null;
      setBusy(false);
    }
  }

  async function beginUpload(event) {
    event.preventDefault();
    const slot = selectedSlot();
    const file = fileInput.files[0];
    if (!slot || !file) return;

    status.textContent = "";
    releaseLink.hidden = true;
    progressPanel.hidden = false;
    progress.value = 0;
    progressCopy.textContent = "Preparing multipart upload…";
    setBusy(true);

    try {
      const started = await requestJson("/admin/api/uploads", {
        method: "POST",
        body: JSON.stringify({
          slotId: slot.id,
          fileName: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          focalX: Number(focalX.value),
          focalY: Number(focalY.value),
        }),
      });

      activeUpload = {
        ...started,
        file,
        requests: new Set(),
        cancelled: false,
        startedAt: performance.now(),
      };
      status.textContent = "Uploading directly to private R2 storage…";
      const parts = await uploadAllParts(activeUpload);
      progress.value = 100;
      progressCopy.textContent = `${humanBytes(file.size)} uploaded. Starting release checks…`;

      const completed = await requestJson("/admin/api/uploads/complete", {
        method: "POST",
        body: JSON.stringify({
          jobId: activeUpload.jobId,
          slotId: slot.id,
          key: activeUpload.key,
          uploadId: activeUpload.uploadId,
          fileName: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          focalX: Number(focalX.value),
          focalY: Number(focalY.value),
          parts,
        }),
      });

      status.textContent = "Upload complete. GitHub is transcoding, testing, and publishing the release. Production remains unchanged unless every check passes.";
      if (completed.runUrl) {
        releaseAnchor.href = completed.runUrl;
        releaseLink.hidden = false;
      }
      form.reset();
      focalX.value = "50";
      focalY.value = "50";
      updateSlotDetails();
    } catch (error) {
      if (error.name !== "AbortError") status.textContent = `Upload stopped: ${error.message}`;
    } finally {
      activeUpload = null;
      setBusy(false);
    }
  }

  async function initialize() {
    try {
      const payload = await requestJson("/admin/api/slots");
      slots = payload.slots;
      uploadConfig = payload.upload;
      slotSelect.innerHTML = '<option value="">Choose a site slot</option>';
      for (const slot of slots) {
        const option = document.createElement("option");
        option.value = slot.id;
        option.textContent = slot.label;
        slotSelect.append(option);
      }
      slotSelect.disabled = false;
      status.textContent = payload.user ? `Signed in as ${payload.user}.` : "Signed in through Cloudflare Access.";
    } catch (error) {
      slotSelect.innerHTML = '<option value="">Uploader unavailable</option>';
      status.textContent = `The protected uploader could not initialize: ${error.message}`;
    }
  }

  slotSelect.addEventListener("change", updateSlotDetails);
  fileInput.addEventListener("change", () => { uploadButton.disabled = !selectedSlot() || !fileInput.files.length; });
  form.addEventListener("submit", beginUpload);
  cancelButton.addEventListener("click", cancelUpload);
  initialize();
})();
