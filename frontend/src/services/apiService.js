// services/apiService.js
import axios from "axios";

export async function uploadAndConvert(files, targetFormat, onProgress) {
  const formData = new FormData();
  
  for (const file of files) {
    formData.append("Image", file); // multiple "Image" entries
  }
  formData.append("Format", targetFormat);

  const response = await axios.post("http://localhost:8080/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "json",
    timeout: 120000,
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      }
    },
  });

//   return {
//     blob: new Blob([response.data], { type: response.headers["content-type"] }),
//     filename:
//       response.headers["x-converted-filename"] ||
//       file.name.replace(/\.[^.]+$/, "." + targetFormat),
//   };
  console.log(response.data);
  
  return response.data;
}
