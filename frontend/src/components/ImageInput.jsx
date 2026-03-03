import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import FileCard from "../common/FileCard";
import Feedback from "../common/Feedback";
import { uploadAndConvert } from "../services/apiService";
import {
  getExtension,
  isAcceptedFormat,
  generateSignature,
  formatOptions,
  PREVIEW_MAP,
  getCachedConversion,
  setCachedConversion,
  clearConversionCache,
} from "../utils/imageHelpers";

const BACKEND_URL = "http://localhost:8080";

export default function ImageInput({
  setConvertedUrl,
  setLoading,
  loading,
  setProgress,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [lastConversion, setLastConversion] = useState({
    signature: "",
    format: "",
  });

  const createdPreviewsRef = useRef([]);

  const makePreview = useCallback((file) => {
    const ext = getExtension(file.name);
    if (PREVIEW_MAP[ext]) return PREVIEW_MAP[ext];
    const url = URL.createObjectURL(file);
    createdPreviewsRef.current.push(url);
    return url;
  }, []);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles?.length) return;
      const valid = acceptedFiles
        .filter((f) => isAcceptedFormat(getExtension(f.name)))
        .map((f) => ({ file: f, preview: makePreview(f) }));

      if (!valid.length) {
        setFeedback({ type: "warn", message: "No supported files found." });
        return;
      }

      setSelectedFiles((prev) => [...prev, ...valid]);
      setFeedback({ type: "", message: "" });
    },
    [makePreview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
      "image/heic": [],
      "image/heif": [],
      "image/tiff": [],
    },
    multiple: true,
    onDrop: handleDrop,
  });

  const handleRemove = useCallback((index) => {
    setSelectedFiles((prev) => {
      const removed = prev[index];
      if (
        removed?.preview &&
        !Object.values(PREVIEW_MAP).includes(removed.preview)
      ) {
        try {
          URL.revokeObjectURL(removed.preview);
        } catch {}
        createdPreviewsRef.current = createdPreviewsRef.current.filter(
          (p) => p !== removed.preview
        );
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleReset = useCallback(() => {
    createdPreviewsRef.current.forEach((p) => {
      try {
        URL.revokeObjectURL(p);
      } catch {}
    });
    createdPreviewsRef.current = [];
    setSelectedFiles([]);
    setTargetFormat("");
    setFeedback({ type: "", message: "" });
    setConvertedUrl([]);
    setLastConversion({ signature: "", format: "" });
  }, [setConvertedUrl]);

  useEffect(
    () => () => {
      createdPreviewsRef.current.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
      createdPreviewsRef.current = [];
    },
    []
  );

  const verifyCachedFiles = useCallback(async (cachedFiles) => {
    console.log("🔍 Verifying cached files...");

    const verifiedFiles = await Promise.all(
      cachedFiles.map(async (file) => {
        try {
          const response = await fetch(file.url, { method: "HEAD" });
          if (response.ok) {
            console.log(`✅ Cached file exists: ${file.url}`);
            return file;
          } else {
            console.warn(
              `❌ Cached file missing (${response.status}): ${file.url}`
            );
            return null;
          }
        } catch (error) {
          console.warn(
            `❌ Cached file verification failed: ${file.url}`,
            error
          );
          return null;
        }
      })
    );

    const validFiles = verifiedFiles.filter((f) => f !== null);

    if (validFiles.length < cachedFiles.length) {
      console.warn(
        `⚠️ ${cachedFiles.length - validFiles.length} cached files are missing`
      );
      return null; // Return null to force reconversion
    }

    return validFiles;
  }, []);

  const handleConvert = useCallback(async () => {
    setFeedback({ type: "", message: "" });

    if (!selectedFiles.length)
      return setFeedback({
        type: "warn",
        message: "Select at least one file.",
      });
    if (!targetFormat)
      return setFeedback({ type: "warn", message: "Select a format." });

    for (const { file } of selectedFiles) {
      const ext = getExtension(file.name);
      if (
        ext === targetFormat.toLowerCase() ||
        (ext === "jpg" && targetFormat === "jpeg") ||
        (ext === "jpeg" && targetFormat === "jpg")
      ) {
        return setFeedback({
          type: "warn",
          message: `File "${file.name}" is already ${targetFormat}.`,
        });
      }
    }

    const filesToSend = selectedFiles.map((s) => s.file);
    const currSig = generateSignature(filesToSend);

    const cached = getCachedConversion(currSig, targetFormat);
    if (cached?.files?.length) {
      console.log("📦 Found cached conversion, verifying files...");
      const verifiedFiles = await verifyCachedFiles(cached.files);

      if (verifiedFiles) {
        // All files verified - use cache
        setConvertedUrl(verifiedFiles);
        setLastConversion({ signature: currSig, format: targetFormat });
        setFeedback({ type: "info", message: "Using cached result." });
        setProgress(100);
        setTimeout(() => setProgress(0), 700);
        console.log("✅ Using verified cached files");
        return;
      } else {
        // Files missing - clear cache and reconvert
        console.warn(
          "⚠️ Cached files missing, clearing cache and reconverting..."
        );
        const cache = JSON.parse(
          localStorage.getItem("desipix_conversion_cache_v1") || "{}"
        );
        delete cache[`${currSig}::${targetFormat}`];
        localStorage.setItem(
          "desipix_conversion_cache_v1",
          JSON.stringify(cache)
        );
      }
    }

    if (
      lastConversion.signature === currSig &&
      lastConversion.format === targetFormat
    ) {
      return setFeedback({
        type: "warn",
        message: "Already converted this selection.",
      });
    }

    setLoading(true);
    setProgress(0);

    try {
      const data = await uploadAndConvert(filesToSend, targetFormat, (p) =>
        setProgress(Math.min(p, 85))
      );

      if (data?.success && Array.isArray(data.files)) {
        const prefixed = data.files.map((f) => ({
          ...f,
          url: `${BACKEND_URL}${f.url}`,
        }));
        setConvertedUrl(prefixed);
        setLastConversion({ signature: currSig, format: targetFormat });
        setCachedConversion(currSig, targetFormat, prefixed);
      } else {
        setFeedback({
          type: "error",
          message: "Conversion failed. Try again.",
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setFeedback({
          type: "warn",
          message: "Already converted earlier. Reset or choose another format.",
        });
      } else {
        setFeedback({
          type: "error",
          message: "Failed to convert image. Try again.",
        });
      }
    } finally {
      setLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 800);
    }
  }, [
    selectedFiles,
    targetFormat,
    lastConversion,
    setConvertedUrl,
    setLoading,
    setProgress,
    verifyCachedFiles,
  ]);

  const formatDropdown = useMemo(
    () => (
      <select
        aria-label="Select target format"
        className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 cursor-pointer transition"
        value={targetFormat}
        onChange={(e) => setTargetFormat(e.target.value)}
      >
        <option value="" disabled hidden>
          Select Format
        </option>
        {formatOptions.map((fmt) => (
          <option key={fmt} value={fmt}>
            {fmt.toUpperCase()}
          </option>
        ))}
      </select>
    ),
    [targetFormat]
  );

  return (
    <div
      id="imageInput"
      aria-busy={loading}
      role="region"
      className="w-full md:w-1/2 h-full flex flex-col bg-gray-100 p-6 rounded-lg shadow-lg"
    >
      <h1 className="text-xl font-semibold mb-4">Upload Image</h1>

      {selectedFiles.length ? (
        <>
          <div
            role="list"
            className="max-h-[50vh] md:max-h-96 overflow-y-auto grid gap-4 mb-4"
          >
            {selectedFiles.map((entry, idx) => (
              <FileCard
                key={`${entry.file.name}_${entry.file.size}_${entry.file.lastModified}`}
                entry={entry}
                onRemove={() => handleRemove(idx)}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 p-5 justify-between items-stretch w-full">
            <div className="w-full sm:flex-1 min-w-[150px]">
              {formatDropdown}
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-y-3 sm:gap-y-0 sm:gap-x-4">
              <button
                type="button"
                aria-label="Convert selected images"
                title="Convert selected images"
                onClick={handleConvert}
                disabled={loading || !selectedFiles.length || !targetFormat}
                className={`transition duration-200 text-white px-6 py-2 w-full sm:w-auto rounded shadow-md
                  ${
                    !selectedFiles.length || !targetFormat || loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-900 hover:bg-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  }`}
              >
                Convert
              </button>

              <button
                type="button"
                aria-label="Reset selected images"
                title="Reset selected images"
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 w-full sm:w-auto rounded shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      ) : (
        <div
          {...getRootProps()}
          className={`w-full p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors duration-300
    ${
      isDragActive
        ? "bg-indigo-50 border-indigo-500"
        : "bg-white hover:bg-gray-100 border-[#1B2B55]"
    }`}
        >
          <input {...getInputProps()} aria-label="Upload images" />
          <label className="block cursor-pointer">
            <p className="font-medium">Upload or drag your images here</p>
            <p className="text-xs text-gray-500">
              Supports PNG, JPEG, HEIC, TIFF — multiple files allowed.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Click to choose files or drop them here.
            </p>
          </label>
        </div>
      )}

      <Feedback feedback={feedback} />
    </div>
  );
}
