import React from "react";
import { getPreviewUrl } from "../utils/imageHelpers";

const FileCard = React.memo(({ entry, onRemove, actionButton }) => {
  const preview = getPreviewUrl(entry);
  const name = entry?.file?.name ?? entry?.name ?? "file";
  const ext = (name.split(".").pop() || "").toUpperCase();

  return (
    <div role="listitem" className="flex items-center gap-3 border p-2 bg-white rounded shadow-sm">
      <div className="relative w-20 h-20 flex-shrink-0"> 
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove ${name}`}
            title={`Remove ${name}`}
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-indigo-900 text-white rounded-full p-1 text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            ✕
          </button>
        )}
        <img
          src={preview}
          alt={name}
          className="w-20 h-20 object-cover border rounded bg-white"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col justify-between overflow-hidden flex-1">
        <p className="text-sm font-medium truncate max-w-[200px]" title={name}>{name}</p>
        <p className="text-xs text-gray-500 uppercase">{ext}</p>
      </div>

      {actionButton && <div className="flex-shrink-0 ml-2">{actionButton}</div>}
    </div>
  );
});

export default FileCard;
