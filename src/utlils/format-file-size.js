const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes <= 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );

  const readableSize = `${+(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;

  return readableSize;
};

export {formatFileSize};
