import path from 'path';

// パス内に'_'で始まるディレクトリ名、ファイル名があるかをチェックし、その結果を返す関数
const isExcludedPath = ({ basePath, targetPath }) => {
  const relativePath = path.relative(basePath, targetPath);
  const pathSegments = relativePath.split(path.sep);
  return pathSegments.some((segment) => segment.startsWith('_'));
};

export default isExcludedPath;
