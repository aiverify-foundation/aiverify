export function validateNewPluginFile(file: File): {
  isValid: boolean;
  msg?: string;
} {
  const maxFileSizeInMB = 5;
  const fileNameParts = file.name.split('.');
  if (file.type.indexOf('zip') == -1) {
    return { isValid: false, msg: 'Invalid file type (mime)' };
  }
  if (
    fileNameParts.length <= 1 ||
    fileNameParts[fileNameParts.length - 1].toLowerCase() !== 'zip'
  ) {
    return { isValid: false, msg: 'Invalid file type (filename extension)' };
  }
  if (file.size > maxFileSizeInMB * 1000000) {
    return { isValid: false, msg: 'Maximum filesize allowed is 5mb' };
  }
  return { isValid: true };
}
