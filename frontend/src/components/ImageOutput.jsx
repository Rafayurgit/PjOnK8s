import React, { useCallback, useMemo } from "react";
import FileCard from "../common/FileCard";
import ComponentLoader from "./ComponentLoader";
import JSZip from "jszip";

export default function ImageOutput({ convertedUrl = [], loading }) {
  const handleDownload = useCallback(async (url, filename) => {
    if (!url || url === "null") {
      alert("Invalid download URL");
      return;
    }
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to download file");
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (!convertedUrl.length) return;
    const zip = new JSZip();

    for (const file of convertedUrl) {
      try {
        const resp = await fetch(file.url);
        if (!resp.ok) continue;
        const blob = await resp.blob();
        zip.file(file.name, blob);
      } catch (err) {
        console.error(`Failed to fetch ${file.name}`, err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "DesiPix.zip"; // <-- folder name updated here
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, [convertedUrl]);

  const validFiles = useMemo(
    () => convertedUrl.filter((f) => f.url && f.url !== "null"),
    [convertedUrl]
  );

  return (
    <div className="w-full md:w-1/2 bg-gray-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Converted Image</h2>

      {loading && (
        <div className="flex justify-center items-center w-full mb-4">
          <ComponentLoader />
        </div>
      )}

      {!loading && validFiles.length === 0 && (
        <div className="text-gray-500">
          Your converted image will appear here after processing.
        </div>
      )}

      {!loading && validFiles.length > 0 && (
        <>
          <div
            role="list"
            className="max-h-96 overflow-y-auto flex flex-col gap-3"
          >
            {validFiles.map((file) => {
              const actionButton = (
                <button
                  type="button"
                  title={`Download ${file.name}`}
                  onClick={() => handleDownload(file.url, file.name)}
                  aria-label={`Download ${file.name}`}
                  className="bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-white rounded px-4 py-2 text-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden" aria-hidden>
                    ⬇
                  </span>
                </button>
              );
              return (
                <FileCard
                  key={`${file.name}_${file.url}`}
                  entry={file}
                  actionButton={actionButton}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleDownloadAll}
            aria-label="Download all images as ZIP"
            title="Download all images as ZIP"
            className={`transition duration-200 text-white px-6 py-2 rounded shadow-md mt-8
    ${
      loading || !validFiles.length
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-indigo-900 hover:bg-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }`}
            disabled={loading || !validFiles.length}
          >
            Download All
          </button>
        </>
      )}
    </div>
  );
}
