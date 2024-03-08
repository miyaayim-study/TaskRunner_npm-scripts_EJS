import { deleteAsync } from 'del';
import chalk from 'chalk';
import dir from './dir.mjs';

const deleteTask = async ({ mode, path }) => {
  const deleteMode = mode;
  const deletePath = path;
  try {
    switch (deleteMode) {
      case 'one':
        const deletedOneFile = await deleteAsync([deletePath]);
        // await console.log('Deleted one file.:', chalk.underline(deletedOneFile.join('\n')));
        break;

      case 'all':
        const deletedAllFiles = await deleteAsync([dir.dist.root]);
        // await console.log('Deleted ALL files.:', chalk.underline(deletedAllFiles.join('\n')));
        break;

      case 'html':
        const deletedHtmlFiles = await deleteAsync(['./dist/**/*.html']);
        // const deletedHtmlFiles = await deleteAsync([dir.dist.html + '**/*.html']);
        // await console.log('Deleted HTML files.:\n', chalk.underline(deletedHtmlFiles.join('\n')));
        break;

      case 'css':
        const deletedCssFiles = await deleteAsync([dir.dist.css]);
        // await console.log('Deleted CSS files.:', chalk.underline(deletedCssFiles.join('\n')));
        break;

      case 'js':
        const deletedJsFiles = await deleteAsync([dir.dist.js]);
        // await console.log('Deleted JS files.:', chalk.underline(deletedJsFiles.join('\n')));
        break;

      case 'img':
        const deletedImgFiles = await deleteAsync([dir.dist.img]);
        // await console.log('Deleted IMG files.:', chalk.underline(deletedImgFiles.join('\n')));
        break;

      case 'font':
        const deletedFontFiles = await deleteAsync([dir.dist.font]);
        // await console.log('Deleted IMG files.:', chalk.underline(deletedImgFiles.join('\n')));
        break;

      default:
        // await console.log(`Failed to delete. Invalid mode. Please specify ${chalk.underline(deleteMode)} correctly.`);
        break;
    }
  } catch {
    await console.error(
      `Error in ${chalk.underline('deleteTask')}.: ${chalk.bold.italic.bgRed(error.name)} ${chalk.red(error.message)}`,
    );
  }
};

export default deleteTask;
